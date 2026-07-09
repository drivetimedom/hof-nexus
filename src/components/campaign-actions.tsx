import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateCampaignStatus,
  updateCampaign,
  duplicateCampaign,
  getCampaignDetails,
} from "@/lib/meta.functions";

type Row = { id: string; name: string; status: string };

export function CampaignActions({ campaign }: { campaign: Row }) {
  const [open, setOpen] = useState<"toggle" | "edit" | "duplicate" | null>(null);
  const isPaused = campaign.status === "pausada";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="inline-flex size-8 items-center justify-center rounded-md text-t2 transition hover:bg-glass-strong hover:text-t1"
            aria-label="Ações"
          >
            <MoreHorizontal className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onSelect={() => setOpen("toggle")}>
            {isPaused ? "Ativar" : "Pausar"}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setOpen("edit")}>
            Editar campanha
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setOpen("duplicate")}>
            Duplicar campanha
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {open === "toggle" && (
        <ToggleDialog
          campaign={campaign}
          isPaused={isPaused}
          onClose={() => setOpen(null)}
        />
      )}
      {open === "edit" && (
        <EditDialog campaign={campaign} onClose={() => setOpen(null)} />
      )}
      {open === "duplicate" && (
        <DuplicateDialog campaign={campaign} onClose={() => setOpen(null)} />
      )}
    </>
  );
}

function useInvalidateCampaigns() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["campaigns"] });
}

function ToggleDialog({
  campaign,
  isPaused,
  onClose,
}: {
  campaign: Row;
  isPaused: boolean;
  onClose: () => void;
}) {
  const fn = useServerFn(updateCampaignStatus);
  const invalidate = useInvalidateCampaigns();
  const mut = useMutation({
    mutationFn: () =>
      fn({ data: { campaignId: campaign.id, status: isPaused ? "ACTIVE" : "PAUSED" } }),
    onSuccess: () => {
      toast.success(isPaused ? "Campanha ativada." : "Campanha pausada.");
      invalidate();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isPaused ? "Ativar campanha" : "Pausar campanha"}</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja {isPaused ? "ativar" : "pausar"} a campanha{" "}
            <span className="font-medium text-t1">{campaign.name}</span>?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={mut.isPending}>
            Cancelar
          </Button>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
            {mut.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DuplicateDialog({ campaign, onClose }: { campaign: Row; onClose: () => void }) {
  const fn = useServerFn(duplicateCampaign);
  const invalidate = useInvalidateCampaigns();
  const mut = useMutation({
    mutationFn: () => fn({ data: { campaignId: campaign.id } }),
    onSuccess: () => {
      toast.success("Campanha duplicada (pausada para revisão).");
      invalidate();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Duplicar campanha</DialogTitle>
          <DialogDescription>
            Deseja duplicar a campanha{" "}
            <span className="font-medium text-t1">{campaign.name}</span>? A cópia
            será criada pausada para revisão antes de ativar.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={mut.isPending}>
            Cancelar
          </Button>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
            {mut.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Duplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function EditDialog({ campaign, onClose }: { campaign: Row; onClose: () => void }) {
  const getDetails = useServerFn(getCampaignDetails);
  const update = useServerFn(updateCampaign);
  const invalidate = useInvalidateCampaigns();

  const details = useQuery({
    queryKey: ["campaign-details", campaign.id],
    queryFn: () => getDetails({ data: { campaignId: campaign.id } }),
  });

  const [name, setName] = useState<string>(campaign.name);
  const [budget, setBudget] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [stopTime, setStopTime] = useState<string>("");
  const [hydrated, setHydrated] = useState(false);

  if (details.data && !hydrated) {
    setName(details.data.name ?? campaign.name);
    setBudget(details.data.dailyBudget ? String(details.data.dailyBudget) : "");
    setStartTime(toDateInput(details.data.startTime));
    setStopTime(toDateInput(details.data.stopTime));
    setHydrated(true);
  }

  const mut = useMutation({
    mutationFn: () =>
      update({
        data: {
          campaignId: campaign.id,
          name: name !== details.data?.name ? name : undefined,
          dailyBudget: budget ? Number(budget.replace(",", ".")) : null,
          startTime: startTime || null,
          stopTime: stopTime || null,
        },
      }),
    onSuccess: () => {
      toast.success("Campanha atualizada.");
      invalidate();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar campanha</DialogTitle>
          <DialogDescription>Ajustes são aplicados diretamente no Meta Ads.</DialogDescription>
        </DialogHeader>

        {details.isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-t2" />
          </div>
        ) : details.isError ? (
          <div className="rounded-md border border-rose-500/20 bg-rose-500/5 p-3 text-sm text-rose-400">
            {(details.error as Error).message}
          </div>
        ) : (
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="c-name">Nome</Label>
              <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="c-budget">Orçamento diário (R$)</Label>
              <Input
                id="c-budget"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="Ex: 50.00"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="c-start">Início</Label>
                <Input
                  id="c-start"
                  type="date"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="c-stop">Término</Label>
                <Input
                  id="c-stop"
                  type="date"
                  value={stopTime}
                  onChange={(e) => setStopTime(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={mut.isPending}>
            Cancelar
          </Button>
          <Button
            onClick={() => mut.mutate()}
            disabled={mut.isPending || details.isLoading || details.isError}
          >
            {mut.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

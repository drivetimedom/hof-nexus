import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Plus,
  FileText,
  Loader2,
  ExternalLink,
  Link2,
  Trash2,
  Calendar,
} from "lucide-react";
import {
  listReports,
  generateReport,
  deleteReport,
  type ReportPeriodPreset,
} from "@/lib/reports.functions";

export const Route = createFileRoute("/_authenticated/reports")({
  component: ReportsPage,
});

const PRESETS: Array<{ key: ReportPeriodPreset; label: string; hint: string }> = [
  { key: "today", label: "Hoje", hint: "Movimento de hoje" },
  { key: "yesterday", label: "Ontem", hint: "Dia anterior completo" },
  { key: "7d", label: "Últimos 7 dias", hint: "Visão semanal" },
  { key: "30d", label: "Últimos 30 dias", hint: "Padrão mensal" },
  { key: "this_month", label: "Este mês", hint: "Do dia 1 até hoje" },
  { key: "last_month", label: "Mês anterior", hint: "Mês fechado" },
  { key: "custom", label: "Personalizado", hint: "Escolha o intervalo" },
];

function ReportsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchList = useServerFn(listReports);
  const runGenerate = useServerFn(generateReport);
  const runDelete = useServerFn(deleteReport);

  const reports = useQuery({ queryKey: ["reports"], queryFn: () => fetchList() });

  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState<ReportPeriodPreset>("30d");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const generateMut = useMutation({
    mutationFn: () =>
      runGenerate({
        data: {
          preset,
          startDate: preset === "custom" ? startDate : undefined,
          endDate: preset === "custom" ? endDate : undefined,
        },
      }),
    onSuccess: (res) => {
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Relatório gerado.");
      navigate({ to: "/reports/$id", params: { id: res.id } });
    },
    onError: (err: unknown) => toast.error((err as Error).message || "Falha ao gerar."),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => runDelete({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Relatório removido.");
    },
  });

  return (
    <AppShell title="Relatórios" subtitle="Materiais executivos para sua operação">
      <div className="surface-panel relative mb-8 overflow-hidden p-7 sm:p-9">
        <div className="hero-glow pointer-events-none absolute inset-0" />
        <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              <span className="size-1.5 rounded-full bg-primary shadow-[0_0_10px_var(--primary)]" />
              Material institucional
            </div>
            <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Relatório executivo em poucos cliques
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Gere um relatório com identidade visual premium usando os dados reais sincronizados da
              Meta Ads. Compartilhe um link privado ou exporte em PDF para apresentar ao cliente.
            </p>
          </div>
          <Button onClick={() => setOpen(true)} className="h-11 px-6">
            <Plus className="size-4" /> Gerar novo relatório
          </Button>
        </div>
      </div>

      <div className="surface-panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-7">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Histórico
            </div>
            <h3 className="mt-1 font-display text-lg font-semibold tracking-tight">
              Relatórios gerados
            </h3>
          </div>
          <span className="text-xs text-muted-foreground">
            {reports.isLoading ? "carregando…" : `${reports.data?.length ?? 0} relatórios`}
          </span>
        </div>

        {reports.isLoading ? (
          <div className="grid place-items-center px-7 py-16">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (reports.data?.length ?? 0) === 0 ? (
          <div className="px-7 py-16 text-center text-sm text-muted-foreground">
            <FileText className="mx-auto mb-3 size-7 text-muted-foreground/50" />
            Nenhum relatório ainda. Clique em <strong>Gerar novo relatório</strong> para começar.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {reports.data!.map((r) => (
              <li
                key={r.id}
                className="flex flex-col gap-3 px-5 py-4 transition hover:bg-card/40 sm:flex-row sm:items-center sm:px-7"
              >
                <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-card">
                  <FileText className="size-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{r.title ?? "Relatório"}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="size-3" />
                      {fmtDate(r.period_start)} → {fmtDate(r.period_end)}
                    </span>
                    {r.account_name && <span>· {r.account_name}</span>}
                    <span>· gerado em {fmtDateTime(r.created_at)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link to="/reports/$id" params={{ id: r.id }}>
                    <Button variant="outline" size="sm" className="h-9">
                      <ExternalLink className="size-3.5" /> Abrir
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9"
                    onClick={() => {
                      const url = `${window.location.origin}/r/${r.report_token}`;
                      navigator.clipboard.writeText(url);
                      toast.success("Link público copiado.");
                    }}
                  >
                    <Link2 className="size-3.5" /> Copiar link
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 text-rose-300 hover:text-rose-200"
                    onClick={() => {
                      if (confirm("Remover este relatório?")) deleteMut.mutate(r.id);
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Gerar novo relatório</DialogTitle>
            <DialogDescription>
              Selecione o período. Usamos os dados reais sincronizados da sua conta Meta Ads.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPreset(p.key)}
                className={`flex flex-col items-start rounded-xl border p-4 text-left transition ${
                  preset === p.key
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card/40 hover:border-white/15"
                }`}
              >
                <span className="text-sm font-semibold">{p.label}</span>
                <span className="mt-0.5 text-[11px] text-muted-foreground">{p.hint}</span>
              </button>
            ))}
          </div>

          {preset === "custom" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="start" className="text-xs">
                  De
                </Label>
                <Input
                  id="start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end" className="text-xs">
                  Até
                </Label>
                <Input
                  id="end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => generateMut.mutate()}
              disabled={
                generateMut.isPending ||
                (preset === "custom" && (!startDate || !endDate))
              }
            >
              {generateMut.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Gerando…
                </>
              ) : (
                "Gerar relatório"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function fmtDate(s: string) {
  return new Date(s + "T00:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
function fmtDateTime(s: string) {
  return new Date(s).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

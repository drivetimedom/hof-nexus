import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import {
  deleteManualEntry,
  getFunnel,
  listManualEntries,
  upsertManualEntry,
} from "@/lib/funnel.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  MousePointerClick,
  MessageSquare,
  CheckCircle2,
  Trophy,
  TrendingDown,
  Plus,
  Trash2,
  Sparkles,
} from "lucide-react";

type Period = "7d" | "30d";

export const Route = createFileRoute("/_authenticated/funnel")({
  component: FunnelPage,
});

const STAGE_ICON: Record<string, typeof MousePointerClick> = {
  clicks: MousePointerClick,
  conversations: MessageSquare,
  qualified: CheckCircle2,
  sales: Trophy,
};

const fmtInt = (n: number) => Intl.NumberFormat("pt-BR").format(Math.round(n));
const fmtBRL = (n: number) =>
  `R$ ${Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(n)}`;
const fmtPct = (n: number | null) =>
  n == null ? "—" : `${n.toFixed(1).replace(".", ",")}%`;

function FunnelPage() {
  const qc = useQueryClient();
  const [period, setPeriod] = useState<Period>("30d");
  const [open, setOpen] = useState(false);

  const funnelQ = useQuery({
    queryKey: ["funnel", period],
    queryFn: () => getFunnel({ data: { period } }),
    refetchInterval: 60_000,
  });
  const entriesQ = useQuery({
    queryKey: ["funnel-manual", period],
    queryFn: () => listManualEntries({ data: { period } }),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteManualEntry({ data: { id } }),
    onSuccess: () => {
      toast.success("Registro excluído.");
      qc.invalidateQueries({ queryKey: ["funnel"] });
      qc.invalidateQueries({ queryKey: ["funnel-manual"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const funnel = funnelQ.data;
  const maxStage = useMemo(() => {
    if (!funnel) return 0;
    return Math.max(...funnel.stages.map((s) => s.total), 1);
  }, [funnel]);

  return (
    <AppShell
      title="Funil de Conversão"
      subtitle="Do clique no criativo do WhatsApp até a venda final"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
          {funnel && (
            <span className="text-xs text-muted-foreground">
              {new Date(funnel.startDate).toLocaleDateString("pt-BR")} —{" "}
              {new Date(funnel.endDate).toLocaleDateString("pt-BR")}
            </span>
          )}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" />
              Registrar dados manuais
            </Button>
          </DialogTrigger>
          <ManualEntryDialog
            onSaved={() => {
              setOpen(false);
              qc.invalidateQueries({ queryKey: ["funnel"] });
              qc.invalidateQueries({ queryKey: ["funnel-manual"] });
            }}
          />
        </Dialog>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard label="Investimento" value={funnel ? fmtBRL(funnel.totalSpend) : "—"} />
        <SummaryCard label="Receita" value={funnel ? fmtBRL(funnel.totalRevenue) : "—"} />
        <SummaryCard
          label="ROAS"
          value={
            funnel && funnel.totalSpend > 0
              ? (funnel.totalRevenue / funnel.totalSpend).toFixed(2).replace(".", ",") + "x"
              : "—"
          }
        />
        <SummaryCard
          label="Taxa de conversão geral"
          value={
            funnel && funnel.stages[0].total > 0
              ? fmtPct((funnel.stages[3].total / funnel.stages[0].total) * 100)
              : "—"
          }
          sub="Cliques → Vendas"
        />
      </div>

      {/* Funnel */}
      <div className="mt-8 surface-glass rounded-2xl p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">
              Etapas do funil
            </h2>
            <p className="text-xs text-muted-foreground">
              Dados Meta Ads sincronizados + entradas manuais somadas
            </p>
          </div>
          {funnel?.bottleneckKey && (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] text-amber-200">
              <TrendingDown className="size-3.5" />
              Gargalo identificado
            </div>
          )}
        </div>

        {funnelQ.isLoading && (
          <div className="py-20 text-center text-sm text-muted-foreground">
            Carregando funil…
          </div>
        )}

        {funnel && (
          <div className="space-y-4">
            {funnel.stages.map((stage, idx) => {
              const Icon = STAGE_ICON[stage.key] ?? Sparkles;
              const widthPct = Math.max((stage.total / maxStage) * 100, 6);
              const isBottleneck = funnel.bottleneckKey === stage.key;
              return (
                <div key={stage.key} className="relative">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className={`grid size-7 place-items-center rounded-md border ${
                          isBottleneck
                            ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                            : "border-border bg-card text-primary"
                        }`}
                      >
                        <Icon className="size-3.5" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {stage.label}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {stage.description}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-right">
                      {stage.conversionRate != null && (
                        <div>
                          <div
                            className={`text-[10px] uppercase tracking-wider ${
                              isBottleneck ? "text-amber-300" : "text-muted-foreground"
                            }`}
                          >
                            Conversão
                          </div>
                          <div
                            className={`text-sm font-semibold ${
                              isBottleneck ? "text-amber-200" : "text-foreground"
                            }`}
                          >
                            {fmtPct(stage.conversionRate)}
                          </div>
                        </div>
                      )}
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          CPA
                        </div>
                        <div className="text-sm font-semibold">
                          {stage.cpa == null ? "—" : fmtBRL(stage.cpa)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Volume
                        </div>
                        <div className="font-display text-lg font-semibold tracking-tight">
                          {fmtInt(stage.total)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="relative h-12 overflow-hidden rounded-lg border border-border bg-card/40">
                    <div
                      className="relative h-full rounded-lg transition-all"
                      style={{
                        width: `${widthPct}%`,
                        background: isBottleneck
                          ? "linear-gradient(90deg, rgba(245,158,11,0.25), rgba(245,158,11,0.05))"
                          : "var(--gradient-accent)",
                        boxShadow: isBottleneck
                          ? "inset 0 0 0 1px rgba(245,158,11,0.4)"
                          : "0 0 40px -10px var(--primary)",
                      }}
                    >
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-white/5 to-transparent" />
                    </div>
                  </div>
                  {idx < funnel.stages.length - 1 && (
                    <div className="mx-auto mt-2 h-3 w-px bg-gradient-to-b from-border to-transparent" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual entries log */}
      <div className="mt-8 surface-glass rounded-2xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-base font-semibold tracking-tight">
              Registros manuais
            </h3>
            <p className="text-xs text-muted-foreground">
              Conversas, qualificação e vendas registradas pelo mentorado
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Data</th>
                <th className="px-3 py-2 font-medium">Conversas</th>
                <th className="px-3 py-2 font-medium">Qualificados</th>
                <th className="px-3 py-2 font-medium">Vendas</th>
                <th className="px-3 py-2 font-medium">Receita</th>
                <th className="px-3 py-2 font-medium">Notas</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {entriesQ.isLoading && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                    Carregando…
                  </td>
                </tr>
              )}
              {!entriesQ.isLoading && (entriesQ.data?.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                    Nenhum registro neste período. Adicione o primeiro para alimentar o funil.
                  </td>
                </tr>
              )}
              {entriesQ.data?.map((e) => (
                <tr key={e.id} className="border-b border-border/60 last:border-0">
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {new Date(e.date).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-3 py-2">{fmtInt(e.conversations)}</td>
                  <td className="px-3 py-2">{fmtInt(e.qualified_leads)}</td>
                  <td className="px-3 py-2">{fmtInt(e.sales_count)}</td>
                  <td className="px-3 py-2">{fmtBRL(Number(e.sales_revenue))}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {e.notes || "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => del.mutate(e.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

function SummaryCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="surface-glass rounded-xl p-5">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 font-display text-2xl font-semibold tracking-tight">
        {value}
      </div>
      {sub && <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function ManualEntryDialog({ onSaved }: { onSaved: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [conversations, setConversations] = useState(0);
  const [qualified, setQualified] = useState(0);
  const [sales, setSales] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await upsertManualEntry({
        data: {
          date,
          conversations,
          qualified_leads: qualified,
          sales_count: sales,
          sales_revenue: revenue,
          notes: notes || null,
        },
      });
      toast.success("Registro salvo.");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Registrar dados do funil</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Data</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <p className="text-[11px] text-muted-foreground">
            Já existe um registro para esta data? Os valores serão atualizados.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumField label="Conversas iniciadas" value={conversations} onChange={setConversations} />
          <NumField label="Leads qualificados" value={qualified} onChange={setQualified} />
          <NumField label="Vendas" value={sales} onChange={setSales} />
          <NumField label="Receita (R$)" value={revenue} onChange={setRevenue} step="0.01" />
        </div>
        <div className="space-y-1.5">
          <Label>Notas (opcional)</Label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={save} disabled={saving}>
          {saving ? "Salvando…" : "Salvar"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function NumField({
  label,
  value,
  onChange,
  step = "1",
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  step?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type="number"
        min={0}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </div>
  );
}

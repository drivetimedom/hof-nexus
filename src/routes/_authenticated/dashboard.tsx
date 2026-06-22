import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { KpiCard } from "@/components/kpi-card";
import { PerformanceChart } from "@/components/performance-chart";
import { CampaignsTable } from "@/components/campaigns-table";
import { InsightsGrid } from "@/components/insights-grid";
import { getKpis, getSeries, type Period } from "@/lib/mock-data";
import { getOnboardingStatus, getMyMetrics } from "@/lib/meta.functions";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Plug, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const navigate = useNavigate();
  const getStatus = useServerFn(getOnboardingStatus);
  const getMetrics = useServerFn(getMyMetrics);

  const status = useQuery({ queryKey: ["onboarding-status"], queryFn: () => getStatus() });

  useEffect(() => {
    if (status.data && !status.data.onboardingCompleted) {
      navigate({ to: "/onboarding" });
    }
  }, [status.data, navigate]);

  const metaConnected = !!status.data?.meta?.connected;
  const metrics = useQuery({
    queryKey: ["metrics", period],
    queryFn: () => getMetrics({ data: { days: period === "7d" ? 7 : period === "30d" ? 30 : 90 } }),
    enabled: metaConnected,
  });

  if (status.isLoading) {
    return (
      <AppShell title="Centro de decisão">
        <div className="grid h-[60vh] place-items-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (!metaConnected) {
    return (
      <AppShell title="Centro de decisão" subtitle="Conecte sua conta Meta para liberar insights">
        <EmptyState />
      </AppShell>
    );
  }

  const rows = metrics.data?.rows ?? [];
  const hasData = rows.length > 0;
  const kpis = computeKpis(rows);
  const fallbackKpis = getKpis(period);
  const fallbackSeries = getSeries(period);
  const sparkSource = (hasData ? rows.map((r) => Number(r.revenue) || 0) : fallbackSeries.map((s) => s.revenue));

  return (
    <AppShell
      title="Centro de decisão"
      subtitle="Visão consolidada da sua operação"
      period={period}
      onPeriodChange={setPeriod}
    >
      <section>
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Indicadores
            </div>
            <h2 className="mt-1 font-display text-xl font-semibold tracking-tight sm:text-2xl">
              Sinais vitais da operação
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {(hasData ? kpis : fallbackKpis).map((k: ReturnType<typeof getKpis>[number], idx: number) => (
            <KpiCard
              key={k.id}
              kpi={k}
              sparkline={sparkSource.slice(-12).map((v, i) =>
                k.id === "cpl" ? v * 0.001 + i * 0.5 : v * (0.6 + Math.sin(i + idx) * 0.2))}
            />
          ))}
        </div>
        {!hasData && (
          <p className="mt-3 text-xs text-muted-foreground">
            Ainda não há métricas sincronizadas. Os números abaixo são exemplos enquanto sua primeira
            sincronização não termina.
          </p>
        )}
      </section>

      <section className="mt-10">
        <PerformanceChart period={period} />
      </section>

      <section className="mt-10 grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
        <CampaignsTable limit={5} />
        <div className="surface-panel p-5 sm:p-7">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Insights Estratégicos
              </div>
              <h3 className="mt-1 font-display text-lg font-semibold tracking-tight">
                Decisões recomendadas
              </h3>
            </div>
            <Link to="/insights" className="inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-primary">
              Ver todos <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="mt-5">
            <InsightsGridSimple />
          </div>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Insights Estratégicos
            </div>
            <h2 className="mt-1 font-display text-xl font-semibold tracking-tight sm:text-2xl">
              O que está movendo seu crescimento
            </h2>
          </div>
        </div>
        <InsightsGrid limit={3} />
      </section>
    </AppShell>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto mt-12 grid max-w-2xl place-items-center text-center">
      <div className="surface-panel w-full p-10">
        <div className="mx-auto grid size-14 place-items-center rounded-xl bg-[var(--gradient-accent)]">
          <Plug className="size-6 text-primary-foreground" />
        </div>
        <h2 className="mt-5 font-display text-2xl font-semibold tracking-tight">
          Conecte sua conta Meta Ads
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Para visualizar seus indicadores e insights estratégicos, conecte sua conta de anúncios.
          Levamos menos de 1 minuto para sincronizar os últimos 30 dias.
        </p>
        <Link to="/onboarding" className="mt-6 inline-block">
          <Button className="h-11 px-6">Conectar Meta Ads</Button>
        </Link>
      </div>
    </div>
  );
}

function computeKpis(
  rows: Array<{
    spend: number | string;
    impressions: number | string;
    clicks: number | string;
    leads: number;
    purchases: number;
    revenue: number | string;
  }>
) {
  const sum = (k: keyof (typeof rows)[number]) => rows.reduce((acc, r) => acc + Number(r[k] ?? 0), 0);
  const spend = sum("spend");
  const impressions = sum("impressions");
  const clicks = sum("clicks");
  const leads = sum("leads");
  const revenue = sum("revenue");
  const cpl = leads > 0 ? spend / leads : 0;
  const roas = spend > 0 ? revenue / spend : 0;
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  return [
    { id: "spend", label: "Investimento", value: brl(spend), delta: 0, suffix: "" },
    { id: "revenue", label: "Receita", value: brl(revenue), delta: 0, suffix: "" },
    { id: "roas", label: "ROAS", value: roas.toFixed(2), delta: 0, suffix: "x" },
    { id: "cpl", label: "CPL", value: brl(cpl), delta: 0, suffix: "" },
    { id: "leads", label: "Leads", value: leads.toLocaleString("pt-BR"), delta: 0, suffix: "" },
    { id: "clicks", label: "Cliques", value: clicks.toLocaleString("pt-BR"), delta: 0, suffix: "" },
    { id: "impressions", label: "Impressões", value: impressions.toLocaleString("pt-BR"), delta: 0, suffix: "" },
    { id: "ctr", label: "CTR", value: ctr.toFixed(2), delta: 0, suffix: "%" },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ] as any;
}

function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function InsightsGridSimple() {
  const items = [
    { t: "CPL ↓ 12% em 7 dias", b: "Otimização de criativos." },
    { t: "Mentoria Black pronta p/ escala", b: "+30% recomendado." },
    { t: "Awareness | Marca abaixo", b: "ROAS 1.4x — sugestão pausar." },
  ];
  return (
    <ul className="space-y-2.5">
      {items.map((i) => (
        <li key={i.t} className="flex items-start gap-3 rounded-lg border border-border bg-card/40 p-3">
          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary shadow-[0_0_10px_var(--primary)]" />
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{i.t}</div>
            <div className="text-xs text-muted-foreground">{i.b}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}

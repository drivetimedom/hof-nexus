import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { KpiCard } from "@/components/kpi-card";
import { PerformanceChart } from "@/components/performance-chart";
import { CampaignsTable } from "@/components/campaigns-table";
import { InsightsGrid } from "@/components/insights-grid";
import { type Period } from "@/lib/mock-data";
import { getOnboardingStatus, getMyMetrics } from "@/lib/meta.functions";
import { Link } from "@tanstack/react-router";
import { Plug, Loader2 } from "lucide-react";
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

  const meta = status.data?.meta;
  const metaConnected = !!meta?.connected;
  const adAccountId = meta && "adAccountId" in meta ? meta.adAccountId ?? null : null;
  const metrics = useQuery({
    queryKey: ["metrics", period],
    queryFn: () => getMetrics({ data: { days: period === "7d" ? 7 : period === "30d" ? 30 : 90 } }),
    enabled: metaConnected && !!adAccountId,
  });

  if (status.isLoading) {
    return (
      <AppShell title="Centro de decisão">
        <div className="grid h-[60vh] place-items-center">
          <Loader2 className="size-6 animate-spin text-t2" />
        </div>
      </AppShell>
    );
  }

  if (!metaConnected) {
    return (
      <AppShell title="Centro de decisão" subtitle="Conecte sua conta Meta para liberar insights">
        <EmptyState
          title="Conecte sua conta Meta Ads"
          description="Para visualizar seus indicadores e insights estratégicos, conecte sua conta de anúncios. Levamos menos de 1 minuto para sincronizar os últimos 30 dias."
          cta="Conectar Meta Ads"
          to="/onboarding"
        />
      </AppShell>
    );
  }

  if (!adAccountId) {
    return (
      <AppShell title="Centro de decisão" subtitle="Selecione sua conta de anúncios para começar">
        <EmptyState
          title="Selecione sua conta de anúncios"
          description="Sua conexão Meta está ativa, mas nenhuma conta de anúncios foi escolhida ainda. Selecione uma para liberar seus indicadores."
          cta="Selecionar conta"
          to="/onboarding"
        />
      </AppShell>
    );
  }

  const rows = metrics.data?.rows ?? [];
  const hasData = rows.length > 0;
  const kpis = computeKpis(rows);
  const sparkSource = rows.map((r) => Number(r.revenue) || 0);

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
            <div className="text-[11px] font-medium uppercase tracking-wider text-t2">
              Indicadores
            </div>
            <h2 className="mt-1 font-display text-xl font-semibold tracking-tight text-t1 sm:text-2xl">
              Sinais vitais da operação
            </h2>
          </div>
        </div>
        {metrics.isLoading ? (
          <div className="grid h-32 place-items-center">
            <Loader2 className="size-5 animate-spin text-t2" />
          </div>
        ) : hasData ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {kpis.map((k, idx: number) => (
              <KpiCard
                key={k.id}
                kpi={k}
                sparkline={sparkSource.slice(-12).map((v, i) =>
                  k.id === "cpl" ? v * 0.001 + i * 0.5 : v * (0.6 + Math.sin(i + idx) * 0.2))}
              />
            ))}
          </div>
        ) : (
          <div className="surface-panel p-8 text-sm text-t2">
            Ainda não há métricas sincronizadas para o período. Use “Sincronizar agora” em
            Configurações → Meta Ads para coletar os dados da conta conectada.
          </div>
        )}
      </section>

      <section className="mt-10">
        <PerformanceChart period={period} rows={rows} />
      </section>

      <section className="mt-10">
        <CampaignsTable limit={5} days={period === "7d" ? 7 : period === "30d" ? 30 : 90} />
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

function EmptyState({
  title,
  description,
  cta,
  to,
}: {
  title: string;
  description: string;
  cta: string;
  to: "/onboarding";
}) {
  return (
    <div className="mx-auto mt-12 grid max-w-2xl place-items-center text-center">
      <div className="surface-panel w-full p-10">
        <div className="mx-auto grid size-14 place-items-center rounded-xl bg-[var(--gradient-accent)]">
          <Plug className="size-6 text-primary-foreground" />
        </div>
        <h2 className="mt-5 font-display text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
        <Link to={to} className="mt-6 inline-block">
          <Button className="h-11 px-6">{cta}</Button>
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
): import("@/lib/mock-data").Kpi[] {
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
    { id: "spend", label: "Investimento", raw: spend, value: brl(spend), delta: 0, format: "currency", hint: "Total aplicado em mídia" },
    { id: "revenue", label: "Receita", raw: revenue, value: brl(revenue), delta: 0, format: "currency", hint: "Receita atribuída" },
    { id: "roas", label: "ROAS", raw: roas, value: `${roas.toFixed(2)}x`, delta: 0, format: "decimal", hint: "Retorno sobre investimento" },
    { id: "cpl", label: "CPL", raw: cpl, value: brl(cpl), delta: 0, format: "decimal", hint: "Custo por lead" },
    { id: "leads", label: "Leads", raw: leads, value: leads.toLocaleString("pt-BR"), delta: 0, format: "number", hint: "Capturas qualificadas" },
    { id: "clicks", label: "Cliques", raw: clicks, value: clicks.toLocaleString("pt-BR"), delta: 0, format: "number", hint: "Total de cliques" },
    { id: "impressions", label: "Impressões", raw: impressions, value: impressions.toLocaleString("pt-BR"), delta: 0, format: "number", hint: "Impressões totais" },
    { id: "ctr", label: "CTR", raw: ctr, value: `${ctr.toFixed(2)}%`, delta: 0, format: "decimal", hint: "Taxa de cliques" },
  ];
}

function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}


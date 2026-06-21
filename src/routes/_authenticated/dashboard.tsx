import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { KpiCard } from "@/components/kpi-card";
import { PerformanceChart } from "@/components/performance-chart";
import { CampaignsTable } from "@/components/campaigns-table";
import { InsightsGrid } from "@/components/insights-grid";
import { getKpis, getSeries, type Period } from "@/lib/mock-data";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const kpis = getKpis(period);
  const series = getSeries(period);
  const sparkSource = series.map((s) => s.revenue);

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
          {kpis.map((k) => (
            <KpiCard
              key={k.id}
              kpi={k}
              sparkline={sparkSource.slice(-12).map((v, i) =>
                k.id === "cpl" ? v * 0.001 + i * 0.5 : v * (0.6 + Math.sin(i) * 0.2))}
            />
          ))}
        </div>
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
          <div className="mt-5 space-y-3">
            {Array.from({ length: 3 }).map((_, idx) => {
              const i = idx;
              return null;
            })}
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

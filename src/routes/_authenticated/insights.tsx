import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { InsightsGrid } from "@/components/insights-grid";

export const Route = createFileRoute("/_authenticated/insights")({
  component: InsightsPage,
});

function InsightsPage() {
  return (
    <AppShell
      title="Insights Estratégicos"
      subtitle="Análises inteligentes para guiar suas próximas decisões"
    >
      <div className="surface-panel mb-8 overflow-hidden p-6 sm:p-8">
        <div className="hero-glow pointer-events-none absolute inset-0" />
        <div className="relative max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-[11px] uppercase tracking-wider text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary shadow-[0_0_10px_var(--primary)]" />
            Análise contínua
          </div>
          <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Onde escalar. Onde proteger.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            A plataforma analisa sua operação 24/7 e destaca os movimentos com maior impacto
            financeiro nas próximas semanas.
          </p>
        </div>
      </div>
      <InsightsGrid />
    </AppShell>
  );
}

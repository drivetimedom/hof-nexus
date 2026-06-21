import { INSIGHTS, type Insight } from "@/lib/mock-data";
import { AlertTriangle, Sparkles, TrendingUp, ArrowRight } from "lucide-react";

const TAG_META: Record<Insight["tag"], { label: string; icon: typeof Sparkles; color: string }> = {
  oportunidade: { label: "Oportunidade", icon: Sparkles, color: "text-primary" },
  alerta: { label: "Alerta", icon: AlertTriangle, color: "text-rose-400" },
  tendencia: { label: "Tendência", icon: TrendingUp, color: "text-emerald-400" },
};

export function InsightsGrid({ limit }: { limit?: number }) {
  const data = limit ? INSIGHTS.slice(0, limit) : INSIGHTS;
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {data.map((i) => {
        const meta = TAG_META[i.tag];
        const Icon = meta.icon;
        return (
          <article
            key={i.id}
            className="surface-panel group relative overflow-hidden p-5 transition hover:border-white/15"
          >
            <div className="absolute -right-12 -top-12 size-40 rounded-full bg-[var(--gradient-accent)] opacity-[0.06] blur-2xl transition group-hover:opacity-[0.12]" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className={`inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${meta.color}`}>
                  <Icon className="size-3" />
                  {meta.label}
                </div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Impacto {i.impact}
                </span>
              </div>
              <h3 className="mt-4 font-display text-base font-semibold leading-snug tracking-tight">
                {i.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{i.body}</p>
              <button className="mt-5 inline-flex items-center gap-1 text-xs font-medium text-foreground/80 transition hover:text-primary">
                Ver análise <ArrowRight className="size-3" />
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

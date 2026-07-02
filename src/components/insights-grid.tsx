import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Sparkles, TrendingUp, RefreshCw, Brain } from "lucide-react";
import { getMyInsights, type AiInsight } from "@/lib/insights.functions";

const TAG_META: Record<
  AiInsight["tag"],
  { label: string; icon: typeof Sparkles; color: string }
> = {
  oportunidade: { label: "Oportunidade", icon: Sparkles, color: "text-primary" },
  alerta: { label: "Alerta", icon: AlertTriangle, color: "text-rose-400" },
  tendencia: { label: "Tendência", icon: TrendingUp, color: "text-emerald-400" },
};

export function InsightsGrid({ limit }: { limit?: number }) {
  const qc = useQueryClient();
  const fetchInsights = useServerFn(getMyInsights);

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["ai-insights"],
    queryFn: () => fetchInsights({ data: { forceRefresh: false } }),
    staleTime: 1000 * 60 * 60, // 1h no cliente
    retry: 1,
  });

  function handleRefresh() {
    qc.invalidateQueries({ queryKey: ["ai-insights"] });
    fetchInsights({ data: { forceRefresh: true } }).then((result) => {
      qc.setQueryData(["ai-insights"], result);
    });
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-4">
        <InsightsHeader generatedAt={null} isFetching={false} onRefresh={handleRefresh} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="surface-panel relative overflow-hidden p-5 transition-ea"
              style={{ background: "var(--glass)", borderColor: "var(--glass-border)" }}
            >
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
              <div className="space-y-3">
                <div className="h-3 w-24 rounded animate-pulse" style={{ background: "var(--glass-strong)" }} />
                <div className="h-4 w-3/4 rounded animate-pulse" style={{ background: "var(--glass-strong)" }} />
                <div className="h-3 w-full rounded animate-pulse" style={{ background: "var(--glass-strong)" }} />
                <div className="h-3 w-5/6 rounded animate-pulse" style={{ background: "var(--glass-strong)" }} />
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-t2 animate-pulse mt-2">
          Analisando sua operação com a metodologia HOF Circle…
        </p>
      </div>
    );
  }

  // ── Sem dados ────────────────────────────────────────────────────────────────
  if (isError || data?.noData || !data?.insights?.length) {
    return (
      <div className="surface-panel p-8 text-center">
        <Brain className="mx-auto size-8 text-t2 mb-3" />
        <p className="text-sm text-t2">
          Ainda não há dados suficientes para gerar insights. Sincronize sua conta Meta Ads e volte
          em breve.
        </p>
      </div>
    );
  }

  const insights = limit ? data.insights.slice(0, limit) : data.insights;

  return (
    <div className="space-y-4">
      <InsightsHeader
        generatedAt={data.generatedAt}
        isFetching={isFetching}
        onRefresh={handleRefresh}
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {insights.map((i) => {
          const meta = TAG_META[i.tag];
          const Icon = meta.icon;
          return (
            <article
              key={i.id}
              className="surface-panel group relative overflow-hidden p-5 hover:border-glass-border-hover"
            >
              <div className="absolute -right-12 -top-12 size-40 rounded-full bg-[var(--gradient-accent)] opacity-[0.06] blur-2xl transition group-hover:opacity-[0.12]" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div
                    className={`inline-flex items-center gap-1.5 rounded-full border border-glass-border bg-glass-strong px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${meta.color}`}
                  >
                    <Icon className="size-3" />
                    {meta.label}
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-t3">
                    Impacto {i.impact}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-base font-semibold leading-snug tracking-tight text-t1">
                  {i.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-t2">{i.body}</p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

// ── Sub-componente cabeçalho ──────────────────────────────────────────────────
function InsightsHeader({
  generatedAt,
  isFetching,
  onRefresh,
}: {
  generatedAt: string | null;
  isFetching: boolean;
  onRefresh: () => void;
}) {
  const formatted = generatedAt
    ? new Date(generatedAt).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="flex items-center justify-between">
      {formatted && (
        <p className="text-[11px] text-t2">
          Análise gerada em {formatted}
        </p>
      )}
      <button
        onClick={onRefresh}
        disabled={isFetching}
        className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-glass-border bg-glass px-3 py-1 text-[11px] font-medium text-t2 transition-ea hover:border-glass-border-hover hover:text-t1 disabled:opacity-50"
      >
        <RefreshCw className={`size-3 ${isFetching ? "animate-spin" : ""}`} />
        Atualizar análise
      </button>
    </div>
  );
}

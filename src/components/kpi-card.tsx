import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { Kpi } from "@/lib/mock-data";

export function KpiCard({ kpi, sparkline }: { kpi: Kpi; sparkline?: number[] }) {
  // CPL is "good when down" — invert delta sentiment
  const isCpl = kpi.id === "cpl";
  const positive = isCpl ? kpi.delta < 0 : kpi.delta > 0;

  return (
    <div className="surface-panel group relative overflow-hidden p-5 hover:border-glass-border-hover">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {kpi.label}
          </div>
          <div className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-[26px]">
            {kpi.value}
          </div>
        </div>
        <div
          className={`flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium ${
            positive
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
              : "border-rose-500/20 bg-rose-500/10 text-rose-400"
          }`}
        >
          {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
          {Math.abs(kpi.delta).toFixed(1)}%
        </div>
      </div>

      {sparkline && <MiniSpark values={sparkline} positive={positive} />}

      <div className="mt-3 text-[11px] text-muted-foreground">{kpi.hint}</div>
    </div>
  );
}

function MiniSpark({ values, positive }: { values: number[]; positive: boolean }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = 100 - ((v - min) / range) * 100;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  const stroke = positive ? "rgb(52 211 153)" : "rgb(244 114 114)";
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="mt-4 h-10 w-full">
      <defs>
        <linearGradient id={`g-${positive}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
      <polygon fill={`url(#g-${positive})`} points={`0,100 ${points} 100,100`} />
    </svg>
  );
}

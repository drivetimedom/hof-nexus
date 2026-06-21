import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getSeries, PERIODS, type Period } from "@/lib/mock-data";

export function PerformanceChart({ period }: { period: Period }) {
  const [metric, setMetric] = useState<"revenue" | "invest" | "leads">("revenue");
  const data = useMemo(() => getSeries(period), [period]);

  const config = {
    revenue: { label: "Faturamento", color: "var(--primary)" },
    invest: { label: "Investimento", color: "oklch(0.68 0.14 220)" },
    leads: { label: "Leads", color: "oklch(0.72 0.16 155)" },
  }[metric];

  return (
    <div className="surface-panel p-5 sm:p-7">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Evolução
          </div>
          <h2 className="mt-1.5 font-display text-xl font-semibold tracking-tight sm:text-2xl">
            Performance — {PERIODS.find((p) => p.id === period)?.label}
          </h2>
        </div>
        <div className="flex shrink-0 rounded-lg border border-border bg-card p-0.5">
          {(["revenue", "invest", "leads"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`rounded-md px-2.5 py-1.5 text-[11px] font-medium transition sm:px-3 sm:text-xs ${
                metric === m
                  ? "bg-background text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m === "revenue" ? "Receita" : m === "invest" ? "Invest." : "Leads"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 h-[280px] w-full sm:h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <defs>
              <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={config.color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={config.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="rgba(255,255,255,0.4)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              minTickGap={20}
            />
            <YAxis
              stroke="rgba(255,255,255,0.4)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={(v: number) =>
                metric === "leads" ? v.toString() : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
              }
            />
            <Tooltip
              cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }}
              contentStyle={{
                background: "oklch(0.18 0.005 280 / 0.9)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                backdropFilter: "blur(12px)",
                fontSize: 12,
              }}
              labelStyle={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}
              formatter={(v: number) => [
                metric === "leads"
                  ? v.toLocaleString("pt-BR")
                  : `R$ ${v.toLocaleString("pt-BR")}`,
                config.label,
              ]}
            />
            <Area
              type="monotone"
              dataKey={metric}
              stroke={config.color}
              strokeWidth={2}
              fill="url(#chart-fill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

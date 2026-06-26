import type { ReportSnapshot, ReportInsight } from "@/lib/reports.functions";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Sparkles, AlertTriangle, TrendingUp, Target } from "lucide-react";

const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const fmtBRL2 = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
const fmtInt = (n: number) => Math.round(n).toLocaleString("pt-BR");
const fmtPct = (n: number) => `${n.toFixed(2)}%`;
const fmtRoas = (n: number) => `${n.toFixed(2)}x`;

const CAT_META: Record<
  ReportInsight["category"],
  { label: string; icon: typeof Sparkles; tone: string }
> = {
  positivo: {
    label: "Ponto positivo",
    icon: TrendingUp,
    tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  },
  oportunidade: {
    label: "Oportunidade",
    icon: Sparkles,
    tone: "border-primary/30 bg-primary/10 text-primary",
  },
  alerta: {
    label: "Alerta",
    icon: AlertTriangle,
    tone: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  },
  recomendacao: {
    label: "Recomendação",
    icon: Target,
    tone: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function ReportView({ snapshot }: { snapshot: ReportSnapshot }) {
  const s = snapshot.summary;
  const positives = snapshot.insights.filter((i) => i.category === "positivo");
  const opportunities = snapshot.insights.filter((i) => i.category === "oportunidade");
  const alerts = snapshot.insights.filter((i) => i.category === "alerta");
  const recommendations = snapshot.insights.filter((i) => i.category === "recomendacao");

  return (
    <div className="report-doc mx-auto w-full max-w-[920px] space-y-6">
      {/* PAGE 1 — COVER */}
      <ReportPage>
        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="absolute inset-x-0 top-0 h-64 bg-[var(--gradient-hero)] opacity-90" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              <span className="size-1.5 rounded-full bg-primary shadow-[0_0_10px_var(--primary)]" />
              {snapshot.brand.name}
            </div>
            <div className="mt-10 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              {snapshot.brand.product}
            </div>
            <h1 className="mt-3 font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
              Relatório de
              <br />
              <span className="text-gradient-accent">Performance</span>
            </h1>
            <div className="mt-10 grid grid-cols-2 gap-x-12 gap-y-6 text-sm">
              <CoverField label="Conta Meta" value={snapshot.account.name ?? "—"} />
              <CoverField label="Identificador" value={snapshot.account.id ?? "—"} />
              <CoverField label="Período analisado" value={snapshot.period.label} />
              <CoverField
                label="Gerado em"
                value={new Date(snapshot.generatedAt).toLocaleString("pt-BR", {
                  dateStyle: "long",
                  timeStyle: "short",
                })}
              />
              {snapshot.user.fullName && (
                <CoverField label="Responsável" value={snapshot.user.fullName} />
              )}
            </div>
          </div>
          <div className="relative mt-12 border-t border-border pt-6 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Inteligência estratégica · Tráfego pago · {new Date(snapshot.generatedAt).getFullYear()}
          </div>
        </div>
      </ReportPage>

      {/* PAGE 2 — EXECUTIVE SUMMARY */}
      <ReportPage>
        <SectionHeader eyebrow="Página 02" title="Resumo Executivo" />
        <div className="px-10 pb-10">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            <BigKpi label="Investimento" value={fmtBRL(s.spend)} accent />
            <BigKpi label="Receita" value={fmtBRL(s.revenue)} />
            <BigKpi label="ROAS" value={fmtRoas(s.roas)} accent={s.roas >= 4} />
            <BigKpi label="Leads" value={fmtInt(s.leads)} />
            <BigKpi label="Conversões" value={fmtInt(s.purchases)} />
            <BigKpi label="CPL" value={fmtBRL2(s.cpl)} />
            <BigKpi label="CPA" value={fmtBRL2(s.cpa)} />
            <BigKpi label="CTR" value={fmtPct(s.ctr)} />
            <BigKpi label="CPC" value={fmtBRL2(s.cpc)} />
            <BigKpi label="CPM" value={fmtBRL2(s.cpm)} />
            <BigKpi label="Impressões" value={fmtInt(s.impressions)} small />
            <BigKpi label="Alcance" value={fmtInt(s.reach)} small />
            <BigKpi label="Cliques" value={fmtInt(s.clicks)} small />
          </div>
        </div>
      </ReportPage>

      {/* PAGE 3 — EVOLUTION */}
      <ReportPage>
        <SectionHeader eyebrow="Página 03" title="Evolução do período" />
        <div className="grid grid-cols-1 gap-4 px-10 pb-10 md:grid-cols-2">
          <ChartCard title="Investimento diário" subtitle="Spend em R$">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={snapshot.series} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="g-spend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <ChartGrid />
                <XAxis dataKey="date" tickFormatter={fmtDate} {...axisProps} />
                <YAxis {...axisProps} tickFormatter={(v) => `R$ ${Math.round(Number(v))}`} />
                <Tooltip content={<TT formatter={(v: number) => fmtBRL(v)} label="Investimento" />} />
                <Area type="monotone" dataKey="spend" stroke="var(--primary)" strokeWidth={2} fill="url(#g-spend)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Leads gerados" subtitle="Volume diário">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={snapshot.series} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <ChartGrid />
                <XAxis dataKey="date" tickFormatter={fmtDate} {...axisProps} />
                <YAxis {...axisProps} />
                <Tooltip content={<TT formatter={fmtInt} label="Leads" />} />
                <Bar dataKey="leads" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Conversões" subtitle="Compras registradas">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={snapshot.series} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <ChartGrid />
                <XAxis dataKey="date" tickFormatter={fmtDate} {...axisProps} />
                <YAxis {...axisProps} />
                <Tooltip content={<TT formatter={fmtInt} label="Conversões" />} />
                <Bar dataKey="purchases" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="ROAS diário" subtitle="Eficiência financeira">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={snapshot.series} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <ChartGrid />
                <XAxis dataKey="date" tickFormatter={fmtDate} {...axisProps} />
                <YAxis {...axisProps} tickFormatter={(v) => `${Number(v).toFixed(1)}x`} />
                <Tooltip content={<TT formatter={(v: number) => fmtRoas(v)} label="ROAS" />} />
                <Line
                  type="monotone"
                  dataKey="roas"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="CTR diário" subtitle="Atenção dos criativos" className="md:col-span-2">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={snapshot.series} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="g-ctr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-4)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--chart-4)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <ChartGrid />
                <XAxis dataKey="date" tickFormatter={fmtDate} {...axisProps} />
                <YAxis {...axisProps} tickFormatter={(v) => `${Number(v).toFixed(1)}%`} />
                <Tooltip content={<TT formatter={(v: number) => fmtPct(v)} label="CTR" />} />
                <Area type="monotone" dataKey="ctr" stroke="var(--chart-4)" strokeWidth={2} fill="url(#g-ctr)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </ReportPage>

      {/* PAGE 4 — CAMPAIGNS */}
      <ReportPage>
        <SectionHeader
          eyebrow="Página 04"
          title="Campanhas"
          right={`${snapshot.campaigns.length} campanhas`}
        />
        <div className="px-10 pb-10">
          {snapshot.campaigns.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Nenhuma campanha encontrada no período.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-border bg-card/40 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Campanha</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 text-right font-medium">Invest.</th>
                    <th className="px-2 py-2 text-right font-medium">Impr.</th>
                    <th className="px-2 py-2 text-right font-medium">Cliques</th>
                    <th className="px-2 py-2 text-right font-medium">CTR</th>
                    <th className="px-2 py-2 text-right font-medium">Leads</th>
                    <th className="px-2 py-2 text-right font-medium">Conv.</th>
                    <th className="px-2 py-2 text-right font-medium">CPA</th>
                    <th className="px-3 py-2 text-right font-medium">ROAS</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.campaigns.map((c) => (
                    <tr key={c.id} className="border-b border-border/60 last:border-0">
                      <td className="px-3 py-2.5">
                        <div className="font-medium">{c.name}</div>
                      </td>
                      <td className="px-2 py-2.5">
                        <span className="rounded-full border border-border bg-card/60 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                          {c.status}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-right tabular-nums">{fmtBRL(c.spend)}</td>
                      <td className="px-2 py-2.5 text-right tabular-nums text-muted-foreground">
                        {fmtInt(c.impressions)}
                      </td>
                      <td className="px-2 py-2.5 text-right tabular-nums text-muted-foreground">
                        {fmtInt(c.clicks)}
                      </td>
                      <td className="px-2 py-2.5 text-right tabular-nums text-muted-foreground">
                        {fmtPct(c.ctr)}
                      </td>
                      <td className="px-2 py-2.5 text-right tabular-nums">{fmtInt(c.leads)}</td>
                      <td className="px-2 py-2.5 text-right tabular-nums">{fmtInt(c.purchases)}</td>
                      <td className="px-2 py-2.5 text-right tabular-nums text-muted-foreground">
                        {c.purchases > 0 ? fmtBRL2(c.spend / c.purchases) : "—"}
                      </td>
                      <td
                        className={`px-3 py-2.5 text-right font-semibold tabular-nums ${
                          c.roas >= 4 ? "text-emerald-400" : c.roas >= 1.5 ? "" : "text-rose-400"
                        }`}
                      >
                        {fmtRoas(c.roas)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </ReportPage>

      {/* PAGE 5 — INSIGHTS */}
      <ReportPage>
        <SectionHeader eyebrow="Página 05" title="Insights estratégicos" />
        <div className="grid grid-cols-1 gap-6 px-10 pb-10 md:grid-cols-2">
          <InsightColumn title="Pontos positivos" items={positives} />
          <InsightColumn title="Oportunidades" items={opportunities} />
          <InsightColumn title="Alertas" items={alerts} />
          <InsightColumn title="Recomendações" items={recommendations} />
        </div>
      </ReportPage>

      {/* PAGE 6 — EXECUTIVE FINAL SUMMARY */}
      <ReportPage>
        <SectionHeader eyebrow="Página 06" title="Resumo final" />
        <div className="px-10 pb-12">
          <div className="surface-panel relative overflow-hidden p-10">
            <div className="absolute -right-24 -top-24 size-72 rounded-full bg-[var(--gradient-accent)] opacity-[0.10] blur-3xl" />
            <div className="relative">
              <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                Síntese executiva
              </div>
              <p className="mt-6 font-display text-xl leading-relaxed tracking-tight md:text-2xl">
                {snapshot.executiveSummary}
              </p>
              <div className="mt-10 grid grid-cols-2 gap-4 border-t border-border pt-6 text-sm md:grid-cols-4">
                <FooterStat label="Investimento" value={fmtBRL(s.spend)} />
                <FooterStat label="ROAS" value={fmtRoas(s.roas)} />
                <FooterStat label="Leads" value={fmtInt(s.leads)} />
                <FooterStat label="Conversões" value={fmtInt(s.purchases)} />
              </div>
            </div>
          </div>
          <div className="mt-8 text-center text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            {snapshot.brand.name} · {snapshot.brand.product}
          </div>
        </div>
      </ReportPage>
    </div>
  );
}

/* =========================================================================
 * Building blocks
 * ========================================================================= */

function ReportPage({ children }: { children: React.ReactNode }) {
  return (
    <section className="report-page surface-panel relative overflow-hidden">
      {children}
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  right,
}: {
  eyebrow: string;
  title: string;
  right?: string;
}) {
  return (
    <header className="flex items-end justify-between gap-4 border-b border-border px-10 py-8">
      <div>
        <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          {eyebrow}
        </div>
        <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">{title}</h2>
      </div>
      {right && (
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{right}</div>
      )}
    </header>
  );
}

function CoverField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-medium text-foreground">{value}</div>
    </div>
  );
}

function BigKpi({
  label,
  value,
  accent,
  small,
}: {
  label: string;
  value: string;
  accent?: boolean;
  small?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-border p-4 ${
        accent ? "bg-[var(--gradient-accent)]/10" : "bg-card/40"
      }`}
    >
      {accent && (
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
      )}
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-2 font-display font-semibold tabular-nums tracking-tight ${
          small ? "text-lg" : "text-2xl"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-border bg-card/40 p-5 ${className ?? ""}`}>
      <div className="mb-3">
        <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {subtitle}
        </div>
        <div className="mt-1 font-display text-sm font-semibold tracking-tight">{title}</div>
      </div>
      {children}
    </div>
  );
}

function InsightColumn({ title, items }: { title: string; items: ReportInsight[] }) {
  return (
    <div>
      <div className="mb-4 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
        {title}
      </div>
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-5 text-xs text-muted-foreground">
          Nada a destacar nesta categoria.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((i, idx) => {
            const meta = CAT_META[i.category];
            const Icon = meta.icon;
            return (
              <article key={idx} className="rounded-xl border border-border bg-card/40 p-4">
                <div className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${meta.tone}`}>
                  <Icon className="size-3" />
                  {meta.label}
                </div>
                <h4 className="mt-3 font-display text-sm font-semibold leading-snug">{i.title}</h4>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{i.body}</p>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FooterStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-display text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}

/* Recharts shared props */
const axisProps = {
  stroke: "var(--muted-foreground)",
  tick: { fontSize: 10, fill: "var(--muted-foreground)" },
  tickLine: false,
  axisLine: false,
} as const;

function ChartGrid() {
  return <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />;
}

function TT({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string | number;
  formatter: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-popover px-2.5 py-1.5 text-[11px] shadow-xl">
      <div className="text-muted-foreground">
        {typeof label === "string" ? fmtDate(label) : label}
      </div>
      <div className="mt-0.5 font-medium tabular-nums">{formatter(Number(payload[0].value))}</div>
    </div>
  );
}

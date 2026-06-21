export type Period = "today" | "7d" | "30d" | "90d";

export const PERIODS: { id: Period; label: string }[] = [
  { id: "today", label: "Hoje" },
  { id: "7d", label: "7 dias" },
  { id: "30d", label: "30 dias" },
  { id: "90d", label: "90 dias" },
];

export type Kpi = {
  id: string;
  label: string;
  value: string;
  raw: number;
  delta: number; // percent vs previous period
  format: "currency" | "number" | "decimal";
  hint: string;
};

const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const fmtNum = (n: number) => n.toLocaleString("pt-BR");
const fmtDec = (n: number) => n.toFixed(2).replace(".", ",");

const KPI_BASE = {
  today: { invest: 4280, leads: 142, cpl: 30.14, conv: 31, sales: 22, revenue: 38400, roas: 8.97 },
  "7d": { invest: 32450, leads: 1184, cpl: 27.41, conv: 268, sales: 192, revenue: 312800, roas: 9.64 },
  "30d": { invest: 142800, leads: 5421, cpl: 26.34, conv: 1218, sales: 884, revenue: 1438200, roas: 10.07 },
  "90d": { invest: 412600, leads: 15880, cpl: 25.98, conv: 3624, sales: 2612, revenue: 4218400, roas: 10.22 },
} as const;

const DELTAS = {
  today: { invest: 4.2, leads: 12.8, cpl: -7.6, conv: 14.1, sales: 18.3, revenue: 22.4, roas: 11.2 },
  "7d": { invest: 8.1, leads: 16.4, cpl: -12.1, conv: 21.2, sales: 24.6, revenue: 28.1, roas: 14.8 },
  "30d": { invest: 11.4, leads: 18.7, cpl: -9.8, conv: 19.4, sales: 22.1, revenue: 26.9, roas: 13.1 },
  "90d": { invest: 14.2, leads: 22.5, cpl: -8.4, conv: 24.8, sales: 28.6, revenue: 31.2, roas: 16.4 },
};

export function getKpis(period: Period): Kpi[] {
  const b = KPI_BASE[period];
  const d = DELTAS[period];
  return [
    { id: "invest", label: "Investimento", raw: b.invest, value: fmtBRL(b.invest), delta: d.invest, format: "currency", hint: "Total aplicado em mídia" },
    { id: "leads", label: "Leads", raw: b.leads, value: fmtNum(b.leads), delta: d.leads, format: "number", hint: "Capturas qualificadas" },
    { id: "cpl", label: "CPL", raw: b.cpl, value: `R$ ${fmtDec(b.cpl)}`, delta: d.cpl, format: "decimal", hint: "Custo por lead" },
    { id: "conv", label: "Conversões", raw: b.conv, value: fmtNum(b.conv), delta: d.conv, format: "number", hint: "Oportunidades qualificadas" },
    { id: "sales", label: "Vendas", raw: b.sales, value: fmtNum(b.sales), delta: d.sales, format: "number", hint: "Contratos fechados" },
    { id: "revenue", label: "Faturamento", raw: b.revenue, value: fmtBRL(b.revenue), delta: d.revenue, format: "currency", hint: "Receita total no período" },
    { id: "roas", label: "ROAS", raw: b.roas, value: `${fmtDec(b.roas)}x`, delta: d.roas, format: "decimal", hint: "Retorno sobre investimento" },
  ];
}

export type SeriesPoint = { date: string; revenue: number; invest: number; leads: number };

export function getSeries(period: Period): SeriesPoint[] {
  const points = period === "today" ? 24 : period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const today = new Date();
  const out: SeriesPoint[] = [];
  let baseRev = period === "today" ? 1400 : 8200;
  let baseInv = period === "today" ? 180 : 1100;
  for (let i = points - 1; i >= 0; i--) {
    const d = new Date(today);
    if (period === "today") d.setHours(today.getHours() - i);
    else d.setDate(today.getDate() - i);

    const wave = Math.sin(i / 4) * 0.18 + Math.cos(i / 7) * 0.12;
    const trend = 1 + (points - i) * 0.004;
    const noise = (Math.sin(i * 13.37) + 1) * 0.08;
    const rev = Math.round(baseRev * (1 + wave + noise) * trend);
    const inv = Math.round(baseInv * (1 + wave * 0.6 + noise * 0.5) * trend);
    const leads = Math.round(inv / (24 + Math.sin(i) * 3));
    out.push({
      date: period === "today"
        ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
        : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      revenue: rev,
      invest: inv,
      leads,
    });
  }
  return out;
}

export type CampaignStatus = "excelente" | "atencao" | "critico" | "pausada";
export type Campaign = {
  id: string;
  name: string;
  channel: "Meta Ads" | "Google Ads" | "YouTube" | "TikTok";
  status: CampaignStatus;
  invest: number;
  leads: number;
  cpl: number;
  conv: number;
  roas: number;
};

export const CAMPAIGNS: Campaign[] = [
  { id: "1", name: "Conversão | Mentoria Black", channel: "Meta Ads", status: "excelente", invest: 48200, leads: 1820, cpl: 26.48, conv: 412, roas: 12.4 },
  { id: "2", name: "Remarketing | Aplicação", channel: "Meta Ads", status: "excelente", invest: 18400, leads: 612, cpl: 30.06, conv: 198, roas: 14.8 },
  { id: "3", name: "Tráfego Frio | VSL", channel: "Google Ads", status: "atencao", invest: 32100, leads: 1184, cpl: 27.11, conv: 184, roas: 6.2 },
  { id: "4", name: "Captação | Webinar", channel: "YouTube", status: "excelente", invest: 21800, leads: 942, cpl: 23.14, conv: 218, roas: 11.6 },
  { id: "5", name: "Awareness | Marca", channel: "TikTok", status: "critico", invest: 9800, leads: 184, cpl: 53.26, conv: 12, roas: 1.4 },
  { id: "6", name: "Conversão | Black Sprint", channel: "Meta Ads", status: "atencao", invest: 14200, leads: 421, cpl: 33.73, conv: 84, roas: 5.8 },
  { id: "7", name: "Retargeting | Carrinho", channel: "Google Ads", status: "excelente", invest: 7200, leads: 318, cpl: 22.64, conv: 162, roas: 16.2 },
  { id: "8", name: "Lookalike | Top Buyers", channel: "Meta Ads", status: "pausada", invest: 0, leads: 0, cpl: 0, conv: 0, roas: 0 },
];

export const STATUS_LABEL: Record<CampaignStatus, string> = {
  excelente: "Excelente",
  atencao: "Atenção",
  critico: "Crítico",
  pausada: "Pausada",
};

export type Insight = {
  id: string;
  title: string;
  body: string;
  tag: "oportunidade" | "alerta" | "tendencia";
  impact: "Alto" | "Médio" | "Baixo";
};

export const INSIGHTS: Insight[] = [
  {
    id: "1",
    title: "CPL reduziu 12% nos últimos 7 dias",
    body: "A otimização de criativos da campanha Conversão | Mentoria Black derrubou o custo por lead sem comprometer qualidade.",
    tag: "tendencia",
    impact: "Alto",
  },
  {
    id: "2",
    title: "Potencial de escala em Mentoria Black",
    body: "A campanha está respondendo positivamente a aumentos de budget. Recomendamos +30% de investimento nos próximos 5 dias.",
    tag: "oportunidade",
    impact: "Alto",
  },
  {
    id: "3",
    title: "Awareness | Marca abaixo do esperado",
    body: "ROAS de 1.4x em queda há 9 dias. Sugerimos pausar e redirecionar verba para Retargeting | Carrinho.",
    tag: "alerta",
    impact: "Médio",
  },
  {
    id: "4",
    title: "70% do faturamento vem de 2 campanhas",
    body: "A concentração é saudável agora, mas representa risco. Considere validar uma nova frente fria nas próximas 2 semanas.",
    tag: "tendencia",
    impact: "Médio",
  },
  {
    id: "5",
    title: "Janela de melhor performance: 19h às 22h",
    body: "Conversões nesse horário têm ticket 28% maior. Vale ajustar dayparting nas campanhas de conversão.",
    tag: "oportunidade",
    impact: "Médio",
  },
  {
    id: "6",
    title: "Lead score subiu 18% no mês",
    body: "A qualidade dos leads capturados pelo Webinar está acima da média histórica. Mantenha o criativo atual.",
    tag: "tendencia",
    impact: "Baixo",
  },
];

export type Report = {
  id: string;
  name: string;
  period: string;
  createdAt: string;
  size: string;
};

export const REPORTS: Report[] = [
  { id: "1", name: "Relatório executivo — Novembro", period: "01 — 30 nov", createdAt: "01 dez 2026", size: "2.4 MB" },
  { id: "2", name: "Performance semanal — S48", period: "24 — 30 nov", createdAt: "30 nov 2026", size: "1.1 MB" },
  { id: "3", name: "Análise de escala — Mentoria Black", period: "01 — 30 nov", createdAt: "28 nov 2026", size: "3.2 MB" },
  { id: "4", name: "Relatório executivo — Outubro", period: "01 — 31 out", createdAt: "01 nov 2026", size: "2.6 MB" },
];

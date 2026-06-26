import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* =========================================================================
 * Types
 * ========================================================================= */

export type ReportPeriodPreset =
  | "today"
  | "yesterday"
  | "7d"
  | "30d"
  | "this_month"
  | "last_month"
  | "custom";

export type ReportInsight = {
  category: "positivo" | "oportunidade" | "alerta" | "recomendacao";
  title: string;
  body: string;
};

export type CampaignRow = {
  id: string;
  name: string;
  status: string;
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  cpc: number;
  leads: number;
  cpl: number;
  purchases: number;
  roas: number;
  revenue: number;
};

export type ReportSnapshot = {
  version: 1;
  brand: { name: string; product: string };
  account: { id: string | null; name: string | null };
  user: { fullName: string | null; email: string | null };
  period: {
    preset: ReportPeriodPreset;
    startDate: string;
    endDate: string;
    label: string;
  };
  generatedAt: string;
  summary: {
    spend: number;
    impressions: number;
    reach: number;
    clicks: number;
    ctr: number;
    cpm: number;
    cpc: number;
    leads: number;
    cpl: number;
    purchases: number;
    cpa: number;
    revenue: number;
    roas: number;
  };
  series: Array<{
    date: string;
    spend: number;
    clicks: number;
    leads: number;
    purchases: number;
    revenue: number;
    roas: number;
    ctr: number;
  }>;
  campaigns: CampaignRow[];
  insights: ReportInsight[];
  executiveSummary: string;
};

/* =========================================================================
 * Period resolution
 * ========================================================================= */

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function periodToRange(
  preset: ReportPeriodPreset,
  custom?: { startDate?: string; endDate?: string },
): { startDate: string; endDate: string; label: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fmt = (d: Date) =>
    d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  const make = (start: Date, end: Date, label: string) => ({
    startDate: isoDate(start),
    endDate: isoDate(end),
    label,
  });

  switch (preset) {
    case "today":
      return make(today, today, `Hoje · ${fmt(today)}`);
    case "yesterday": {
      const y = new Date(today);
      y.setDate(today.getDate() - 1);
      return make(y, y, `Ontem · ${fmt(y)}`);
    }
    case "7d": {
      const s = new Date(today);
      s.setDate(today.getDate() - 6);
      return make(s, today, `Últimos 7 dias · ${fmt(s)} → ${fmt(today)}`);
    }
    case "30d": {
      const s = new Date(today);
      s.setDate(today.getDate() - 29);
      return make(s, today, `Últimos 30 dias · ${fmt(s)} → ${fmt(today)}`);
    }
    case "this_month": {
      const s = new Date(today.getFullYear(), today.getMonth(), 1);
      return make(s, today, `Este mês · ${fmt(s)} → ${fmt(today)}`);
    }
    case "last_month": {
      const s = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const e = new Date(today.getFullYear(), today.getMonth(), 0);
      return make(s, e, `Mês anterior · ${fmt(s)} → ${fmt(e)}`);
    }
    case "custom": {
      const s = custom?.startDate ? new Date(custom.startDate) : today;
      const e = custom?.endDate ? new Date(custom.endDate) : today;
      return make(s, e, `Personalizado · ${fmt(s)} → ${fmt(e)}`);
    }
  }
}

/* =========================================================================
 * Aggregation + insights
 * ========================================================================= */

function aggregate(series: ReportSnapshot["series"]): ReportSnapshot["summary"] {
  const t = {
    spend: 0,
    impressions: 0,
    reach: 0,
    clicks: 0,
    leads: 0,
    purchases: 0,
    revenue: 0,
  };
  for (const r of series) {
    t.spend += r.spend;
    t.clicks += r.clicks;
    t.leads += r.leads;
    t.purchases += r.purchases;
    t.revenue += r.revenue;
  }
  return {
    spend: t.spend,
    impressions: t.impressions,
    reach: t.reach,
    clicks: t.clicks,
    ctr: t.impressions > 0 ? (t.clicks / t.impressions) * 100 : 0,
    cpm: t.impressions > 0 ? (t.spend / t.impressions) * 1000 : 0,
    cpc: t.clicks > 0 ? t.spend / t.clicks : 0,
    leads: t.leads,
    cpl: t.leads > 0 ? t.spend / t.leads : 0,
    purchases: t.purchases,
    cpa: t.purchases > 0 ? t.spend / t.purchases : 0,
    revenue: t.revenue,
    roas: t.spend > 0 ? t.revenue / t.spend : 0,
  };
}

function fmtBRL(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtInt(n: number): string {
  return Math.round(n).toLocaleString("pt-BR");
}

function generateInsights(
  summary: ReportSnapshot["summary"],
  campaigns: CampaignRow[],
): ReportInsight[] {
  const insights: ReportInsight[] = [];

  // Benchmarks (consultative defaults — single source of truth for the report)
  const B = { ctrGood: 1.5, ctrLow: 0.8, roasGood: 4, roasLow: 1.5, cpaShare: 0.4 };

  // Positivos
  if (summary.roas >= B.roasGood) {
    insights.push({
      category: "positivo",
      title: `ROAS saudável de ${summary.roas.toFixed(2)}x`,
      body: `A operação está convertendo cada R$ 1 investido em ${fmtBRL(
        summary.roas,
      )} de receita. Mantenha o ritmo de testes para preservar a margem.`,
    });
  }
  if (summary.ctr >= B.ctrGood) {
    insights.push({
      category: "positivo",
      title: `CTR acima da média do mercado (${summary.ctr.toFixed(2)}%)`,
      body: "Os criativos estão capturando atenção. Documente os ângulos vencedores e replique a estrutura nas próximas variações.",
    });
  }

  // Oportunidades
  const sorted = [...campaigns].sort((a, b) => b.roas - a.roas);
  const topRoas = sorted.find((c) => c.spend > 0 && c.roas >= B.roasGood);
  if (topRoas) {
    const share = summary.spend > 0 ? topRoas.spend / summary.spend : 0;
    if (share < 0.4) {
      insights.push({
        category: "oportunidade",
        title: `Escale a campanha "${topRoas.name}"`,
        body: `ROAS de ${topRoas.roas.toFixed(2)}x com apenas ${(share * 100).toFixed(
          0,
        )}% do investimento total. Aumente o orçamento em 20–30% e monitore por 72h.`,
      });
    }
  }
  if (summary.cpl > 0 && summary.cpa > 0 && summary.cpa / summary.cpl < 2) {
    insights.push({
      category: "oportunidade",
      title: "Conversão de lead para venda está eficiente",
      body: `O CPA (${fmtBRL(summary.cpa)}) está próximo do CPL (${fmtBRL(
        summary.cpl,
      )}). Vale acelerar o topo de funil — leads adicionais devem se converter na mesma proporção.`,
    });
  }

  // Alertas
  if (summary.spend > 0 && summary.roas < B.roasLow) {
    insights.push({
      category: "alerta",
      title: `ROAS abaixo de ${B.roasLow}x`,
      body: `A operação está em ${summary.roas.toFixed(
        2,
      )}x. Pause campanhas com pior performance, revise a oferta e reforce remarketing antes de novos investimentos.`,
    });
  }
  if (summary.ctr > 0 && summary.ctr < B.ctrLow) {
    insights.push({
      category: "alerta",
      title: `CTR baixo (${summary.ctr.toFixed(2)}%)`,
      body: "Os criativos estão perdendo atenção. Renove ganchos de abertura e teste novos formatos (carrossel, vídeo curto) nas próximas 48h.",
    });
  }
  const worst = [...campaigns]
    .filter((c) => c.spend > 50 && c.roas < B.roasLow)
    .sort((a, b) => a.roas - b.roas)[0];
  if (worst) {
    insights.push({
      category: "alerta",
      title: `"${worst.name}" está drenando o orçamento`,
      body: `Gastou ${fmtBRL(worst.spend)} com ROAS de ${worst.roas.toFixed(
        2,
      )}x. Avalie pausar ou refazer a estrutura de público/criativo.`,
    });
  }

  // Recomendações
  if (campaigns.length > 0) {
    const active = campaigns.filter((c) => c.spend > 0).length;
    insights.push({
      category: "recomendacao",
      title: "Concentre o investimento nas vencedoras",
      body: `${active} campanhas ativas no período. Defina um teto de tolerância: campanhas com ROAS < ${B.roasLow}x após 5 dias devem ser pausadas automaticamente.`,
    });
  }
  insights.push({
    category: "recomendacao",
    title: "Renove o ciclo criativo a cada 14 dias",
    body: "Fadiga criativa é a causa mais comum de queda de CTR e aumento de CPM. Estruture 3 novos criativos a cada quinzena para sustentar a curva.",
  });

  return insights;
}

function buildExecutiveSummary(
  summary: ReportSnapshot["summary"],
  campaigns: CampaignRow[],
  insights: ReportInsight[],
  periodLabel: string,
): string {
  const best = [...campaigns].sort((a, b) => b.roas - a.roas).find((c) => c.spend > 0);
  const alert = insights.find((i) => i.category === "alerta");
  const lines: string[] = [];
  lines.push(`No período analisado (${periodLabel.replace(/^[^·]+· /, "")}), foram investidos ${fmtBRL(summary.spend)}.`);
  if (summary.leads > 0) {
    lines.push(
      `Foram gerados ${fmtInt(summary.leads)} leads ao custo médio de ${fmtBRL(summary.cpl)} por lead.`,
    );
  }
  if (summary.purchases > 0) {
    lines.push(
      `Foram registradas ${fmtInt(summary.purchases)} conversões com CPA médio de ${fmtBRL(
        summary.cpa,
      )} e ROAS consolidado de ${summary.roas.toFixed(2)}x.`,
    );
  } else if (summary.revenue > 0) {
    lines.push(`A receita atribuída chegou a ${fmtBRL(summary.revenue)} (ROAS ${summary.roas.toFixed(2)}x).`);
  }
  if (best) {
    lines.push(
      `A campanha com melhor desempenho foi "${best.name}", com ROAS de ${best.roas.toFixed(
        2,
      )}x sobre ${fmtBRL(best.spend)} investidos.`,
    );
  }
  if (alert) {
    lines.push(`O principal ponto de atenção foi: ${alert.title.toLowerCase()}.`);
  } else {
    lines.push("Não foram identificados pontos críticos de atenção neste período.");
  }
  return lines.join(" ");
}

/* =========================================================================
 * Server functions
 * ========================================================================= */

export const generateReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      preset: ReportPeriodPreset;
      startDate?: string;
      endDate?: string;
      title?: string;
    }) => {
      if (!data?.preset) throw new Error("preset obrigatório");
      return data;
    },
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const range = periodToRange(data.preset, {
      startDate: data.startDate,
      endDate: data.endDate,
    });

    // Fetch user profile + meta connection + daily metrics in parallel.
    const [{ data: profile }, { data: conn }, { data: dailyRows }] = await Promise.all([
      supabase.from("profiles").select("full_name,email").eq("id", userId).maybeSingle(),
      supabase
        .from("meta_connections")
        .select("ad_account_id,account_name")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("daily_metrics")
        .select("date,spend,impressions,reach,clicks,leads,purchases,revenue")
        .eq("user_id", userId)
        .gte("date", range.startDate)
        .lte("date", range.endDate)
        .order("date", { ascending: true }),
    ]);

    // Build the time series (always returns a row per day in the range, zero-filled).
    const byDate = new Map<string, ReportSnapshot["series"][number]>();
    for (const r of dailyRows ?? []) {
      const spend = Number(r.spend ?? 0);
      const clicks = Number(r.clicks ?? 0);
      const impressions = Number(r.impressions ?? 0);
      const revenue = Number(r.revenue ?? 0);
      byDate.set(r.date, {
        date: r.date,
        spend,
        clicks,
        leads: Number(r.leads ?? 0),
        purchases: Number(r.purchases ?? 0),
        revenue,
        roas: spend > 0 ? revenue / spend : 0,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      });
    }
    // Recompute summary aggregates with raw impressions/reach captured here
    let totalImpressions = 0;
    let totalReach = 0;
    for (const r of dailyRows ?? []) {
      totalImpressions += Number(r.impressions ?? 0);
      totalReach += Number(r.reach ?? 0);
    }

    const series: ReportSnapshot["series"] = [];
    const start = new Date(range.startDate);
    const end = new Date(range.endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = isoDate(d);
      series.push(
        byDate.get(key) ?? {
          date: key,
          spend: 0,
          clicks: 0,
          leads: 0,
          purchases: 0,
          revenue: 0,
          roas: 0,
          ctr: 0,
        },
      );
    }

    const summary = aggregate(series);
    summary.impressions = totalImpressions;
    summary.reach = totalReach;
    summary.ctr = totalImpressions > 0 ? (summary.clicks / totalImpressions) * 100 : 0;
    summary.cpm = totalImpressions > 0 ? (summary.spend / totalImpressions) * 1000 : 0;

    // Fetch campaign-level data from Meta (live, scoped to range).
    let campaigns: CampaignRow[] = [];
    if (conn?.ad_account_id) {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { fetchCampaignInsights, fetchCampaignStatuses, normalizeCampaign } = await import(
          "@/lib/meta.server"
        );
        const { data: tok } = await supabaseAdmin
          .from("meta_connections")
          .select("access_token")
          .eq("user_id", userId)
          .maybeSingle();
        if (tok?.access_token) {
          const [insights, statuses] = await Promise.all([
            fetchCampaignInsights({
              accessToken: tok.access_token,
              adAccountId: conn.ad_account_id,
              since: range.startDate,
              until: range.endDate,
            }),
            fetchCampaignStatuses({
              accessToken: tok.access_token,
              adAccountId: conn.ad_account_id,
            }).catch(() => []),
          ]);
          const statusMap = new Map(statuses.map((s) => [s.id, s.effective_status]));
          campaigns = insights.map((row) => normalizeCampaign(row, statusMap.get(row.campaign_id)));
          campaigns.sort((a, b) => b.spend - a.spend);
        }
      } catch (err) {
        console.error("[report] campaign fetch failed", err);
      }
    }

    const reportInsights = generateInsights(summary, campaigns);
    const executiveSummary = buildExecutiveSummary(summary, campaigns, reportInsights, range.label);

    const snapshot: ReportSnapshot = {
      version: 1,
      brand: { name: "ADS HOF Circle", product: "HOF Circle Analytics" },
      account: { id: conn?.ad_account_id ?? null, name: conn?.account_name ?? null },
      user: { fullName: profile?.full_name ?? null, email: profile?.email ?? null },
      period: {
        preset: data.preset,
        startDate: range.startDate,
        endDate: range.endDate,
        label: range.label,
      },
      generatedAt: new Date().toISOString(),
      summary,
      series,
      campaigns,
      insights: reportInsights,
      executiveSummary,
    };

    const title =
      data.title?.trim() ||
      `Relatório · ${conn?.account_name ?? "Conta Meta"} · ${range.label}`;

    const { data: inserted, error } = await supabase
      .from("reports")
      .insert({
        user_id: userId,
        title,
        account_name: conn?.account_name ?? null,
        ad_account_id: conn?.ad_account_id ?? null,
        period_start: range.startDate,
        period_end: range.endDate,
        snapshot_json: snapshot,
      })
      .select("id,report_token")
      .single();
    if (error) throw new Error(error.message);

    return { id: inserted.id, token: inserted.report_token };
  });

export const listReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("reports")
      .select("id,title,account_name,period_start,period_end,report_token,is_public,created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => {
    if (!d?.id) throw new Error("id obrigatório");
    return d;
  })
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("reports")
      .select("id,title,report_token,is_public,created_at,snapshot_json")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Relatório não encontrado.");
    return {
      id: row.id,
      title: row.title,
      token: row.report_token,
      isPublic: row.is_public,
      createdAt: row.created_at,
      snapshot: row.snapshot_json as ReportSnapshot,
    };
  });

export const deleteReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("reports")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleReportPublic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; isPublic: boolean }) => d)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("reports")
      .update({ is_public: data.isPublic })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Public read by token. No auth required — uses the service-role client because
 * we don't expose `public.reports` to the anon role. The token itself is the
 * capability; we verify is_public=true before returning.
 */
export const getPublicReport = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string }) => {
    if (!d?.token || typeof d.token !== "string" || d.token.length < 16) {
      throw new Error("token inválido");
    }
    return d;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("reports")
      .select("id,title,is_public,created_at,snapshot_json")
      .eq("report_token", data.token)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row || !row.is_public) throw new Error("Relatório não disponível.");
    return {
      id: row.id,
      title: row.title,
      createdAt: row.created_at,
      snapshot: row.snapshot_json as ReportSnapshot,
    };
  });

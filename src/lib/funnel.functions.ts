import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Period = "7d" | "30d";

function dateRange(period: Period) {
  const days = period === "7d" ? 7 : 30;
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { startDate: iso(start), endDate: iso(end), days };
}

export const getFunnel = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { period?: Period } | undefined) => ({ period: d?.period ?? "30d" }))
  .handler(async ({ context, data }) => {
    const { resolveScope } = await import("@/lib/impersonation.server");
    const { userId, db } = await resolveScope(context);
    const { startDate, endDate, days } = dateRange(data.period);

    const [{ data: metrics }, { data: manuals }] = await Promise.all([
      db
        .from("daily_metrics")
        .select("date, clicks, spend, purchases, revenue")
        .eq("user_id", userId)
        .gte("date", startDate)
        .lte("date", endDate),
      db
        .from("funnel_manual_entries")
        .select("date, conversations, qualified_leads, sales_count, sales_revenue")
        .eq("user_id", userId)
        .gte("date", startDate)
        .lte("date", endDate),
    ]);

    const totals = {
      clicks: 0,
      spend: 0,
      auto_purchases: 0,
      auto_revenue: 0,
      conversations: 0,
      qualified_leads: 0,
      manual_sales: 0,
      manual_revenue: 0,
    };
    for (const m of metrics ?? []) {
      totals.clicks += Number(m.clicks ?? 0);
      totals.spend += Number(m.spend ?? 0);
      totals.auto_purchases += Number(m.purchases ?? 0);
      totals.auto_revenue += Number(m.revenue ?? 0);
    }
    for (const e of manuals ?? []) {
      totals.conversations += Number(e.conversations ?? 0);
      totals.qualified_leads += Number(e.qualified_leads ?? 0);
      totals.manual_sales += Number(e.sales_count ?? 0);
      totals.manual_revenue += Number(e.sales_revenue ?? 0);
    }

    const stages = [
      {
        key: "clicks",
        label: "Cliques no WhatsApp",
        description: "Cliques no criativo (Meta Ads)",
        total: totals.clicks,
        source: "auto" as const,
      },
      {
        key: "conversations",
        label: "Conversas Iniciadas",
        description: "Registrado manualmente",
        total: totals.conversations,
        source: "manual" as const,
      },
      {
        key: "qualified",
        label: "Leads Qualificados",
        description: "Registrado manualmente",
        total: totals.qualified_leads,
        source: "manual" as const,
      },
      {
        key: "sales",
        label: "Vendas Realizadas",
        description: "Meta (purchases) + registros manuais",
        total: totals.auto_purchases + totals.manual_sales,
        source: "mixed" as const,
      },
    ].map((stage, idx, arr) => {
      const prev = idx === 0 ? null : arr[idx - 1];
      const conversionRate =
        prev && prev.total > 0 ? (stage.total / prev.total) * 100 : null;
      const cpa = stage.total > 0 ? totals.spend / stage.total : null;
      return { ...stage, conversionRate, cpa };
    });

    // bottleneck = stage with the lowest non-null conversion rate (skip first)
    let bottleneckKey: string | null = null;
    let worst = Infinity;
    for (const s of stages) {
      if (s.conversionRate != null && s.conversionRate < worst) {
        worst = s.conversionRate;
        bottleneckKey = s.key;
      }
    }

    return {
      period: data.period,
      startDate,
      endDate,
      days,
      totalSpend: totals.spend,
      totalRevenue: totals.auto_revenue + totals.manual_revenue,
      stages,
      bottleneckKey,
    };
  });

export const listManualEntries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { period?: Period } | undefined) => ({ period: d?.period ?? "30d" }))
  .handler(async ({ context, data }) => {
    const { startDate, endDate } = dateRange(data.period);
    const { data: rows, error } = await context.supabase
      .from("funnel_manual_entries")
      .select("*")
      .eq("user_id", context.userId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const upsertManualEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      date: string;
      conversations: number;
      qualified_leads: number;
      sales_count: number;
      sales_revenue: number;
      notes?: string | null;
    }) => d,
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("funnel_manual_entries")
      .upsert(
        {
          user_id: context.userId,
          date: data.date,
          conversations: data.conversations,
          qualified_leads: data.qualified_leads,
          sales_count: data.sales_count,
          sales_revenue: data.sales_revenue,
          notes: data.notes ?? null,
        },
        { onConflict: "user_id,date" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteManualEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("funnel_manual_entries")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

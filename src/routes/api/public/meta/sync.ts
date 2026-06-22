import { createFileRoute } from "@tanstack/react-router";

// Called by pg_cron (or manually) to sync all connected accounts.
// Auth: requires the project apikey header (Supabase anon key).
export const Route = createFileRoute("/api/public/meta/sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey");
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        if (!apikey || !expected || apikey !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { fetchDailyInsights, normalizeInsight } = await import("@/lib/meta.server");

        const { data: conns, error } = await supabaseAdmin
          .from("meta_connections")
          .select("user_id,access_token,ad_account_id")
          .not("ad_account_id", "is", null);
        if (error) return Response.json({ error: error.message }, { status: 500 });

        const until = new Date();
        const since = new Date();
        since.setDate(since.getDate() - 7);
        const fmt = (d: Date) => d.toISOString().slice(0, 10);

        const results: { user_id: string; days?: number; error?: string }[] = [];
        for (const c of conns ?? []) {
          try {
            const rows = await fetchDailyInsights({
              accessToken: c.access_token,
              adAccountId: c.ad_account_id!,
              since: fmt(since),
              until: fmt(until),
            });
            const normalized = rows.map((r) => normalizeInsight(r, c.user_id, c.ad_account_id!));
            if (normalized.length) {
              await supabaseAdmin
                .from("daily_metrics")
                .upsert(normalized, { onConflict: "user_id,ad_account_id,date" });
            }
            await supabaseAdmin
              .from("meta_connections")
              .update({ last_synced_at: new Date().toISOString() })
              .eq("user_id", c.user_id);
            results.push({ user_id: c.user_id, days: normalized.length });
          } catch (e) {
            results.push({ user_id: c.user_id, error: e instanceof Error ? e.message : "unknown" });
          }
        }
        return Response.json({ ok: true, results });
      },
    },
  },
});

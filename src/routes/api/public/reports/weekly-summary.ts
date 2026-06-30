import { createFileRoute } from "@tanstack/react-router";
import { renderToStaticMarkup } from "react-dom/server";
import { WeeklySummaryEmail } from "@/emails/WeeklySummaryEmail";

function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Called by pg_cron every Monday at 8am to send the weekly summary email
// to mentorados who have weekly_summary_email = true.
// Auth: requires the project apikey header (Supabase anon key).
export const Route = createFileRoute("/api/public/reports/weekly-summary")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey");
        const expected =
          process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        if (!apikey || !expected || apikey !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) {
          return Response.json({ error: "RESEND_API_KEY não configurada." }, { status: 500 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // 1. Buscar mentorados com o opt-in ativo
        const { data: profiles, error } = await supabaseAdmin
          .from("profiles")
          .select("id,email,full_name")
          .eq("weekly_summary_email", true)
          .not("email", "is", null);
        if (error) return Response.json({ error: error.message }, { status: 500 });

        const until = new Date();
        const since = new Date();
        since.setDate(since.getDate() - 7);
        const fmtDate = (d: Date) => d.toISOString().slice(0, 10);
        const periodLabel = `${since.toLocaleDateString("pt-BR")} – ${until.toLocaleDateString("pt-BR")}`;

        const results: { user_id: string; sent?: boolean; error?: string }[] = [];

        for (const profile of profiles ?? []) {
          try {
            // 2. Buscar métricas dos últimos 7 dias
            const { data: rows } = await supabaseAdmin
              .from("daily_metrics")
              .select("spend,impressions,clicks,leads,revenue")
              .eq("user_id", profile.id)
              .gte("date", fmtDate(since))
              .lte("date", fmtDate(until));

            if (!rows || rows.length === 0) {
              results.push({ user_id: profile.id, sent: false });
              continue;
            }

            const sum = (k: keyof (typeof rows)[number]) =>
              rows.reduce((acc, r) => acc + Number(r[k] ?? 0), 0);

            const spend = sum("spend");
            const revenue = sum("revenue");
            const leads = sum("leads");
            const clicks = sum("clicks");
            const impressions = sum("impressions");
            const roas = spend > 0 ? revenue / spend : 0;
            const cpl = leads > 0 ? spend / leads : 0;
            const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

            // 3. Renderizar o email
            const html = renderToStaticMarkup(
              WeeklySummaryEmail({
                nome: profile.full_name ?? "mentorado(a)",
                periodLabel,
                spend: brl(spend),
                revenue: brl(revenue),
                roas: `${roas.toFixed(2)}x`,
                cpl: brl(cpl),
                leads: leads.toLocaleString("pt-BR"),
                ctr: `${ctr.toFixed(2)}%`,
              })
            );

            // 4. Enviar via Resend
            const resendRes = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "HOF Circle Analytics <relatorios@timedom.com.br>",
                to: [profile.email],
                subject: `Seu resumo semanal — ${periodLabel}`,
                html: `<!DOCTYPE html>${html}`,
              }),
            });

            if (!resendRes.ok) {
              const errText = await resendRes.text();
              results.push({ user_id: profile.id, error: errText });
              continue;
            }

            results.push({ user_id: profile.id, sent: true });
          } catch (e) {
            results.push({
              user_id: profile.id,
              error: e instanceof Error ? e.message : "unknown",
            });
          }
        }

        return Response.json({ ok: true, results });
      },
    },
  },
});

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/meta/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const errorParam = url.searchParams.get("error");
        const origin = `${url.protocol}//${url.host}`;

        function back(qs: string) {
          return Response.redirect(`${origin}/onboarding?${qs}`, 302);
        }

        if (errorParam) return back(`meta_error=${encodeURIComponent(errorParam)}`);
        if (!code || !state) return back("meta_error=missing_params");

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const {
          getMetaConfig,
          buildRedirectUri,
          exchangeCodeForToken,
          exchangeForLongLivedToken,
          fetchMetaUserId,
          fetchAdAccounts,
        } = await import("@/lib/meta.server");

        const { data: stateRow, error: stErr } = await supabaseAdmin
          .from("meta_oauth_states")
          .select("user_id,expires_at")
          .eq("state", state)
          .maybeSingle();
        if (stErr || !stateRow) return back("meta_error=invalid_state");
        if (new Date(stateRow.expires_at).getTime() < Date.now())
          return back("meta_error=expired_state");

        // Single-use
        await supabaseAdmin.from("meta_oauth_states").delete().eq("state", state);

        try {
          const cfg = getMetaConfig();
          const redirectUri = buildRedirectUri(origin);
          const short = await exchangeCodeForToken({
            appId: cfg.appId,
            appSecret: cfg.appSecret,
            redirectUri,
            code,
          });
          const long = await exchangeForLongLivedToken({
            appId: cfg.appId,
            appSecret: cfg.appSecret,
            shortLivedToken: short.access_token,
          });
          const accessToken = long.access_token;
          const metaUserId = await fetchMetaUserId(accessToken);
          const accounts = await fetchAdAccounts(accessToken);
          const safe = accounts.map((a) => ({
            id: a.id,
            account_id: a.account_id,
            name: a.name,
            currency: a.currency,
          }));
          const expiresAt = long.expires_in
            ? new Date(Date.now() + long.expires_in * 1000).toISOString()
            : null;

          // If only one account, auto-select.
          const auto = safe.length === 1 ? safe[0] : null;

          const { error: upErr } = await supabaseAdmin.from("meta_connections").upsert(
            {
              user_id: stateRow.user_id,
              meta_user_id: metaUserId,
              access_token: accessToken,
              token_expires_at: expiresAt,
              available_accounts: safe,
              ad_account_id: auto?.id ?? null,
              account_name: auto?.name ?? null,
            },
            { onConflict: "user_id" }
          );
          if (upErr) return back(`meta_error=${encodeURIComponent(upErr.message)}`);

          return back("meta_connected=1");
        } catch (e) {
          const msg = e instanceof Error ? e.message : "unknown";
          console.error("[meta/callback]", msg);
          return back(`meta_error=${encodeURIComponent(msg)}`);
        }
      },
    },
  },
});

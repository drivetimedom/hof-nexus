import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/meta/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const errorParam = url.searchParams.get("error");
        const errorReason = url.searchParams.get("error_reason");
        const errorDescription = url.searchParams.get("error_description");
        const origin = `${url.protocol}//${url.host}`;
        const allParams = Object.fromEntries(url.searchParams.entries());

        console.log("[meta/callback] incoming", {
          origin,
          host: request.headers.get("host"),
          xForwardedHost: request.headers.get("x-forwarded-host"),
          referer: request.headers.get("referer"),
          hasCode: !!code,
          codePrefix: code ? code.slice(0, 8) : null,
          state,
          error: errorParam,
          errorReason,
          errorDescription,
          allParams,
        });

        function back(qs: string) {
          return Response.redirect(`${origin}/onboarding?${qs}`, 302);
        }

        if (errorParam) {
          console.error("[meta/callback] Meta returned error", {
            error: errorParam,
            errorReason,
            errorDescription,
            state,
          });
          const detail = errorDescription || errorReason || errorParam;
          return back(`meta_error=${encodeURIComponent(detail)}`);
        }
        if (!code || !state) {
          console.error("[meta/callback] missing params", { hasCode: !!code, hasState: !!state });
          return back("meta_error=missing_params");
        }

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
        if (stErr || !stateRow) {
          console.error("[meta/callback] invalid_state", { state, stErr: stErr?.message });
          return back("meta_error=invalid_state");
        }
        console.log("[meta/callback] state matched", {
          state,
          userId: stateRow.user_id,
          expiresAt: stateRow.expires_at,
        });
        if (new Date(stateRow.expires_at).getTime() < Date.now()) {
          console.error("[meta/callback] expired_state", { state, expiresAt: stateRow.expires_at });
          return back("meta_error=expired_state");
        }

        // Single-use
        await supabaseAdmin.from("meta_oauth_states").delete().eq("state", state);

        try {
          const cfg = getMetaConfig();
          const redirectUri = buildRedirectUri(origin);
          console.log("[meta/callback] exchanging code", {
            userId: stateRow.user_id,
            redirectUri,
            appId: cfg.appId,
          });
          const short = await exchangeCodeForToken({
            appId: cfg.appId,
            appSecret: cfg.appSecret,
            redirectUri,
            code,
          });
          console.log("[meta/callback] short-lived token ok", {
            userId: stateRow.user_id,
            expiresIn: short.expires_in,
          });
          const long = await exchangeForLongLivedToken({
            appId: cfg.appId,
            appSecret: cfg.appSecret,
            shortLivedToken: short.access_token,
          });
          console.log("[meta/callback] long-lived token ok", {
            userId: stateRow.user_id,
            expiresIn: long.expires_in,
          });
          const accessToken = long.access_token;
          const metaUserId = await fetchMetaUserId(accessToken);
          const accounts = await fetchAdAccounts(accessToken);
          console.log("[meta/callback] meta profile + accounts fetched", {
            userId: stateRow.user_id,
            metaUserId,
            accountsCount: accounts.length,
          });
          const safe = accounts.map((a) => ({
            id: a.id,
            account_id: a.account_id,
            name: a.name,
            currency: a.currency,
          }));
          const expiresAt = long.expires_in
            ? new Date(Date.now() + long.expires_in * 1000).toISOString()
            : null;

          const { error: upErr } = await supabaseAdmin.from("meta_connections").upsert(
            {
              user_id: stateRow.user_id,
              meta_user_id: metaUserId,
              access_token: accessToken,
              token_expires_at: expiresAt,
              available_accounts: safe,
              // Sempre deixamos o usuário escolher manualmente, mesmo quando há 1 conta.
              ad_account_id: null,
              account_name: null,
            },
            { onConflict: "user_id" }
          );
          if (upErr) {
            console.error("[meta/callback] upsert failed", {
              userId: stateRow.user_id,
              error: upErr.message,
            });
            return back(`meta_error=${encodeURIComponent(upErr.message)}`);
          }

          console.log("[meta/callback] success", {
            userId: stateRow.user_id,
            metaUserId,
            accountsCount: safe.length,
          });
          return back("meta_connected=1");

        } catch (e) {
          const msg = e instanceof Error ? e.message : "unknown";
          const stack = e instanceof Error ? e.stack : undefined;
          console.error("[meta/callback] exception", {
            userId: stateRow.user_id,
            state,
            message: msg,
            stack,
          });
          return back(`meta_error=${encodeURIComponent(msg)}`);
        }
      },
    },
  },
});

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getRequestHeader } from "@tanstack/react-start/server";

function originFromRequest(): string {
  const fwdProto = getRequestHeader("x-forwarded-proto") ?? "https";
  const host =
    getRequestHeader("x-forwarded-host") ?? getRequestHeader("host") ?? "ads.timedom.com.br";
  return `${fwdProto}://${host}`;
}

function randomState() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export const getOnboardingStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: profile }, { data: conn }] = await Promise.all([
      supabase.from("profiles").select("onboarding_completed,email,full_name").eq("id", userId).maybeSingle(),
      supabase
        .from("meta_connections")
        .select("meta_user_id,ad_account_id,account_name,available_accounts,last_synced_at,token_expires_at")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);
    return {
      onboardingCompleted: !!profile?.onboarding_completed,
      email: profile?.email ?? null,
      fullName: profile?.full_name ?? null,
      meta: conn
        ? {
            connected: true,
            adAccountId: conn.ad_account_id,
            accountName: conn.account_name,
            availableAccounts: (conn.available_accounts as Array<{ id: string; name: string }>) ?? [],
            lastSyncedAt: conn.last_synced_at,
            tokenExpiresAt: conn.token_expires_at,
          }
        : { connected: false as const },
    };
  });

export const startMetaOAuth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const appId = process.env.META_APP_ID;
    if (!appId) throw new Error("META_APP_ID não configurado.");

    const state = randomState();
    const { error } = await supabaseAdmin
      .from("meta_oauth_states")
      .insert({ state, user_id: userId });
    if (error) throw new Error(error.message);

    const origin = originFromRequest();
    const redirectUri = `${origin}/api/public/meta/callback`;
    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      state,
      response_type: "code",
      scope: "ads_read,business_management,public_profile",
      auth_type: "rerequest",
    });
    return {
      authUrl: `https://www.facebook.com/v20.0/dialog/oauth?${params.toString()}`,
      redirectUri,
    };
  });

export const refreshAdAccounts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { fetchAdAccounts } = await import("@/lib/meta.server");
    const { data: conn, error } = await supabaseAdmin
      .from("meta_connections")
      .select("access_token")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!conn) throw new Error("Conecte sua conta Meta primeiro.");
    const accounts = await fetchAdAccounts(conn.access_token);
    const safe = accounts.map((a) => ({
      id: a.id,
      account_id: a.account_id,
      name: a.name,
      currency: a.currency,
    }));
    await supabaseAdmin
      .from("meta_connections")
      .update({ available_accounts: safe })
      .eq("user_id", userId);
    return { accounts: safe };
  });

export const selectAdAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { adAccountId: string }) => {
    if (!data?.adAccountId || typeof data.adAccountId !== "string")
      throw new Error("adAccountId obrigatório");
    return data;
  })
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: conn, error } = await supabaseAdmin
      .from("meta_connections")
      .select("available_accounts")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!conn) throw new Error("Conexão Meta não encontrada.");
    const available = (conn.available_accounts as Array<{ id: string; name: string }>) ?? [];
    const picked = available.find((a) => a.id === data.adAccountId);
    if (!picked) throw new Error("Conta de anúncios inválida.");
    const { error: upErr } = await supabaseAdmin
      .from("meta_connections")
      .update({ ad_account_id: picked.id, account_name: picked.name })
      .eq("user_id", userId);
    if (upErr) throw new Error(upErr.message);
    return { ok: true, account: picked };
  });

export const completeOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const disconnectMeta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("meta_connections")
      .delete()
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const syncMyMetrics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { fetchDailyInsights, normalizeInsight } = await import("@/lib/meta.server");
    const { data: conn, error } = await supabaseAdmin
      .from("meta_connections")
      .select("access_token,ad_account_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!conn?.ad_account_id) throw new Error("Selecione uma conta de anúncios.");
    const until = new Date();
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const rows = await fetchDailyInsights({
      accessToken: conn.access_token,
      adAccountId: conn.ad_account_id,
      since: fmt(since),
      until: fmt(until),
    });
    const normalized = rows.map((r) => normalizeInsight(r, userId, conn.ad_account_id!));
    if (normalized.length > 0) {
      const { error: upErr } = await supabaseAdmin
        .from("daily_metrics")
        .upsert(normalized, { onConflict: "user_id,ad_account_id,date" });
      if (upErr) throw new Error(upErr.message);
    }
    await supabaseAdmin
      .from("meta_connections")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("user_id", userId);
    return { ok: true, days: normalized.length };
  });

export const getMyMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { days?: number } | undefined) => ({ days: data?.days ?? 30 }))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const since = new Date();
    since.setDate(since.getDate() - data.days);
    const { data: rows, error } = await supabase
      .from("daily_metrics")
      .select("date,spend,impressions,reach,clicks,ctr,cpc,leads,purchases,revenue,roas")
      .eq("user_id", userId)
      .gte("date", since.toISOString().slice(0, 10))
      .order("date", { ascending: true });
    if (error) throw new Error(error.message);
    return { rows: rows ?? [] };
  });

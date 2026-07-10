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
    const { resolveScope } = await import("@/lib/impersonation.server");
    const { userId, db } = await resolveScope(context);
    const [{ data: profile }, { data: conn }] = await Promise.all([
      db.from("profiles").select("onboarding_completed,email,full_name").eq("id", userId).maybeSingle(),
      db
        .from("meta_connections")
        .select("meta_user_id,ad_account_id,account_name,available_accounts,last_synced_at,token_expires_at")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);
    const availableAccounts =
      (conn?.available_accounts as Array<{ id: string; name: string }> | null) ?? [];
    const accountUnavailable =
      !!conn?.ad_account_id &&
      availableAccounts.length > 0 &&
      !availableAccounts.some((a) => a.id === conn.ad_account_id);
    return {
      onboardingCompleted: !!profile?.onboarding_completed,
      email: profile?.email ?? null,
      fullName: profile?.full_name ?? null,
      meta: conn
        ? {
            connected: true,
            adAccountId: conn.ad_account_id,
            accountName: conn.account_name,
            availableAccounts,
            lastSyncedAt: conn.last_synced_at,
            tokenExpiresAt: conn.token_expires_at,
            accountUnavailable,
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
      .select("access_token,ad_account_id")
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
    const stillAvailable =
      !conn.ad_account_id || safe.some((a) => a.id === conn.ad_account_id);
    const update: {
      available_accounts: typeof safe;
      ad_account_id?: string | null;
      account_name?: string | null;
    } = { available_accounts: safe };
    if (!stillAvailable) {
      update.ad_account_id = null;
      update.account_name = null;
    }
    await supabaseAdmin.from("meta_connections").update(update).eq("user_id", userId);
    return { accounts: safe, currentStillAvailable: stillAvailable };
  });

async function clearSelectedAccount(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin
    .from("meta_connections")
    .update({ ad_account_id: null, account_name: null })
    .eq("user_id", userId);
}

function isMetaAccountError(message: string) {
  return /does not exist|Unsupported get request|Object with ID|Cannot access|permission|\(#100\)|\(#803\)|\(#200\)/i.test(
    message
  );
}

async function withAccountGuard<T>(userId: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (isMetaAccountError(msg)) {
      await clearSelectedAccount(userId);
      throw new Error(
        "A conta de anúncios selecionada não está mais disponível na Meta. Escolha outra conta em Configurações → Integrações."
      );
    }
    throw e;
  }
}

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
    const rows = await withAccountGuard(userId, () =>
      fetchDailyInsights({
        accessToken: conn.access_token,
        adAccountId: conn.ad_account_id!,
        since: fmt(since),
        until: fmt(until),
      })
    );
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
    const { resolveScope } = await import("@/lib/impersonation.server");
    const { userId, db } = await resolveScope(context);
    const since = new Date();
    since.setDate(since.getDate() - data.days);
    const { data: rows, error } = await db
      .from("daily_metrics")
      .select("date,spend,impressions,reach,clicks,ctr,cpc,leads,purchases,revenue,roas")
      .eq("user_id", userId)
      .gte("date", since.toISOString().slice(0, 10))
      .order("date", { ascending: true });
    if (error) throw new Error(error.message);
    return { rows: rows ?? [] };
  });

export const getMyCampaigns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { days?: number } | undefined) => ({ days: data?.days ?? 30 }))
  .handler(async ({ context, data }) => {
    const { resolveScope } = await import("@/lib/impersonation.server");
    const { userId } = await resolveScope(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { fetchCampaignInsights, fetchCampaignStatuses, normalizeCampaign } =
      await import("@/lib/meta.server");
    const { data: conn, error } = await supabaseAdmin
      .from("meta_connections")
      .select("access_token,ad_account_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!conn?.ad_account_id) return { campaigns: [] };
    const until = new Date();
    const since = new Date();
    since.setDate(since.getDate() - data.days);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const [insights, statuses] = await Promise.all([
      fetchCampaignInsights({
        accessToken: conn.access_token,
        adAccountId: conn.ad_account_id,
        since: fmt(since),
        until: fmt(until),
      }),
      fetchCampaignStatuses({
        accessToken: conn.access_token,
        adAccountId: conn.ad_account_id,
      }).catch(() => []),
    ]);
    const statusMap = new Map(statuses.map((s) => [s.id, s.effective_status]));
    const seen = new Set<string>();
    const campaigns = insights.map((row) => {
      seen.add(row.campaign_id);
      return normalizeCampaign(row, statusMap.get(row.campaign_id));
    });
    // Include campaigns that have status but no insights in the period (paused/no spend).
    for (const s of statuses) {
      if (!seen.has(s.id)) {
        campaigns.push(
          normalizeCampaign(
            { campaign_id: s.id, campaign_name: s.name },
            s.effective_status
          )
        );
      }
    }
    campaigns.sort((a, b) => b.spend - a.spend);
    return { campaigns };
  });

async function getUserMetaConn(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("meta_connections")
    .select("access_token,ad_account_id,token_expires_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Conecte sua conta Meta primeiro.");
  if (!data.ad_account_id) throw new Error("Selecione uma conta de anúncios.");
  if (data.token_expires_at && new Date(data.token_expires_at).getTime() < Date.now()) {
    throw new Error("Sua conexão com o Meta Ads expirou. Reconecte em Configurações → Integrações.");
  }
  return data;
}

async function metaWrite(path: string, accessToken: string, body: Record<string, string>) {
  const params = new URLSearchParams({ ...body, access_token: accessToken });
  const res = await fetch(`https://graph.facebook.com/v20.0${path}`, {
    method: "POST",
    body: params,
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = text;
    try {
      const j = JSON.parse(text) as { error?: { message?: string; code?: number } };
      msg = j.error?.message ?? text;
      if (j.error?.code === 190) {
        throw new Error("Sua conexão com o Meta Ads expirou. Reconecte em Configurações → Integrações.");
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes("Reconecte")) throw e;
    }
    throw new Error(`Meta: ${msg}`);
  }
  return text ? JSON.parse(text) : {};
}

export const updateCampaignStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { campaignId: string; status: "ACTIVE" | "PAUSED" }) => {
    if (!d?.campaignId) throw new Error("campaignId obrigatório");
    if (d.status !== "ACTIVE" && d.status !== "PAUSED") throw new Error("status inválido");
    return d;
  })
  .handler(async ({ context, data }) => {
    const conn = await getUserMetaConn(context.userId);
    await metaWrite(`/${data.campaignId}`, conn.access_token, { status: data.status });
    return { ok: true };
  });

export const getCampaignDetails = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { campaignId: string }) => {
    if (!d?.campaignId) throw new Error("campaignId obrigatório");
    return d;
  })
  .handler(async ({ context, data }) => {
    const conn = await getUserMetaConn(context.userId);
    const params = new URLSearchParams({
      fields: "id,name,objective,daily_budget,lifetime_budget,start_time,stop_time,status",
      access_token: conn.access_token,
    });
    const res = await fetch(`https://graph.facebook.com/v20.0/${data.campaignId}?${params}`);
    const json = (await res.json()) as {
      id: string;
      name: string;
      objective?: string;
      daily_budget?: string;
      lifetime_budget?: string;
      start_time?: string;
      stop_time?: string;
      status?: string;
      error?: { message: string };
    };
    if (!res.ok) throw new Error(`Meta: ${json.error?.message ?? "erro ao carregar campanha"}`);
    return {
      id: json.id,
      name: json.name,
      objective: json.objective ?? null,
      dailyBudget: json.daily_budget ? Number(json.daily_budget) / 100 : null,
      startTime: json.start_time ?? null,
      stopTime: json.stop_time ?? null,
      status: json.status ?? null,
    };
  });

export const updateCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      campaignId: string;
      name?: string;
      dailyBudget?: number | null;
      startTime?: string | null;
      stopTime?: string | null;
    }) => {
      if (!d?.campaignId) throw new Error("campaignId obrigatório");
      return d;
    }
  )
  .handler(async ({ context, data }) => {
    const conn = await getUserMetaConn(context.userId);
    const body: Record<string, string> = {};
    if (data.name && data.name.trim()) body.name = data.name.trim();
    if (typeof data.dailyBudget === "number" && data.dailyBudget > 0) {
      body.daily_budget = String(Math.round(data.dailyBudget * 100));
    }
    if (data.startTime) body.start_time = new Date(data.startTime).toISOString();
    if (data.stopTime) body.stop_time = new Date(data.stopTime).toISOString();
    if (Object.keys(body).length === 0) return { ok: true, noop: true };
    await metaWrite(`/${data.campaignId}`, conn.access_token, body);
    return { ok: true };
  });

export const duplicateCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { campaignId: string }) => {
    if (!d?.campaignId) throw new Error("campaignId obrigatório");
    return d;
  })
  .handler(async ({ context, data }) => {
    const conn = await getUserMetaConn(context.userId);
    const result = (await metaWrite(`/${data.campaignId}/copies`, conn.access_token, {
      deep_copy: "true",
      status_option: "PAUSED",
    })) as { copied_campaign_id?: string; ad_object_ids?: unknown };
    return { ok: true, newCampaignId: result.copied_campaign_id ?? null };
  });

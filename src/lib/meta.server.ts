// Server-only helpers for the Meta Marketing API.
// Do NOT import this file from client components.

const GRAPH = "https://graph.facebook.com/v20.0";

export function getMetaConfig() {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error("META_APP_ID/META_APP_SECRET não configurados.");
  }
  return { appId, appSecret };
}

export function buildRedirectUri(origin: string) {
  return `${origin.replace(/\/$/, "")}/api/public/meta/callback`;
}

export function buildAuthUrl(args: {
  appId: string;
  redirectUri: string;
  state: string;
  scopes?: string[];
}) {
  const scopes = (args.scopes ?? ["ads_read", "business_management", "public_profile"]).join(",");
  const params = new URLSearchParams({
    client_id: args.appId,
    redirect_uri: args.redirectUri,
    state: args.state,
    response_type: "code",
    scope: scopes,
    auth_type: "rerequest",
  });
  return `https://www.facebook.com/v20.0/dialog/oauth?${params.toString()}`;
}

export async function exchangeCodeForToken(args: {
  appId: string;
  appSecret: string;
  redirectUri: string;
  code: string;
}): Promise<{ access_token: string; expires_in?: number }> {
  const params = new URLSearchParams({
    client_id: args.appId,
    client_secret: args.appSecret,
    redirect_uri: args.redirectUri,
    code: args.code,
  });
  const res = await fetch(`${GRAPH}/oauth/access_token?${params.toString()}`);
  if (!res.ok) throw new Error(`Falha ao trocar code por token: ${await res.text()}`);
  return res.json();
}

export async function exchangeForLongLivedToken(args: {
  appId: string;
  appSecret: string;
  shortLivedToken: string;
}): Promise<{ access_token: string; expires_in?: number }> {
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: args.appId,
    client_secret: args.appSecret,
    fb_exchange_token: args.shortLivedToken,
  });
  const res = await fetch(`${GRAPH}/oauth/access_token?${params.toString()}`);
  if (!res.ok) throw new Error(`Falha ao trocar por long-lived: ${await res.text()}`);
  return res.json();
}

export async function fetchMetaUserId(accessToken: string): Promise<string> {
  const res = await fetch(`${GRAPH}/me?fields=id,name&access_token=${encodeURIComponent(accessToken)}`);
  if (!res.ok) throw new Error(`Falha ao obter usuário Meta: ${await res.text()}`);
  const json = (await res.json()) as { id: string };
  return json.id;
}

export type AdAccountInfo = {
  id: string; // act_xxx
  account_id: string;
  name: string;
  currency?: string;
  account_status?: number;
};

export async function fetchAdAccounts(accessToken: string): Promise<AdAccountInfo[]> {
  const url = `${GRAPH}/me/adaccounts?fields=id,account_id,name,currency,account_status&limit=200&access_token=${encodeURIComponent(accessToken)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao listar contas de anúncios: ${await res.text()}`);
  const json = (await res.json()) as { data: AdAccountInfo[] };
  return json.data ?? [];
}

export type DailyInsight = {
  date_start: string;
  spend: string;
  impressions?: string;
  reach?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  actions?: { action_type: string; value: string }[];
  action_values?: { action_type: string; value: string }[];
};

export async function fetchDailyInsights(args: {
  accessToken: string;
  adAccountId: string; // act_xxx
  since: string; // YYYY-MM-DD
  until: string;
}): Promise<DailyInsight[]> {
  const fields = [
    "spend",
    "impressions",
    "reach",
    "clicks",
    "ctr",
    "cpc",
    "actions",
    "action_values",
  ].join(",");
  const params = new URLSearchParams({
    level: "account",
    time_increment: "1",
    time_range: JSON.stringify({ since: args.since, until: args.until }),
    fields,
    limit: "500",
    access_token: args.accessToken,
  });
  const url = `${GRAPH}/${args.adAccountId}/insights?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao buscar insights: ${await res.text()}`);
  const json = (await res.json()) as { data: DailyInsight[] };
  return json.data ?? [];
}

function sumAction(list: { action_type: string; value: string }[] | undefined, types: string[]) {
  if (!list) return 0;
  let total = 0;
  for (const a of list) {
    if (types.includes(a.action_type)) total += Number(a.value) || 0;
  }
  return total;
}

export function normalizeInsight(row: DailyInsight, userId: string, adAccountId: string) {
  const spend = Number(row.spend) || 0;
  const impressions = Number(row.impressions) || 0;
  const reach = Number(row.reach) || 0;
  const clicks = Number(row.clicks) || 0;
  const ctr = Number(row.ctr) || 0;
  const cpc = Number(row.cpc) || 0;
  const leads = sumAction(row.actions, [
    "lead",
    "onsite_conversion.lead_grouped",
    "offsite_conversion.fb_pixel_lead",
  ]);
  const purchases = sumAction(row.actions, [
    "purchase",
    "offsite_conversion.fb_pixel_purchase",
    "omni_purchase",
  ]);
  const revenue = sumAction(row.action_values, [
    "purchase",
    "offsite_conversion.fb_pixel_purchase",
    "omni_purchase",
  ]);
  const roas = spend > 0 ? revenue / spend : 0;
  return {
    user_id: userId,
    ad_account_id: adAccountId,
    date: row.date_start,
    spend,
    impressions,
    reach,
    clicks,
    ctr,
    cpc,
    leads,
    purchases,
    revenue,
    roas,
  };
}

export type CampaignInsight = {
  campaign_id: string;
  campaign_name: string;
  spend?: string;
  impressions?: string;
  reach?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  actions?: { action_type: string; value: string }[];
  action_values?: { action_type: string; value: string }[];
};

export async function fetchCampaignInsights(args: {
  accessToken: string;
  adAccountId: string;
  since: string;
  until: string;
}): Promise<CampaignInsight[]> {
  const fields = [
    "campaign_id",
    "campaign_name",
    "spend",
    "impressions",
    "reach",
    "clicks",
    "ctr",
    "cpc",
    "actions",
    "action_values",
  ].join(",");
  const params = new URLSearchParams({
    level: "campaign",
    time_range: JSON.stringify({ since: args.since, until: args.until }),
    fields,
    limit: "500",
    access_token: args.accessToken,
  });
  const url = `${GRAPH}/${args.adAccountId}/insights?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao buscar campanhas: ${await res.text()}`);
  const json = (await res.json()) as { data: CampaignInsight[] };
  return json.data ?? [];
}

export type CampaignStatusInfo = { id: string; name: string; effective_status: string };

export async function fetchCampaignStatuses(args: {
  accessToken: string;
  adAccountId: string;
}): Promise<CampaignStatusInfo[]> {
  const params = new URLSearchParams({
    fields: "id,name,effective_status",
    limit: "500",
    access_token: args.accessToken,
  });
  const url = `${GRAPH}/${args.adAccountId}/campaigns?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao listar campanhas: ${await res.text()}`);
  const json = (await res.json()) as { data: CampaignStatusInfo[] };
  return json.data ?? [];
}

export function normalizeCampaign(
  row: CampaignInsight,
  effectiveStatus?: string
) {
  const spend = Number(row.spend) || 0;
  const impressions = Number(row.impressions) || 0;
  const reach = Number(row.reach) || 0;
  const clicks = Number(row.clicks) || 0;
  const ctr = Number(row.ctr) || 0;
  const cpc = Number(row.cpc) || 0;
  const leads = sumAction(row.actions, [
    "lead",
    "onsite_conversion.lead_grouped",
    "offsite_conversion.fb_pixel_lead",
  ]);
  const purchases = sumAction(row.actions, [
    "purchase",
    "offsite_conversion.fb_pixel_purchase",
    "omni_purchase",
  ]);
  const revenue = sumAction(row.action_values, [
    "purchase",
    "offsite_conversion.fb_pixel_purchase",
    "omni_purchase",
  ]);
  const roas = spend > 0 ? revenue / spend : 0;
  const cpl = leads > 0 ? spend / leads : 0;
  const isPaused = effectiveStatus && effectiveStatus !== "ACTIVE";
  let status: "excelente" | "atencao" | "critico" | "pausada";
  if (isPaused) status = "pausada";
  else if (roas >= 8) status = "excelente";
  else if (roas >= 4) status = "atencao";
  else status = "critico";
  return {
    id: row.campaign_id,
    name: row.campaign_name,
    status,
    spend,
    impressions,
    reach,
    clicks,
    ctr,
    cpc,
    leads,
    purchases,
    revenue,
    cpl,
    roas,
  };
}

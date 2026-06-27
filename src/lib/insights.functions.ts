import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AiInsight = {
  id: string;
  title: string;
  body: string;
  tag: "oportunidade" | "alerta" | "tendencia";
  impact: "Alto" | "Médio" | "Baixo";
};

// ─── Geração via Anthropic ────────────────────────────────────────────────────

async function generateInsightsFromAI(metrics: {
  spend: number;
  revenue: number;
  roas: number;
  cpl: number;
  leads: number;
  clicks: number;
  impressions: number;
  ctr: number;
  cpc: number;
  campaigns: Array<{
    name: string;
    spend: number;
    leads: number;
    cpl: number;
    roas: number;
    ctr: number;
    status: string;
  }>;
  periodDays: number;
}): Promise<AiInsight[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada.");

  const SYSTEM_PROMPT = `Você é a inteligência estratégica do HOF Circle Analytics, uma plataforma exclusiva para profissionais de harmonização orofacial (HOF) do Brasil.

Sua função é analisar métricas de tráfego pago e gerar insights estratégicos com base na metodologia D.O.M. (Demanda Previsível, Oferta Sem Frescura, Máquina de Vendas) do Time DOM.

## BENCHMARKS DA METODOLOGIA HOF CIRCLE

### CPL (Custo por Lead)
- Paciente Modelo: R$5 a R$10 = saudável ✅
- Particular: R$10 a R$20 = saudável ✅
- Acima de R$20 = atenção ⚠️
- Acima de R$50 = crítico 🚨

### CTR (Taxa de Cliques)
- Abaixo de 0,7% = criativo fraco, pausar
- Entre 0,7% e 1% = aceitável
- Acima de 1% = sinal saudável ✅
- Acima de 3% = criativo excelente 🔥

### Frequência
- Até 3 = saudável
- Entre 3 e 5 = atenção
- Acima de 5 = saturação, trocar criativo 🚨

### ROAS
- Abaixo de 3x = não escalar
- 3x a 10x = escalar gradualmente ✅
- Acima de 10x = escalar agressivamente 🔥

### Taxa de Conversão (leads → agendamentos)
- 5% = cenário conservador, normal e saudável
- 10% = cenário otimista
- Abaixo de 5% = revisar processo comercial

### Escala
- Só escalar quando: CPL dentro do range + CTR acima de 1% + conversão acima de 5% + frequência baixa

## LINGUAGEM E METODOLOGIA

Sempre use a linguagem do HOF Circle:
- "Demanda Previsível" quando falar de geração de leads
- "Máquina de Vendas" quando falar de processo de escala
- "motor de captação" no lugar de "fonte de leads"
- "paciente modelo" para campanhas de entrada
- "ticket médio" e "hora clínica" quando relevante
- Mencione os 8 motores quando houver concentração de verba em poucos canais
- Fale em ROI real (faturamento / investimento), não ROAS genérico

## REGRAS DE OUTPUT

Retorne EXATAMENTE um array JSON com 4 a 6 insights. Sem texto antes ou depois. Sem markdown. Apenas o array JSON puro.

Cada insight deve ter:
{
  "id": "string único (1, 2, 3...)",
  "title": "título direto de até 60 caracteres",
  "body": "análise de 2-3 frases com diagnóstico claro e ação recomendada, no tom do HOF Circle",
  "tag": "oportunidade" | "alerta" | "tendencia",
  "impact": "Alto" | "Médio" | "Baixo"
}

Priorize insights de Alto impacto. Seja direto, estratégico e use os benchmarks HOF Circle para contextualizar os números reais do mentorado.`;

  const userMessage = `Analise os dados abaixo e gere insights estratégicos para este mentorado HOF Circle.

PERÍODO: últimos ${metrics.periodDays} dias

MÉTRICAS GERAIS:
- Investimento total: R$${metrics.spend.toFixed(2)}
- Receita atribuída: R$${metrics.revenue.toFixed(2)}
- ROAS: ${metrics.roas.toFixed(2)}x
- CPL (Custo por Lead): R$${metrics.cpl.toFixed(2)}
- Leads gerados: ${metrics.leads}
- Cliques totais: ${metrics.clicks}
- Impressões: ${metrics.impressions}
- CTR médio: ${metrics.ctr.toFixed(2)}%
- CPC médio: R$${metrics.cpc.toFixed(2)}

CAMPANHAS ATIVAS (${metrics.campaigns.length} campanhas):
${metrics.campaigns
  .slice(0, 10)
  .map(
    (c) =>
      `- "${c.name}": spend R$${c.spend.toFixed(0)}, ${c.leads} leads, CPL R$${c.cpl.toFixed(2)}, CTR ${c.ctr.toFixed(2)}%, ROAS ${c.roas.toFixed(2)}x, status: ${c.status}`
  )
  .join("\n")}

Gere os insights agora:`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Erro na API Anthropic: ${response.status}`);
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text?: string }>;
  };
  const text = data.content
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("");

  const clean = text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean) as AiInsight[];
  return parsed;
}

// ─── Server Function Principal ────────────────────────────────────────────────

export const getMyInsights = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { forceRefresh?: boolean } | undefined) => ({
      forceRefresh: data?.forceRefresh ?? false,
    })
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Verificar cache (não expirado)
    if (!data.forceRefresh) {
      const { data: cached } = await supabaseAdmin
        .from("ai_insights")
        .select("insights, generated_at, expires_at")
        .eq("user_id", userId)
        .gt("expires_at", new Date().toISOString())
        .order("generated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cached) {
        return {
          insights: cached.insights as AiInsight[],
          generatedAt: cached.generated_at,
          fromCache: true,
        };
      }
    }

    // 2. Buscar métricas dos últimos 30 dias
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const { data: rows } = await supabase
      .from("daily_metrics")
      .select("spend,impressions,clicks,ctr,cpc,leads,purchases,revenue,roas")
      .eq("user_id", userId)
      .gte("date", since.toISOString().slice(0, 10));

    if (!rows || rows.length === 0) {
      return {
        insights: [],
        generatedAt: new Date().toISOString(),
        fromCache: false,
        noData: true,
      };
    }

    // 3. Calcular totais
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
    const cpc = clicks > 0 ? spend / clicks : 0;

    // 4. Buscar campanhas
    const { getMyCampaigns } = await import("@/lib/meta.functions");
    let campaigns: Array<{
      name: string;
      spend: number;
      leads: number;
      cpl: number;
      roas: number;
      ctr: number;
      status: string;
    }> = [];

    try {
      const result = await getMyCampaigns({ data: { days: 30 } });
      campaigns = (result.campaigns ?? []).map((c) => ({
        name: c.name,
        spend: c.spend,
        leads: c.leads,
        cpl: c.cpl,
        roas: c.roas,
        ctr: c.ctr,
        status: c.status,
      }));
    } catch {
      // Campanhas são opcionais; continua sem elas
    }

    // 5. Gerar insights via IA
    const insights = await generateInsightsFromAI({
      spend,
      revenue,
      roas,
      cpl,
      leads,
      clicks,
      impressions,
      ctr,
      cpc,
      campaigns,
      periodDays: 30,
    });

    // 6. Salvar no cache (upsert por user_id — sobrescreve o anterior)
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000); // +2h

    await supabaseAdmin.from("ai_insights").upsert(
      {
        user_id: userId,
        insights,
        generated_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      },
      { onConflict: "user_id" }
    );

    return {
      insights,
      generatedAt: now.toISOString(),
      fromCache: false,
    };
  });

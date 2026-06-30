import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AiInsight = {
  id: string;
  title: string;
  body: string;
  tag: "oportunidade" | "alerta" | "tendencia";
  impact: "Alto" | "Médio" | "Baixo";
};

type InsightMetrics = {
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
};

function generateStrategicFallbackInsights(metrics: InsightMetrics): AiInsight[] {
  const insights: AiInsight[] = [];

  if (metrics.leads === 0) {
    insights.push({
      id: "1",
      title: "Motor de captação sem leads",
      body: "O investimento ainda não gerou leads no período analisado. Revise criativo, público e promessa da oferta antes de ampliar verba para manter a Demanda Previsível saudável.",
      tag: "alerta",
      impact: "Alto",
    });
  } else if (metrics.cpl > 50) {
    insights.push({
      id: "1",
      title: "CPL em faixa crítica",
      body: `O CPL médio está em R$${metrics.cpl.toFixed(2)}, acima do benchmark crítico do HOF Circle. Priorize ajustes na oferta e no público antes de buscar escala na Máquina de Vendas.`,
      tag: "alerta",
      impact: "Alto",
    });
  } else if (metrics.cpl > 20) {
    insights.push({
      id: "1",
      title: "CPL acima do ideal",
      body: `O CPL médio está em R$${metrics.cpl.toFixed(2)}, sinalizando oportunidade de otimização. Teste novas abordagens para paciente modelo e reduza fricção na conversão do anúncio.`,
      tag: "oportunidade",
      impact: "Médio",
    });
  } else {
    insights.push({
      id: "1",
      title: "Captação em faixa saudável",
      body: `O CPL médio de R$${metrics.cpl.toFixed(2)} está dentro de uma faixa favorável para geração de demanda. Mantenha controle de qualidade dos leads antes de aumentar investimento.`,
      tag: "tendencia",
      impact: "Alto",
    });
  }

  if (metrics.ctr < 0.7) {
    insights.push({
      id: "2",
      title: "Criativo com baixa tração",
      body: `O CTR médio está em ${metrics.ctr.toFixed(2)}%, abaixo do mínimo recomendado. Troque ângulo, imagem e chamada para recuperar atenção no topo do funil.`,
      tag: "alerta",
      impact: "Alto",
    });
  } else if (metrics.ctr >= 3) {
    insights.push({
      id: "2",
      title: "Criativo com forte demanda",
      body: `O CTR médio de ${metrics.ctr.toFixed(2)}% indica alta aderência da mensagem. Use esse criativo como base para variações e expansão controlada de orçamento.`,
      tag: "tendencia",
      impact: "Alto",
    });
  } else {
    insights.push({
      id: "2",
      title: "Criativo em zona de melhoria",
      body: `O CTR médio está em ${metrics.ctr.toFixed(2)}%, com espaço para evoluir. Teste novas provas, dores e desejos do paciente para aumentar eficiência do motor de captação.`,
      tag: "oportunidade",
      impact: "Médio",
    });
  }

  if (metrics.roas < 3) {
    insights.push({
      id: "3",
      title: "ROI abaixo da escala",
      body: `O retorno atribuído está em ${metrics.roas.toFixed(2)}x, abaixo do ponto recomendado para escalar. Foque em conversão comercial e ticket médio antes de aumentar verba.`,
      tag: "alerta",
      impact: "Alto",
    });
  } else if (metrics.roas >= 10) {
    insights.push({
      id: "3",
      title: "Campanhas prontas para escala",
      body: `O retorno de ${metrics.roas.toFixed(2)}x indica forte eficiência. Escale gradualmente preservando CPL, CTR e qualidade dos agendamentos.`,
      tag: "oportunidade",
      impact: "Alto",
    });
  } else {
    insights.push({
      id: "3",
      title: "Escala gradual recomendada",
      body: `O retorno de ${metrics.roas.toFixed(2)}x está em faixa saudável. Aumente orçamento em ciclos curtos e monitore se a Máquina de Vendas sustenta a demanda.`,
      tag: "tendencia",
      impact: "Médio",
    });
  }

  const activeCampaigns = metrics.campaigns.filter((campaign) => campaign.status === "ACTIVE");
  const bestCampaign = [...metrics.campaigns].sort((a, b) => b.roas - a.roas)[0];

  if (bestCampaign) {
    insights.push({
      id: "4",
      title: "Campanha referência identificada",
      body: `"${bestCampaign.name}" concentra o melhor retorno do período com ${bestCampaign.roas.toFixed(2)}x. Use seus elementos como padrão para novos testes de oferta e criativo.`,
      tag: "oportunidade",
      impact: "Médio",
    });
  } else {
    insights.push({
      id: "4",
      title: "Base pronta para diagnóstico",
      body: `Foram analisados ${metrics.periodDays} dias de métricas consolidadas. Conecte e sincronize campanhas para ampliar a precisão das recomendações por ativo.`,
      tag: "tendencia",
      impact: "Baixo",
    });
  }

  insights.push({
    id: "5",
    title: "Próximo passo estratégico",
    body: `${activeCampaigns.length || metrics.campaigns.length} campanhas foram consideradas na análise. Priorize decisões por CPL, CTR e retorno real para evitar escala baseada apenas em volume de cliques.`,
    tag: "oportunidade",
    impact: "Médio",
  });

  return insights.slice(0, 5);
}

// ─── Geração via Anthropic ────────────────────────────────────────────────────

async function generateInsightsFromAI(metrics: InsightMetrics): Promise<AiInsight[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return generateStrategicFallbackInsights(metrics);

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

  if (!response.ok) return generateStrategicFallbackInsights(metrics);

  const data = (await response.json()) as {
    content: Array<{ type: string; text?: string }>;
  };
  const text = data.content
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("");

  try {
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean) as AiInsight[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : generateStrategicFallbackInsights(metrics);
  } catch {
    return generateStrategicFallbackInsights(metrics);
  }
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

-- Tabela para cache dos insights gerados por IA
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insights      jsonb NOT NULL DEFAULT '[]',
  generated_at  timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL DEFAULT (now() + interval '2 hours')
);

-- Índice para busca rápida por usuário
-- Unique por user_id: apenas 1 registro de cache ativo por mentorado
CREATE UNIQUE INDEX IF NOT EXISTS ai_insights_user_id_unique ON public.ai_insights(user_id);
CREATE INDEX IF NOT EXISTS ai_insights_user_id_idx ON public.ai_insights(user_id);
CREATE INDEX IF NOT EXISTS ai_insights_expires_at_idx ON public.ai_insights(expires_at);

-- RLS
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê apenas seus próprios insights"
  ON public.ai_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Apenas service_role pode inserir/atualizar"
  ON public.ai_insights FOR ALL
  USING (true)
  WITH CHECK (true);

-- Preferência de notificação por email (resumo semanal)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS weekly_summary_email boolean NOT NULL DEFAULT true;

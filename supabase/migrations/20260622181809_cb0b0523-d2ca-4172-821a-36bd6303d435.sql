
-- Profiles table for onboarding state
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing users
INSERT INTO public.profiles (id, email)
SELECT id, email FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- updated_at helper
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_profiles_touch BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Meta connections (one row per user; service_role owns tokens)
CREATE TABLE public.meta_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  meta_user_id text NOT NULL,
  access_token text NOT NULL,
  token_expires_at timestamptz,
  ad_account_id text,
  account_name text,
  available_accounts jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.meta_connections TO service_role;
-- No grants to authenticated: tokens stay server-side. Reads happen via server functions.
ALTER TABLE public.meta_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role manages meta_connections" ON public.meta_connections FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE TRIGGER trg_meta_conn_touch BEFORE UPDATE ON public.meta_connections
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- OAuth state (short-lived, server-side only)
CREATE TABLE public.meta_oauth_states (
  state text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '15 minutes')
);
GRANT ALL ON public.meta_oauth_states TO service_role;
ALTER TABLE public.meta_oauth_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role manages meta_oauth_states" ON public.meta_oauth_states FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Daily metrics
CREATE TABLE public.daily_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ad_account_id text NOT NULL,
  date date NOT NULL,
  spend numeric(14,2) NOT NULL DEFAULT 0,
  impressions bigint NOT NULL DEFAULT 0,
  reach bigint NOT NULL DEFAULT 0,
  clicks bigint NOT NULL DEFAULT 0,
  ctr numeric(8,4) NOT NULL DEFAULT 0,
  cpc numeric(10,4) NOT NULL DEFAULT 0,
  leads integer NOT NULL DEFAULT 0,
  purchases integer NOT NULL DEFAULT 0,
  revenue numeric(14,2) NOT NULL DEFAULT 0,
  roas numeric(10,4) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, ad_account_id, date)
);
GRANT SELECT ON public.daily_metrics TO authenticated;
GRANT ALL ON public.daily_metrics TO service_role;
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own metrics" ON public.daily_metrics FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_daily_metrics_user_date ON public.daily_metrics (user_id, date DESC);
CREATE TRIGGER trg_daily_metrics_touch BEFORE UPDATE ON public.daily_metrics
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'mentor')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'mentor'::app_role
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id);

DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
CREATE POLICY "Admins view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins update all profiles" ON public.profiles;
CREATE POLICY "Admins update all profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins view all metrics" ON public.daily_metrics;
CREATE POLICY "Admins view all metrics"
  ON public.daily_metrics FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins view all meta connections" ON public.meta_connections;
CREATE POLICY "Admins view all meta connections"
  ON public.meta_connections FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.admin_user_summary()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  is_active boolean,
  onboarding_completed boolean,
  created_at timestamptz,
  roles app_role[],
  meta_connected boolean,
  ad_account_id text,
  last_synced_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.email,
    p.full_name,
    p.is_active,
    p.onboarding_completed,
    p.created_at,
    COALESCE(ARRAY_AGG(DISTINCT ur.role) FILTER (WHERE ur.role IS NOT NULL), ARRAY[]::app_role[]) AS roles,
    (mc.id IS NOT NULL) AS meta_connected,
    mc.ad_account_id,
    mc.last_synced_at
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON ur.user_id = p.id
  LEFT JOIN public.meta_connections mc ON mc.user_id = p.id
  WHERE public.has_role(auth.uid(), 'admin')
  GROUP BY p.id, mc.id, mc.ad_account_id, mc.last_synced_at;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_user_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_user_summary() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_global_stats()
RETURNS TABLE (
  total_mentors bigint,
  total_admins bigint,
  total_active bigint,
  total_inactive bigint,
  total_meta_connections bigint,
  total_conversions bigint,
  total_revenue numeric,
  total_spend numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(DISTINCT user_id) FROM public.user_roles WHERE role = 'mentor'),
    (SELECT COUNT(DISTINCT user_id) FROM public.user_roles WHERE role = 'admin'),
    (SELECT COUNT(*) FROM public.profiles WHERE is_active = true),
    (SELECT COUNT(*) FROM public.profiles WHERE is_active = false),
    (SELECT COUNT(*) FROM public.meta_connections WHERE ad_account_id IS NOT NULL),
    COALESCE((SELECT SUM(purchases + leads) FROM public.daily_metrics), 0)::bigint,
    COALESCE((SELECT SUM(revenue) FROM public.daily_metrics), 0),
    COALESCE((SELECT SUM(spend) FROM public.daily_metrics), 0)
  WHERE public.has_role(auth.uid(), 'admin');
$$;

REVOKE EXECUTE ON FUNCTION public.admin_global_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_global_stats() TO authenticated;

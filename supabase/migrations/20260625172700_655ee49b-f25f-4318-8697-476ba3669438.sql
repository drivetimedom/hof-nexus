
CREATE TABLE IF NOT EXISTS public.funnel_manual_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  conversations integer NOT NULL DEFAULT 0,
  qualified_leads integer NOT NULL DEFAULT 0,
  sales_count integer NOT NULL DEFAULT 0,
  sales_revenue numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.funnel_manual_entries TO authenticated;
GRANT ALL ON public.funnel_manual_entries TO service_role;

ALTER TABLE public.funnel_manual_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own funnel entries"
  ON public.funnel_manual_entries FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all funnel entries"
  ON public.funnel_manual_entries FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER funnel_manual_entries_touch_updated_at
  BEFORE UPDATE ON public.funnel_manual_entries
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS funnel_manual_entries_user_date_idx
  ON public.funnel_manual_entries(user_id, date DESC);

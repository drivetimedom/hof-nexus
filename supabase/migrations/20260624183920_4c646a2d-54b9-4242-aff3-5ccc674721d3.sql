GRANT SELECT, UPDATE, DELETE ON public.meta_connections TO authenticated;

CREATE POLICY "Users view own meta connection"
  ON public.meta_connections FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own meta connection"
  ON public.meta_connections FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own meta connection"
  ON public.meta_connections FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
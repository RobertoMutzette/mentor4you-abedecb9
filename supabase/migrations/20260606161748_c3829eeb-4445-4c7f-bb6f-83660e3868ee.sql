DROP POLICY IF EXISTS "users manage own rate limits" ON public.rate_limits;
CREATE POLICY "users manage own rate limits" ON public.rate_limits FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
REVOKE ALL ON public.rate_limits FROM anon;
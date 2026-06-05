
-- Extend profiles with full profile fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cover_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS languages text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS certifications jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS social_instagram text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS social_facebook text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS social_linkedin text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS social_x text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS website text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_pref text NOT NULL DEFAULT 'in-app',
  ADD COLUMN IF NOT EXISTS availability_schedule jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS mentorship_topics text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT '';

-- Rate limit table (ad-hoc per-user counter)
CREATE TABLE IF NOT EXISTS public.rate_limits (
  user_id uuid NOT NULL,
  action text NOT NULL,
  window_start timestamptz NOT NULL DEFAULT date_trunc('hour', now()),
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, action, window_start)
);
GRANT SELECT, INSERT, UPDATE ON public.rate_limits TO authenticated;
GRANT ALL ON public.rate_limits TO service_role;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own rate limits" ON public.rate_limits
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

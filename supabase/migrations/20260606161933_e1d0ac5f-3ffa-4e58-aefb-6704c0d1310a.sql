
-- =========================
-- 1. Profiles v2 fields
-- =========================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS age_range text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS communication_style text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS personality text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS meeting_frequency text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS learning_style text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS response_time text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS profile_visibility text NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS show_email boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_messages_from text NOT NULL DEFAULT 'connections';

-- =========================
-- 2. Notifications
-- =========================
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  link text NOT NULL DEFAULT '',
  read boolean NOT NULL DEFAULT false,
  data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "users update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "users delete own notifications" ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "auth users create notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications(user_id, created_at DESC);

-- =========================
-- 3. Blocks & reports
-- =========================
CREATE TABLE IF NOT EXISTS public.user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id)
);
GRANT SELECT, INSERT, DELETE ON public.user_blocks TO authenticated;
GRANT ALL ON public.user_blocks TO service_role;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own blocks" ON public.user_blocks FOR SELECT TO authenticated USING (blocker_id = auth.uid());
CREATE POLICY "users create own blocks" ON public.user_blocks FOR INSERT TO authenticated WITH CHECK (blocker_id = auth.uid() AND blocker_id <> blocked_id);
CREATE POLICY "users delete own blocks" ON public.user_blocks FOR DELETE TO authenticated USING (blocker_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.user_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  reported_id uuid NOT NULL,
  reason text NOT NULL,
  details text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.user_reports TO authenticated;
GRANT ALL ON public.user_reports TO service_role;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own reports" ON public.user_reports FOR SELECT TO authenticated USING (reporter_id = auth.uid());
CREATE POLICY "users create reports" ON public.user_reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid() AND reporter_id <> reported_id);

-- =========================
-- 4. Project workspaces
-- =========================
CREATE TABLE IF NOT EXISTS public.project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_members TO authenticated;
GRANT ALL ON public.project_members TO service_role;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_project_owner(_project_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.projects WHERE id = _project_id AND owner_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.is_project_member(_project_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects WHERE id = _project_id AND owner_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.project_members WHERE project_id = _project_id AND user_id = _user_id
  )
$$;

CREATE POLICY "auth read project members" ON public.project_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "owners manage project members" ON public.project_members FOR INSERT TO authenticated WITH CHECK (public.is_project_owner(project_id, auth.uid()));
CREATE POLICY "owners update project members" ON public.project_members FOR UPDATE TO authenticated USING (public.is_project_owner(project_id, auth.uid())) WITH CHECK (public.is_project_owner(project_id, auth.uid()));
CREATE POLICY "owners or self remove member" ON public.project_members FOR DELETE TO authenticated USING (public.is_project_owner(project_id, auth.uid()) OR user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.project_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  from_user uuid NOT NULL,
  to_user uuid NOT NULL,
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, to_user)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_invites TO authenticated;
GRANT ALL ON public.project_invites TO service_role;
ALTER TABLE public.project_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "involved read invites" ON public.project_invites FOR SELECT TO authenticated USING (from_user = auth.uid() OR to_user = auth.uid());
CREATE POLICY "owners send invites" ON public.project_invites FOR INSERT TO authenticated WITH CHECK (from_user = auth.uid() AND public.is_project_owner(project_id, auth.uid()) AND from_user <> to_user);
CREATE POLICY "recipient updates invite" ON public.project_invites FOR UPDATE TO authenticated USING (to_user = auth.uid()) WITH CHECK (to_user = auth.uid());
CREATE POLICY "sender cancels invite" ON public.project_invites FOR DELETE TO authenticated USING (from_user = auth.uid());

CREATE TABLE IF NOT EXISTS public.project_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_comments TO authenticated;
GRANT ALL ON public.project_comments TO service_role;
ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read project comments" ON public.project_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth post project comments" ON public.project_comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "author updates own comment" ON public.project_comments FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "author or owner deletes comment" ON public.project_comments FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_project_owner(project_id, auth.uid()));

CREATE TABLE IF NOT EXISTS public.project_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_updates TO authenticated;
GRANT ALL ON public.project_updates TO service_role;
ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read project updates" ON public.project_updates FOR SELECT TO authenticated USING (true);
CREATE POLICY "members post updates" ON public.project_updates FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND public.is_project_member(project_id, auth.uid()));
CREATE POLICY "author deletes update" ON public.project_updates FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_project_owner(project_id, auth.uid()));

-- =========================
-- 5. Realtime
-- =========================
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_updates;

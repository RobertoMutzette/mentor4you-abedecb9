-- =========================
-- connection_requests
-- =========================
CREATE TYPE public.request_status AS ENUM ('pending', 'accepted', 'declined');

CREATE TABLE public.connection_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.request_status NOT NULL DEFAULT 'pending',
  message text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (from_user, to_user)
);
CREATE INDEX idx_conn_to ON public.connection_requests(to_user);
CREATE INDEX idx_conn_from ON public.connection_requests(from_user);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.connection_requests TO authenticated;
GRANT ALL ON public.connection_requests TO service_role;

ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own requests" ON public.connection_requests
  FOR SELECT TO authenticated
  USING (from_user = auth.uid() OR to_user = auth.uid());

CREATE POLICY "users send requests" ON public.connection_requests
  FOR INSERT TO authenticated
  WITH CHECK (from_user = auth.uid() AND from_user <> to_user);

CREATE POLICY "recipient updates status" ON public.connection_requests
  FOR UPDATE TO authenticated
  USING (to_user = auth.uid())
  WITH CHECK (to_user = auth.uid());

CREATE POLICY "sender cancels request" ON public.connection_requests
  FOR DELETE TO authenticated
  USING (from_user = auth.uid());

CREATE TRIGGER trg_conn_updated
BEFORE UPDATE ON public.connection_requests
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================
-- projects
-- =========================
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'idea', -- idea | building | launched | paused
  completion_percentage int NOT NULL DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),
  funding_goal numeric NOT NULL DEFAULT 0,
  funding_raised numeric NOT NULL DEFAULT 0,
  tags text[] NOT NULL DEFAULT '{}',
  skills_needed text[] NOT NULL DEFAULT '{}',
  github_url text NOT NULL DEFAULT '',
  demo_url text NOT NULL DEFAULT '',
  milestones jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_projects_owner ON public.projects(owner_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth users read projects" ON public.projects
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "owners insert projects" ON public.projects
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());

CREATE POLICY "owners update projects" ON public.projects
  FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "owners delete projects" ON public.projects
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE TRIGGER trg_projects_updated
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
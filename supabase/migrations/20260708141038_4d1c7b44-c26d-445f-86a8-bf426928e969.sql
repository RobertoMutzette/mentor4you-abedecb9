
-- ============ location on profiles & projects ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric,
  ADD COLUMN IF NOT EXISTS location_label text NOT NULL DEFAULT '';

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric,
  ADD COLUMN IF NOT EXISTS location_label text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS cover_image_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS pitch text NOT NULL DEFAULT '';

-- ============ posts <-> projects link ============
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS posts_project_idx ON public.posts(project_id);

-- ============ user roles (add institution + admin) ============
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'public.app_role'::regtype AND enumlabel = 'institution') THEN
    ALTER TYPE public.app_role ADD VALUE 'institution';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'public.app_role'::regtype AND enumlabel = 'admin') THEN
    ALTER TYPE public.app_role ADD VALUE 'admin';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_roles' AND policyname='auth read own roles') THEN
    CREATE POLICY "auth read own roles" ON public.user_roles FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- ============ institutions ============
CREATE TABLE IF NOT EXISTS public.institutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text UNIQUE,
  logo_url text NOT NULL DEFAULT '',
  cover_url text NOT NULL DEFAULT '',
  website text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  location_label text NOT NULL DEFAULT '',
  latitude numeric, longitude numeric,
  verified boolean NOT NULL DEFAULT false,
  contact_email text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.institutions TO authenticated;
GRANT ALL ON public.institutions TO service_role;
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read institutions" ON public.institutions FOR SELECT TO authenticated USING (true);
CREATE POLICY "institution owners insert" ON public.institutions FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "institution owners update" ON public.institutions FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid() AND verified = (SELECT verified FROM public.institutions WHERE id = institutions.id));
CREATE POLICY "institution owners delete" ON public.institutions FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

CREATE TRIGGER trg_institutions_updated BEFORE UPDATE ON public.institutions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ institution positions ============
CREATE TABLE IF NOT EXISTS public.institution_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  title text NOT NULL,
  field text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  position_type text NOT NULL DEFAULT 'research',
  location_label text NOT NULL DEFAULT '',
  remote boolean NOT NULL DEFAULT false,
  deadline date,
  apply_url text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  cover_url text NOT NULL DEFAULT '',
  like_count integer NOT NULL DEFAULT 0,
  save_count integer NOT NULL DEFAULT 0,
  comment_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.institution_positions TO authenticated;
GRANT ALL ON public.institution_positions TO service_role;
ALTER TABLE public.institution_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read positions" ON public.institution_positions FOR SELECT TO authenticated USING (true);
CREATE POLICY "verified institution owners write positions" ON public.institution_positions FOR INSERT TO authenticated
  WITH CHECK (EXISTS(SELECT 1 FROM public.institutions i WHERE i.id = institution_id AND i.owner_id = auth.uid() AND i.verified = true));
CREATE POLICY "institution owners update positions" ON public.institution_positions FOR UPDATE TO authenticated
  USING (EXISTS(SELECT 1 FROM public.institutions i WHERE i.id = institution_id AND i.owner_id = auth.uid()));
CREATE POLICY "institution owners delete positions" ON public.institution_positions FOR DELETE TO authenticated
  USING (EXISTS(SELECT 1 FROM public.institutions i WHERE i.id = institution_id AND i.owner_id = auth.uid()));

CREATE TRIGGER trg_positions_updated BEFORE UPDATE ON public.institution_positions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX IF NOT EXISTS positions_created_idx ON public.institution_positions(created_at DESC);
CREATE INDEX IF NOT EXISTS positions_institution_idx ON public.institution_positions(institution_id);

-- ============ position interactions ============
CREATE TABLE IF NOT EXISTS public.position_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id uuid NOT NULL REFERENCES public.institution_positions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'like',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(position_id, user_id, kind)
);
GRANT SELECT, INSERT, DELETE ON public.position_reactions TO authenticated;
GRANT ALL ON public.position_reactions TO service_role;
ALTER TABLE public.position_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read reactions" ON public.position_reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert own reaction" ON public.position_reactions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "auth delete own reaction" ON public.position_reactions FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.position_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id uuid NOT NULL REFERENCES public.institution_positions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(position_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.position_saves TO authenticated;
GRANT ALL ON public.position_saves TO service_role;
ALTER TABLE public.position_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read own saves" ON public.position_saves FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "auth insert own save" ON public.position_saves FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "auth delete own save" ON public.position_saves FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.position_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id uuid NOT NULL REFERENCES public.institution_positions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.position_comments TO authenticated;
GRANT ALL ON public.position_comments TO service_role;
ALTER TABLE public.position_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read comments" ON public.position_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert own comment" ON public.position_comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "auth delete own comment" ON public.position_comments FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============ institution applications (pending signup requests) ============
CREATE TABLE IF NOT EXISTS public.institution_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_name text NOT NULL,
  website text NOT NULL DEFAULT '',
  contact_email text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);
GRANT SELECT, INSERT ON public.institution_applications TO authenticated;
GRANT ALL ON public.institution_applications TO service_role;
ALTER TABLE public.institution_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read own applications" ON public.institution_applications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "auth insert own application" ON public.institution_applications FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

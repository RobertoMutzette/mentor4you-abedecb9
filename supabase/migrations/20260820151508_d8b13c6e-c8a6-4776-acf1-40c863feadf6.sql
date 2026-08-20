
ALTER TABLE public.institution_applications
  ADD COLUMN IF NOT EXISTS institution_type text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS email_domain text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS registration_id text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS document_path text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_role text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_phone text NOT NULL DEFAULT '';

ALTER TABLE public.institutions
  ADD COLUMN IF NOT EXISTS institution_type text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS email_domain text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS registration_id text NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS public.institution_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'org_member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (institution_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.institution_members TO authenticated;
GRANT ALL ON public.institution_members TO service_role;
ALTER TABLE public.institution_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_institution_member(_inst uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.institution_members m WHERE m.institution_id = _inst AND m.user_id = _user)
      OR EXISTS (SELECT 1 FROM public.institutions i WHERE i.id = _inst AND i.owner_id = _user);
$$;
CREATE OR REPLACE FUNCTION public.is_institution_admin(_inst uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.institution_members m WHERE m.institution_id = _inst AND m.user_id = _user AND m.role = 'org_admin')
      OR EXISTS (SELECT 1 FROM public.institutions i WHERE i.id = _inst AND i.owner_id = _user);
$$;
REVOKE EXECUTE ON FUNCTION public.is_institution_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_institution_admin(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_institution_member(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_institution_admin(uuid, uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "members read own team" ON public.institution_members;
CREATE POLICY "members read own team" ON public.institution_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_institution_member(institution_id, auth.uid()));
DROP POLICY IF EXISTS "org admins add members" ON public.institution_members;
CREATE POLICY "org admins add members" ON public.institution_members FOR INSERT TO authenticated
  WITH CHECK (public.is_institution_admin(institution_id, auth.uid()));
DROP POLICY IF EXISTS "org admins update members" ON public.institution_members;
CREATE POLICY "org admins update members" ON public.institution_members FOR UPDATE TO authenticated
  USING (public.is_institution_admin(institution_id, auth.uid()))
  WITH CHECK (public.is_institution_admin(institution_id, auth.uid()));
DROP POLICY IF EXISTS "org admins remove members" ON public.institution_members;
CREATE POLICY "org admins remove members" ON public.institution_members FOR DELETE TO authenticated
  USING (public.is_institution_admin(institution_id, auth.uid()) OR user_id = auth.uid());

INSERT INTO public.institution_members (institution_id, user_id, role)
SELECT i.id, i.owner_id, 'org_admin' FROM public.institutions i
ON CONFLICT (institution_id, user_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.institution_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'org_member',
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  accepted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.institution_invites TO authenticated;
GRANT ALL ON public.institution_invites TO service_role;
ALTER TABLE public.institution_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org admins read invites" ON public.institution_invites;
CREATE POLICY "org admins read invites" ON public.institution_invites FOR SELECT TO authenticated
  USING (public.is_institution_admin(institution_id, auth.uid()) OR lower(email) = lower(coalesce((auth.jwt() ->> 'email'), '')));
DROP POLICY IF EXISTS "org admins create invites" ON public.institution_invites;
CREATE POLICY "org admins create invites" ON public.institution_invites FOR INSERT TO authenticated
  WITH CHECK (public.is_institution_admin(institution_id, auth.uid()) AND invited_by = auth.uid());
DROP POLICY IF EXISTS "org admins revoke invites" ON public.institution_invites;
CREATE POLICY "org admins revoke invites" ON public.institution_invites FOR DELETE TO authenticated
  USING (public.is_institution_admin(institution_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.accept_institution_invite(_token text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _inv public.institution_invites%ROWTYPE; _email text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT * INTO _inv FROM public.institution_invites WHERE token = _token;
  IF _inv.id IS NULL THEN RAISE EXCEPTION 'Invite not found'; END IF;
  IF _inv.status <> 'pending' THEN RAISE EXCEPTION 'Invite already used'; END IF;
  IF _inv.expires_at < now() THEN RAISE EXCEPTION 'Invite expired'; END IF;
  SELECT u.email INTO _email FROM auth.users u WHERE u.id = auth.uid();
  IF lower(coalesce(_email, '')) <> lower(_inv.email) THEN
    RAISE EXCEPTION 'This invite was issued for a different email address';
  END IF;

  INSERT INTO public.institution_members (institution_id, user_id, role)
  VALUES (_inv.institution_id, auth.uid(), _inv.role)
  ON CONFLICT (institution_id, user_id) DO UPDATE SET role = EXCLUDED.role;

  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'institution')
  ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE public.institution_invites SET status = 'accepted', accepted_by = auth.uid() WHERE id = _inv.id;
  RETURN _inv.institution_id;
END $$;
REVOKE EXECUTE ON FUNCTION public.accept_institution_invite(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_institution_invite(text) TO authenticated, service_role;

DROP POLICY IF EXISTS "verified institution owners write positions" ON public.institution_positions;
DROP POLICY IF EXISTS "institution staff write positions" ON public.institution_positions;
CREATE POLICY "institution staff write positions" ON public.institution_positions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.institutions i WHERE i.id = institution_id AND i.verified = true)
              AND public.is_institution_member(institution_id, auth.uid()));
DROP POLICY IF EXISTS "institution owners update positions" ON public.institution_positions;
DROP POLICY IF EXISTS "institution staff update positions" ON public.institution_positions;
CREATE POLICY "institution staff update positions" ON public.institution_positions FOR UPDATE TO authenticated
  USING (public.is_institution_member(institution_id, auth.uid()))
  WITH CHECK (public.is_institution_member(institution_id, auth.uid()));
DROP POLICY IF EXISTS "institution owners delete positions" ON public.institution_positions;
DROP POLICY IF EXISTS "institution staff delete positions" ON public.institution_positions;
CREATE POLICY "institution staff delete positions" ON public.institution_positions FOR DELETE TO authenticated
  USING (public.is_institution_member(institution_id, auth.uid()));

DROP POLICY IF EXISTS "institution owners update" ON public.institutions;
DROP POLICY IF EXISTS "institution staff update" ON public.institutions;
CREATE POLICY "institution staff update" ON public.institutions FOR UPDATE TO authenticated
  USING (public.is_institution_member(id, auth.uid()))
  WITH CHECK (public.is_institution_member(id, auth.uid())
              AND verified = (SELECT i2.verified FROM public.institutions i2 WHERE i2.id = institutions.id));

CREATE TABLE IF NOT EXISTS public.funders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  funder_type text NOT NULL DEFAULT 'fund',
  description text NOT NULL DEFAULT '',
  focus_areas text[] NOT NULL DEFAULT '{}',
  ticket_range text NOT NULL DEFAULT '',
  location_label text NOT NULL DEFAULT '',
  website text NOT NULL DEFAULT '',
  contact_email text NOT NULL DEFAULT '',
  logo_url text NOT NULL DEFAULT '',
  verified boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.funders TO authenticated;
GRANT ALL ON public.funders TO service_role;
ALTER TABLE public.funders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "institution staff read funders" ON public.funders;
CREATE POLICY "institution staff read funders" ON public.funders FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.institution_members m JOIN public.institutions i ON i.id = m.institution_id
                 WHERE m.user_id = auth.uid() AND i.verified = true));

CREATE TABLE IF NOT EXISTS public.institution_pitches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  funder_id uuid NOT NULL REFERENCES public.funders(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  body text NOT NULL,
  amount_requested numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'sent',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.institution_pitches TO authenticated;
GRANT ALL ON public.institution_pitches TO service_role;
ALTER TABLE public.institution_pitches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff read own institution pitches" ON public.institution_pitches;
CREATE POLICY "staff read own institution pitches" ON public.institution_pitches FOR SELECT TO authenticated
  USING (public.is_institution_member(institution_id, auth.uid()));
DROP POLICY IF EXISTS "staff create pitches" ON public.institution_pitches;
CREATE POLICY "staff create pitches" ON public.institution_pitches FOR INSERT TO authenticated
  WITH CHECK (public.is_institution_member(institution_id, auth.uid()) AND created_by = auth.uid()
              AND EXISTS (SELECT 1 FROM public.institutions i WHERE i.id = institution_id AND i.verified = true));
DROP POLICY IF EXISTS "staff delete own pitches" ON public.institution_pitches;
CREATE POLICY "staff delete own pitches" ON public.institution_pitches FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.is_institution_admin(institution_id, auth.uid()));

INSERT INTO public.funders (name, funder_type, description, focus_areas, ticket_range, location_label, website, contact_email)
SELECT * FROM (VALUES
  ('Horizon Europe Innovation Fund', 'public_grant', 'EU framework programme funding collaborative research and innovation across member states and associated countries.', ARRAY['deep tech','climate','health'], 'EUR 500k - 5M', 'Brussels, Belgium', 'https://commission.europa.eu', 'grants@example-horizon.eu'),
  ('Northbridge Science Capital', 'venture', 'Early-stage venture fund investing in university spin-outs and lab-to-market deep tech.', ARRAY['deep tech','biotech','robotics'], 'EUR 250k - 2M', 'Zurich, Switzerland', 'https://example-northbridge.com', 'deals@example-northbridge.com'),
  ('Adler Family Foundation', 'foundation', 'Philanthropic foundation supporting doctoral fellowships and open research infrastructure.', ARRAY['education','open science','fellowships'], 'EUR 50k - 400k', 'Vienna, Austria', 'https://example-adler.org', 'programs@example-adler.org'),
  ('Meridian Impact Partners', 'impact', 'Impact investor backing incubator programmes and social innovation challenges with academic partners.', ARRAY['social impact','sustainability','education'], 'EUR 100k - 1M', 'London, United Kingdom', 'https://example-meridian.com', 'partnerships@example-meridian.com'),
  ('Pacific Rim Research Alliance', 'corporate', 'Corporate R&D arm co-funding applied research chairs and industrial PhD programmes.', ARRAY['semiconductors','ai','materials'], 'USD 200k - 3M', 'Singapore', 'https://example-pacificrim.com', 'research@example-pacificrim.com'),
  ('Nordic Deeptech Seed', 'venture', 'Seed fund partnering with technical universities on incubator cohorts and challenge prizes.', ARRAY['ai','energy','quantum'], 'EUR 100k - 800k', 'Stockholm, Sweden', 'https://example-nordicseed.com', 'hello@example-nordicseed.com')
) AS v(name, funder_type, description, focus_areas, ticket_range, location_label, website, contact_email)
WHERE NOT EXISTS (SELECT 1 FROM public.funders);

CREATE OR REPLACE FUNCTION public.approve_institution_application(_app_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _app public.institution_applications%ROWTYPE; _inst_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins may approve institutions';
  END IF;
  SELECT * INTO _app FROM public.institution_applications WHERE id = _app_id;
  IF _app.id IS NULL THEN RAISE EXCEPTION 'Application not found'; END IF;
  IF _app.status = 'approved' THEN RAISE EXCEPTION 'Already approved'; END IF;

  INSERT INTO public.institutions (owner_id, name, website, contact_email, description, verified,
                                   institution_type, email_domain, registration_id)
  VALUES (_app.user_id, _app.institution_name, _app.website, _app.contact_email, _app.description, true,
          _app.institution_type, _app.email_domain, _app.registration_id)
  RETURNING id INTO _inst_id;

  INSERT INTO public.institution_members (institution_id, user_id, role)
  VALUES (_inst_id, _app.user_id, 'org_admin')
  ON CONFLICT (institution_id, user_id) DO UPDATE SET role = 'org_admin';

  INSERT INTO public.user_roles (user_id, role) VALUES (_app.user_id, 'institution')
  ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE public.institution_applications SET status = 'approved', reviewed_at = now() WHERE id = _app_id;

  INSERT INTO public.notifications (user_id, type, title, body, link, data)
  VALUES (_app.user_id, 'institution_approved', 'Institution verified',
          _app.institution_name || ' is now verified. You can publish opportunities and invite your team.',
          '/institutions/dashboard', jsonb_build_object('institution_id', _inst_id));

  RETURN _inst_id;
END $$;

DROP POLICY IF EXISTS "users upload own institution docs" ON storage.objects;
CREATE POLICY "users upload own institution docs" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'institution-docs' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "owners and admins read institution docs" ON storage.objects;
CREATE POLICY "owners and admins read institution docs" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'institution-docs' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));
DROP POLICY IF EXISTS "users delete own institution docs" ON storage.objects;
CREATE POLICY "users delete own institution docs" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'institution-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

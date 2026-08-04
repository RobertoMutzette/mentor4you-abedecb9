
-- Applications: admins can read all
CREATE POLICY "admins read all applications" ON public.institution_applications
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Institutions may only be created through the admin approval flow
DROP POLICY IF EXISTS "institution owners insert" ON public.institutions;

CREATE OR REPLACE FUNCTION public.approve_institution_application(_app_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _app public.institution_applications%ROWTYPE; _inst_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins may approve institutions';
  END IF;
  SELECT * INTO _app FROM public.institution_applications WHERE id = _app_id;
  IF _app.id IS NULL THEN RAISE EXCEPTION 'Application not found'; END IF;
  IF _app.status = 'approved' THEN RAISE EXCEPTION 'Already approved'; END IF;

  INSERT INTO public.institutions (owner_id, name, website, contact_email, description, verified)
  VALUES (_app.user_id, _app.institution_name, _app.website, _app.contact_email, _app.description, true)
  RETURNING id INTO _inst_id;

  INSERT INTO public.user_roles (user_id, role) VALUES (_app.user_id, 'institution')
  ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE public.institution_applications
     SET status = 'approved', reviewed_at = now()
   WHERE id = _app_id;

  INSERT INTO public.notifications (user_id, type, title, body, link, data)
  VALUES (_app.user_id, 'institution_approved', 'Institution approved',
          _app.institution_name || ' is now verified. You can publish positions.',
          '/institution/dashboard', jsonb_build_object('institution_id', _inst_id));

  RETURN _inst_id;
END $$;

CREATE OR REPLACE FUNCTION public.reject_institution_application(_app_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _app public.institution_applications%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins may reject institutions';
  END IF;
  SELECT * INTO _app FROM public.institution_applications WHERE id = _app_id;
  IF _app.id IS NULL THEN RAISE EXCEPTION 'Application not found'; END IF;

  UPDATE public.institution_applications
     SET status = 'rejected', reviewed_at = now()
   WHERE id = _app_id;

  INSERT INTO public.notifications (user_id, type, title, body, link, data)
  VALUES (_app.user_id, 'institution_rejected', 'Institution request declined',
          'Your request for ' || _app.institution_name || ' was not approved.',
          '/institutions', '{}'::jsonb);
END $$;

REVOKE ALL ON FUNCTION public.approve_institution_application(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reject_institution_application(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_institution_application(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_institution_application(uuid) TO authenticated;

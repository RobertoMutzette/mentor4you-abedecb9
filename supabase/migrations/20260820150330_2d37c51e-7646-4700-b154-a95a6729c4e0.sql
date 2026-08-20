DROP POLICY IF EXISTS "institution owners update" ON public.institutions;
CREATE POLICY "institution owners update" ON public.institutions
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (
    owner_id = auth.uid()
    AND verified = (SELECT i2.verified FROM public.institutions i2 WHERE i2.id = institutions.id)
  );
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
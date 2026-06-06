
REVOKE EXECUTE ON FUNCTION public.is_project_owner(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_project_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_project_owner(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_project_member(uuid, uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "auth users create notifications" ON public.notifications;
CREATE POLICY "auth users create notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (user_id IS NOT NULL AND auth.uid() IS NOT NULL);

-- Lock down RLS helper SECURITY DEFINER functions so only postgres (used
-- by RLS policy evaluation) and service_role can execute them directly.
REVOKE EXECUTE ON FUNCTION public.is_project_member(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_project_owner(uuid, uuid)  FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.is_project_member(uuid, uuid) TO service_role;
GRANT  EXECUTE ON FUNCTION public.is_project_owner(uuid, uuid)  TO service_role;

-- 1. Fix connection_requests UPDATE: only status & updated_at editable, immutable from/to
CREATE OR REPLACE FUNCTION public.connection_requests_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.from_user IS DISTINCT FROM OLD.from_user
       OR NEW.to_user  IS DISTINCT FROM OLD.to_user
       OR NEW.message  IS DISTINCT FROM OLD.message
       OR NEW.created_at IS DISTINCT FROM OLD.created_at
       OR NEW.id IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'Only status may be updated on connection_requests';
    END IF;
    NEW.updated_at = now();
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS connection_requests_guard ON public.connection_requests;
CREATE TRIGGER connection_requests_guard
  BEFORE UPDATE ON public.connection_requests
  FOR EACH ROW EXECUTE FUNCTION public.connection_requests_guard();

-- 2. Fix notifications INSERT policy: must be self-targeted
DROP POLICY IF EXISTS "auth users create notifications" ON public.notifications;
CREATE POLICY "users insert own notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 3. Lock down rate_limits: only service_role / SECURITY DEFINER can write
DROP POLICY IF EXISTS "users manage own rate limits" ON public.rate_limits;
CREATE POLICY "users read own rate limits" ON public.rate_limits
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
-- No INSERT/UPDATE/DELETE policies → writes only via SECURITY DEFINER function
REVOKE INSERT, UPDATE, DELETE ON public.rate_limits FROM authenticated;

-- 4. Realtime channel authorization: deny broadcast/presence by default;
-- allow only on a topic equal to the user's own uid (private user channel).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='realtime' AND tablename='messages') THEN
    EXECUTE 'DROP POLICY IF EXISTS "auth read own topic" ON realtime.messages';
    EXECUTE 'DROP POLICY IF EXISTS "auth write own topic" ON realtime.messages';
    EXECUTE $p$CREATE POLICY "auth read own topic" ON realtime.messages
      FOR SELECT TO authenticated
      USING (realtime.topic() = auth.uid()::text)$p$;
    EXECUTE $p$CREATE POLICY "auth write own topic" ON realtime.messages
      FOR INSERT TO authenticated
      WITH CHECK (realtime.topic() = auth.uid()::text)$p$;
  END IF;
END $$;

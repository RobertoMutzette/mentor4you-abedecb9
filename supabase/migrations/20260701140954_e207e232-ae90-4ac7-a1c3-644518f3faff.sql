
-- 1. Profiles: honor profile_visibility
DROP POLICY IF EXISTS "auth users read onboarded profiles" ON public.profiles;
CREATE POLICY "auth users read visible profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR (
      onboarded = true
      AND (
        profile_visibility = 'public'
        OR (
          profile_visibility = 'connections'
          AND EXISTS (
            SELECT 1 FROM public.connection_requests cr
            WHERE cr.status = 'accepted'
              AND ((cr.from_user = auth.uid() AND cr.to_user = profiles.id)
                OR (cr.to_user = auth.uid() AND cr.from_user = profiles.id))
          )
        )
      )
    )
  );

-- 2. project_invites: column-level guard trigger
CREATE OR REPLACE FUNCTION public.project_invites_guard()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.id         IS DISTINCT FROM OLD.id
       OR NEW.project_id IS DISTINCT FROM OLD.project_id
       OR NEW.from_user IS DISTINCT FROM OLD.from_user
       OR NEW.to_user   IS DISTINCT FROM OLD.to_user
       OR NEW.message   IS DISTINCT FROM OLD.message
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'Only status may be updated on project_invites';
    END IF;
    NEW.updated_at = now();
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS project_invites_guard ON public.project_invites;
CREATE TRIGGER project_invites_guard BEFORE UPDATE ON public.project_invites
  FOR EACH ROW EXECUTE FUNCTION public.project_invites_guard();

-- 3. Storage policies for post-media bucket
DROP POLICY IF EXISTS "auth read post media"        ON storage.objects;
DROP POLICY IF EXISTS "users upload own post media" ON storage.objects;
DROP POLICY IF EXISTS "users update own post media" ON storage.objects;
DROP POLICY IF EXISTS "users delete own post media" ON storage.objects;
CREATE POLICY "auth read post media"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'post-media');
CREATE POLICY "users upload own post media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'post-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "users update own post media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'post-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "users delete own post media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'post-media' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 4. Social tables
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL DEFAULT '',
  media_paths text[] NOT NULL DEFAULT '{}',
  hashtags text[] NOT NULL DEFAULT '{}',
  mentions uuid[] NOT NULL DEFAULT '{}',
  repost_of uuid REFERENCES public.posts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read posts"     ON public.posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "author writes post"  ON public.posts FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "author edits post"   ON public.posts FOR UPDATE TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY "author deletes post" ON public.posts FOR DELETE TO authenticated USING (author_id = auth.uid());
DROP TRIGGER IF EXISTS posts_updated_at ON public.posts;
CREATE TRIGGER posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX IF NOT EXISTS posts_author_created_idx ON public.posts(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS posts_created_idx ON public.posts(created_at DESC);

CREATE TABLE IF NOT EXISTS public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  followee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_id, followee_id),
  CHECK (follower_id <> followee_id)
);
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT ALL ON public.follows TO service_role;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read follows" ON public.follows FOR SELECT TO authenticated USING (true);
CREATE POLICY "user follows"      ON public.follows FOR INSERT TO authenticated WITH CHECK (follower_id = auth.uid());
CREATE POLICY "user unfollows"    ON public.follows FOR DELETE TO authenticated USING (follower_id = auth.uid());
CREATE INDEX IF NOT EXISTS follows_followee_idx ON public.follows(followee_id);

CREATE TABLE IF NOT EXISTS public.post_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'like',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id, kind)
);
GRANT SELECT, INSERT, DELETE ON public.post_reactions TO authenticated;
GRANT ALL ON public.post_reactions TO service_role;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read reactions" ON public.post_reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "user reacts"         ON public.post_reactions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "user unreacts"       ON public.post_reactions FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS post_reactions_post_idx ON public.post_reactions(post_id);

CREATE TABLE IF NOT EXISTS public.post_comments_social (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  parent_id uuid REFERENCES public.post_comments_social(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.post_comments_social TO authenticated;
GRANT ALL ON public.post_comments_social TO service_role;
ALTER TABLE public.post_comments_social ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read comments"   ON public.post_comments_social FOR SELECT TO authenticated USING (true);
CREATE POLICY "user writes comment"  ON public.post_comments_social FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "user deletes comment" ON public.post_comments_social FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS post_comments_social_post_idx ON public.post_comments_social(post_id, created_at);

-- 5. DM tables
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_b uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_a, user_b),
  CHECK (user_a < user_b)
);
GRANT SELECT ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "participants read conversations"
  ON public.conversations FOR SELECT TO authenticated
  USING (auth.uid() = user_a OR auth.uid() = user_b);

CREATE TABLE IF NOT EXISTS public.dm_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.dm_messages TO authenticated;
GRANT ALL ON public.dm_messages TO service_role;
ALTER TABLE public.dm_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "participants read messages" ON public.dm_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = dm_messages.conversation_id AND (c.user_a = auth.uid() OR c.user_b = auth.uid())));
CREATE POLICY "sender inserts message" ON public.dm_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = dm_messages.conversation_id AND (c.user_a = auth.uid() OR c.user_b = auth.uid())));
CREATE POLICY "recipient marks read" ON public.dm_messages FOR UPDATE TO authenticated
  USING (sender_id <> auth.uid()
    AND EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = dm_messages.conversation_id AND (c.user_a = auth.uid() OR c.user_b = auth.uid())))
  WITH CHECK (sender_id <> auth.uid()
    AND EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = dm_messages.conversation_id AND (c.user_a = auth.uid() OR c.user_b = auth.uid())));
CREATE INDEX IF NOT EXISTS dm_messages_conv_idx ON public.dm_messages(conversation_id, created_at);

CREATE OR REPLACE FUNCTION public.dm_messages_guard()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.conversation_id IS DISTINCT FROM OLD.conversation_id
       OR NEW.sender_id IS DISTINCT FROM OLD.sender_id
       OR NEW.body IS DISTINCT FROM OLD.body
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'Only read_at may be updated on dm_messages';
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS dm_messages_guard ON public.dm_messages;
CREATE TRIGGER dm_messages_guard BEFORE UPDATE ON public.dm_messages
  FOR EACH ROW EXECUTE FUNCTION public.dm_messages_guard();

CREATE OR REPLACE FUNCTION public.dm_messages_bump_conv()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  UPDATE public.conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS dm_messages_bump_conv ON public.dm_messages;
CREATE TRIGGER dm_messages_bump_conv AFTER INSERT ON public.dm_messages
  FOR EACH ROW EXECUTE FUNCTION public.dm_messages_bump_conv();

-- 6. get_or_create_conversation with allow_messages_from enforcement
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(_other uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _me uuid := auth.uid();
  _a uuid; _b uuid; _pref text; _conv_id uuid;
BEGIN
  IF _me IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _other IS NULL OR _other = _me THEN RAISE EXCEPTION 'Invalid conversation target'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = _me AND blocked_id = _other)
       OR (blocker_id = _other AND blocked_id = _me)
  ) THEN RAISE EXCEPTION 'Cannot message this user'; END IF;

  SELECT allow_messages_from INTO _pref FROM public.profiles WHERE id = _other;
  IF _pref = 'nobody' THEN
    RAISE EXCEPTION 'This user does not accept messages';
  ELSIF _pref = 'connections' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.connection_requests
      WHERE status = 'accepted'
        AND ((from_user = _me AND to_user = _other) OR (to_user = _me AND from_user = _other))
    ) THEN RAISE EXCEPTION 'You must be connected to message this user'; END IF;
  END IF;

  IF _me < _other THEN _a := _me; _b := _other;
  ELSE _a := _other; _b := _me; END IF;

  SELECT id INTO _conv_id FROM public.conversations WHERE user_a = _a AND user_b = _b;
  IF _conv_id IS NULL THEN
    INSERT INTO public.conversations (user_a, user_b) VALUES (_a, _b) RETURNING id INTO _conv_id;
  END IF;
  RETURN _conv_id;
END $$;

REVOKE ALL ON FUNCTION public.get_or_create_conversation(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(uuid) TO authenticated;

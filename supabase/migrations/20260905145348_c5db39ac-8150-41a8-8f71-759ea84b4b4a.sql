ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS post_kind text NOT NULL DEFAULT 'update',
  ADD COLUMN IF NOT EXISTS media_types text[] NOT NULL DEFAULT '{}';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'posts_post_kind_check') THEN
    ALTER TABLE public.posts ADD CONSTRAINT posts_post_kind_check
      CHECK (post_kind IN ('update','question','video','milestone','launch'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS posts_project_created_idx ON public.posts (project_id, created_at DESC);
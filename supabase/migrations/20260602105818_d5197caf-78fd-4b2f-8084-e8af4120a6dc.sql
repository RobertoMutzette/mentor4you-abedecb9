ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS headline text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS avatar_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS industries text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS project_preferences text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS education jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS experience jsonb NOT NULL DEFAULT '[]'::jsonb;
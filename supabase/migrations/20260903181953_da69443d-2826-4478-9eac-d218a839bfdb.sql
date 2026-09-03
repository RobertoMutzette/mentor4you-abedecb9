ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'private',
  ADD COLUMN IF NOT EXISTS share_fields jsonb NOT NULL DEFAULT '{"description":true,"pitch":true,"tags":true,"progress":true,"funding":false,"milestones":false,"links":false,"team":false,"location":false}'::jsonb,
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_visibility_check CHECK (visibility IN ('private','public'));

CREATE INDEX IF NOT EXISTS projects_visibility_idx ON public.projects (visibility, published_at DESC);
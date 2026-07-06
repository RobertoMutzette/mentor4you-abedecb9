
CREATE TABLE public.project_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  due_at timestamptz,
  done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_tasks TO authenticated;
GRANT ALL ON public.project_tasks TO service_role;

ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view tasks"
ON public.project_tasks FOR SELECT TO authenticated
USING (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Members can create tasks"
ON public.project_tasks FOR INSERT TO authenticated
WITH CHECK (public.is_project_member(project_id, auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Members can update tasks"
ON public.project_tasks FOR UPDATE TO authenticated
USING (public.is_project_member(project_id, auth.uid()))
WITH CHECK (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Members can delete tasks"
ON public.project_tasks FOR DELETE TO authenticated
USING (public.is_project_member(project_id, auth.uid()));

CREATE TRIGGER project_tasks_touch
BEFORE UPDATE ON public.project_tasks
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX project_tasks_project_idx ON public.project_tasks(project_id);
CREATE INDEX project_tasks_due_idx ON public.project_tasks(due_at) WHERE done = false;

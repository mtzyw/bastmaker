-- Create table to track Freepik prompt improvement tasks.

CREATE TABLE public.ai_prompt_improvements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  original_prompt text NOT NULL,
  language text,
  target_type text NOT NULL DEFAULT 'video',
  status text NOT NULL DEFAULT 'pending',
  freepik_task_id text UNIQUE,
  freepik_status text,
  generated_prompts jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ai_prompt_improvements_user_idx
  ON public.ai_prompt_improvements (user_id);

CREATE INDEX ai_prompt_improvements_status_idx
  ON public.ai_prompt_improvements (status);

ALTER TABLE public.ai_prompt_improvements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_prompt_improvements_select_own ON public.ai_prompt_improvements;
CREATE POLICY ai_prompt_improvements_select_own
  ON public.ai_prompt_improvements
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS ai_prompt_improvements_insert_own ON public.ai_prompt_improvements;
CREATE POLICY ai_prompt_improvements_insert_own
  ON public.ai_prompt_improvements
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS ai_prompt_improvements_update_none ON public.ai_prompt_improvements;
CREATE POLICY ai_prompt_improvements_update_none
  ON public.ai_prompt_improvements
  FOR UPDATE
  USING (false);

DROP POLICY IF EXISTS ai_prompt_improvements_delete_none ON public.ai_prompt_improvements;
CREATE POLICY ai_prompt_improvements_delete_none
  ON public.ai_prompt_improvements
  FOR DELETE
  USING (false);

DROP TRIGGER IF EXISTS update_ai_prompt_improvements_updated_at ON public.ai_prompt_improvements;
CREATE TRIGGER update_ai_prompt_improvements_updated_at
  BEFORE UPDATE ON public.ai_prompt_improvements
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

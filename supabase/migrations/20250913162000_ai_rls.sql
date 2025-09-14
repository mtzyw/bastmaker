-- Enable RLS and add safe default policies for newly added AI tables.
-- Principle: deny by default, allow users to read their own jobs and job assets.

-- Enable RLS on all AI tables
ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_modalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_model_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_job_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_job_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_job_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_model_tags ENABLE ROW LEVEL SECURITY;

-- Deny all by default (no policies) for catalog tables.
-- If you want public or authenticated read later, add policies accordingly.

-- ai_jobs: allow users to read/insert their own, block update/delete by default
DROP POLICY IF EXISTS ai_jobs_select_own ON public.ai_jobs;
CREATE POLICY ai_jobs_select_own
ON public.ai_jobs FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS ai_jobs_insert_own ON public.ai_jobs;
CREATE POLICY ai_jobs_insert_own
ON public.ai_jobs FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS ai_jobs_update_none ON public.ai_jobs;
CREATE POLICY ai_jobs_update_none
ON public.ai_jobs FOR UPDATE
USING (false);

DROP POLICY IF EXISTS ai_jobs_delete_none ON public.ai_jobs;
CREATE POLICY ai_jobs_delete_none
ON public.ai_jobs FOR DELETE
USING (false);

-- ai_job_inputs: allow users to read inputs of their own jobs
DROP POLICY IF EXISTS ai_job_inputs_select_own ON public.ai_job_inputs;
CREATE POLICY ai_job_inputs_select_own
ON public.ai_job_inputs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ai_jobs j
    WHERE j.id = job_id AND j.user_id = auth.uid()
  )
);

-- Deny insert/update/delete by default (no additional policies)

-- ai_job_outputs: allow users to read outputs of their own jobs
DROP POLICY IF EXISTS ai_job_outputs_select_own ON public.ai_job_outputs;
CREATE POLICY ai_job_outputs_select_own
ON public.ai_job_outputs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ai_jobs j
    WHERE j.id = job_id AND j.user_id = auth.uid()
  )
);

-- ai_job_events: allow users to read events of their own jobs
DROP POLICY IF EXISTS ai_job_events_select_own ON public.ai_job_events;
CREATE POLICY ai_job_events_select_own
ON public.ai_job_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ai_jobs j
    WHERE j.id = job_id AND j.user_id = auth.uid()
  )
);

-- ai_model_tags: deny all by default (no policies). Add policies later if needed.


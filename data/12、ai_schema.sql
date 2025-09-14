-- AI domain schema (flexible, minimal constraints)
-- This migration creates provider/modality/model/version/job tables without strict value constraints.

-- ai_providers: third-party providers
CREATE TABLE IF NOT EXISTS public.ai_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_code text,
  name text,
  status text,
  notes text,
  metadata_json jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ai_modalities: capability types (t2i/i2i/t2v/i2v/...)
CREATE TABLE IF NOT EXISTS public.ai_modalities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modality_code text,
  name text,
  description text,
  metadata_json jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ai_models: conceptual models (non-versioned)
CREATE TABLE IF NOT EXISTS public.ai_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_slug text,
  provider_code text,
  modality_code text,
  name text,
  description text,
  tags text[] NOT NULL DEFAULT '{}',
  lang_jsonb jsonb NOT NULL DEFAULT '{}',
  display_order int NOT NULL DEFAULT 0,
  default_version_id uuid,
  metadata_json jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ai_model_versions: versioned configuration
CREATE TABLE IF NOT EXISTS public.ai_model_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid,
  version_label text,
  status text,
  visibility_scope text,
  activated_at timestamptz,
  deprecated_at timestamptz,
  hidden_at timestamptz,
  input_schema_json jsonb NOT NULL DEFAULT '{}',
  output_schema_json jsonb NOT NULL DEFAULT '{}',
  input_schema_version text,
  output_schema_version text,
  default_params_json jsonb NOT NULL DEFAULT '{}',
  limits_json jsonb NOT NULL DEFAULT '{}',
  pricing_mode text,
  base_cost_credits numeric,
  cost_formula_json jsonb NOT NULL DEFAULT '{}',
  pricing_schema_version text,
  provider_model_key text,
  provider_extra_json jsonb NOT NULL DEFAULT '{}',
  regions text[],
  compute_class text,
  safety_preset text,
  moderation_json jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ai_jobs: unified job table for all modalities
CREATE TABLE IF NOT EXISTS public.ai_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  model_id uuid,
  model_version_id uuid,
  modality_code text,
  provider_code text,
  provider_job_id text,
  status text,
  priority int,
  input_params_json jsonb NOT NULL DEFAULT '{}',
  seed text,
  usage_metrics_json jsonb NOT NULL DEFAULT '{}',
  cost_estimated_credits numeric,
  cost_actual_credits numeric,
  pricing_snapshot_json jsonb NOT NULL DEFAULT '{}',
  reconciled_at timestamptz,
  model_slug_at_submit text,
  input_schema_version_at_submit text,
  pricing_schema_version_at_submit text,
  is_public boolean NOT NULL DEFAULT false,
  visibility text,
  error_message text,
  metadata_json jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

-- ai_job_inputs: multiple inputs per job
CREATE TABLE IF NOT EXISTS public.ai_job_inputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid,
  index int,
  type text,
  source text,
  url text,
  r2_key text,
  mime_type text,
  bytes bigint,
  metadata_json jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ai_job_outputs: multiple outputs per job
CREATE TABLE IF NOT EXISTS public.ai_job_outputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid,
  index int,
  type text,
  url text,
  r2_key text,
  mime_type text,
  bytes bigint,
  width int,
  height int,
  duration numeric,
  thumb_url text,
  moderation_json jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

-- ai_job_events: job lifecycle events
CREATE TABLE IF NOT EXISTS public.ai_job_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid,
  event_type text,
  payload_json jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ai_tags / ai_model_tags (optional tagging system)
CREATE TABLE IF NOT EXISTS public.ai_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_code text,
  name text,
  description text,
  lang_jsonb jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_model_tags (
  model_id uuid,
  tag_id uuid,
  PRIMARY KEY (model_id, tag_id)
);

-- Link credit logs to jobs (soft reference)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'credit_logs' AND column_name = 'related_job_id'
  ) THEN
    ALTER TABLE public.credit_logs ADD COLUMN related_job_id uuid;
  END IF;
END $$;

-- Indexes (no strict constraints, just performance)
CREATE INDEX IF NOT EXISTS idx_ai_providers_code ON public.ai_providers(provider_code);

CREATE INDEX IF NOT EXISTS idx_ai_modalities_code ON public.ai_modalities(modality_code);

CREATE INDEX IF NOT EXISTS idx_ai_models_slug ON public.ai_models(model_slug);
CREATE INDEX IF NOT EXISTS idx_ai_models_provider_modality ON public.ai_models(provider_code, modality_code);
CREATE INDEX IF NOT EXISTS idx_ai_models_display_order ON public.ai_models(display_order);

CREATE INDEX IF NOT EXISTS idx_ai_model_versions_model_label ON public.ai_model_versions(model_id, version_label);
CREATE INDEX IF NOT EXISTS idx_ai_model_versions_status_scope ON public.ai_model_versions(status, visibility_scope);
CREATE INDEX IF NOT EXISTS idx_ai_model_versions_provider_key ON public.ai_model_versions(provider_model_key);

CREATE INDEX IF NOT EXISTS idx_ai_jobs_user_created_at ON public.ai_jobs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_status ON public.ai_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_version ON public.ai_jobs(model_version_id);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_modality ON public.ai_jobs(modality_code);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_provider_job_id ON public.ai_jobs(provider_job_id);

CREATE INDEX IF NOT EXISTS idx_ai_job_inputs_job ON public.ai_job_inputs(job_id);
CREATE INDEX IF NOT EXISTS idx_ai_job_inputs_job_index ON public.ai_job_inputs(job_id, index);

CREATE INDEX IF NOT EXISTS idx_ai_job_outputs_job ON public.ai_job_outputs(job_id);
CREATE INDEX IF NOT EXISTS idx_ai_job_outputs_job_index ON public.ai_job_outputs(job_id, index);
CREATE INDEX IF NOT EXISTS idx_ai_job_outputs_job_created ON public.ai_job_outputs(job_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_job_events_job ON public.ai_job_events(job_id);
CREATE INDEX IF NOT EXISTS idx_ai_job_events_job_created ON public.ai_job_events(job_id, created_at);

CREATE INDEX IF NOT EXISTS idx_credit_logs_related_job_id ON public.credit_logs(related_job_id);


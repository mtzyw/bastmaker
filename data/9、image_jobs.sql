CREATE TYPE public.job_status AS ENUM ('starting', 'processing', 'succeeded', 'failed', 'canceled');

CREATE TABLE public.image_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status public.job_status NOT NULL DEFAULT 'starting',

    feature_id VARCHAR(255) NOT NULL,
    provider VARCHAR(255) NOT NULL DEFAULT 'REPLICATE',
    provider_model VARCHAR(255),
    provider_job_id VARCHAR(255),

    request_params JSONB NOT NULL,
    final_seed_used BIGINT,
    temp_output_url TEXT,
    final_output_url TEXT,
    error_message TEXT,

    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.image_jobs IS 'Stores tasks related to AI image editing, linking users to their jobs.';
COMMENT ON COLUMN public.image_jobs.id IS 'Unique identifier for the edit job (job_id).';
COMMENT ON COLUMN public.image_jobs.user_id IS 'Foreign key to the user who initiated the job.';
COMMENT ON COLUMN public.image_jobs.status IS 'Current status of the job.';
COMMENT ON COLUMN public.image_jobs.feature_id IS 'Identifier for the specific AI function requested (e.g., "change_haircut").';
COMMENT ON COLUMN public.image_jobs.provider IS 'The AI service provider used (e.g., "REPLICATE").';
COMMENT ON COLUMN public.image_jobs.provider_model IS 'The specific model used from the provider.';
COMMENT ON COLUMN public.image_jobs.provider_job_id IS 'The job ID from the external AI provider for debugging.';
COMMENT ON COLUMN public.image_jobs.request_params IS 'The full JSON payload of parameters sent by the client.';
COMMENT ON COLUMN public.image_jobs.final_seed_used IS 'The seed value ultimately used by the AI model.';
COMMENT ON COLUMN public.image_jobs.temp_output_url IS 'Temporary URL for the result image from the provider webhook.';
COMMENT ON COLUMN public.image_jobs.final_output_url IS 'Permanent R2 storage URL for the final result image.';
COMMENT ON COLUMN public.image_jobs.error_message IS 'Detailed error message if the job failed.';
COMMENT ON COLUMN public.image_jobs.is_public IS 'Whether the result is displayed on a public showcase.';
COMMENT ON COLUMN public.image_jobs.created_at IS 'Timestamp of when the job was created.';
COMMENT ON COLUMN public.image_jobs.updated_at IS 'Timestamp of the last update to the job record.';


CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';


CREATE TRIGGER update_image_jobs_updated_at
BEFORE UPDATE ON public.image_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_image_jobs_user_id ON public.image_jobs(user_id);
CREATE INDEX idx_image_jobs_status ON public.image_jobs(status);
CREATE INDEX idx_image_jobs_provider_job_id ON public.image_jobs(provider_job_id);
CREATE INDEX idx_image_jobs_is_public ON public.image_jobs(is_public);

ALTER TABLE public.image_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own jobs"
ON public.image_jobs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own jobs"
ON public.image_jobs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own jobs"
ON public.image_jobs
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

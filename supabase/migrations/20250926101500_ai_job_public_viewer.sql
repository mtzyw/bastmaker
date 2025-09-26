-- =============================================
-- Migration: ai_jobs viewer + share rewards alignment
-- =============================================

-- 1. Extend ai_jobs with public viewer metadata (idempotent)
ALTER TABLE public.ai_jobs
  ADD COLUMN IF NOT EXISTS share_slug text,
  ADD COLUMN IF NOT EXISTS public_title text,
  ADD COLUMN IF NOT EXISTS public_summary text,
  ADD COLUMN IF NOT EXISTS public_assets jsonb,
  ADD COLUMN IF NOT EXISTS share_visit_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS share_conversion_count integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.ai_jobs.share_slug IS 'Public-friendly slug used for viewer pages.';
COMMENT ON COLUMN public.ai_jobs.public_title IS 'Title snapshot for the public viewer page.';
COMMENT ON COLUMN public.ai_jobs.public_summary IS 'Summary/description snapshot for the public viewer page.';
COMMENT ON COLUMN public.ai_jobs.public_assets IS 'JSON array describing public media assets (images/videos) for the viewer page.';
COMMENT ON COLUMN public.ai_jobs.share_visit_count IS 'Number of recorded share visits for this job.';
COMMENT ON COLUMN public.ai_jobs.share_conversion_count IS 'Number of successful share conversions for this job.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_jobs_share_slug
  ON public.ai_jobs (share_slug)
  WHERE share_slug IS NOT NULL;

-- 2. Public read policy for published ai_jobs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ai_jobs'
      AND policyname = 'Public can view published ai jobs'
  ) THEN
    EXECUTE '
      CREATE POLICY "Public can view published ai jobs"
      ON public.ai_jobs
      FOR SELECT
      USING (is_public = true AND share_slug IS NOT NULL)
    ';
  END IF;
END $$;

-- 3. Align job_share_conversions foreign key to ai_jobs
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'job_share_conversions_job_id_fkey'
      AND conrelid = 'public.job_share_conversions'::regclass
  ) THEN
    ALTER TABLE public.job_share_conversions
      DROP CONSTRAINT job_share_conversions_job_id_fkey;
  END IF;
END $$;

ALTER TABLE public.job_share_conversions
  ADD CONSTRAINT job_share_conversions_job_id_fkey
  FOREIGN KEY (job_id)
  REFERENCES public.ai_jobs(id)
  ON DELETE CASCADE;

-- 4. Replace legacy increment helpers with ai_job versions
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname = 'increment_image_job_share_visit'
      AND pg_function_is_visible(oid)
  ) THEN
    DROP FUNCTION public.increment_image_job_share_visit(uuid);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname = 'increment_image_job_share_conversion'
      AND pg_function_is_visible(oid)
  ) THEN
    DROP FUNCTION public.increment_image_job_share_conversion(uuid);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.increment_ai_job_share_visit(p_job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.ai_jobs
  SET share_visit_count = share_visit_count + 1
  WHERE id = p_job_id;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_ai_job_share_visit(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_ai_job_share_visit(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.increment_ai_job_share_conversion(p_job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.ai_jobs
  SET share_conversion_count = share_conversion_count + 1
  WHERE id = p_job_id;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_ai_job_share_conversion(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_ai_job_share_conversion(uuid) TO service_role;

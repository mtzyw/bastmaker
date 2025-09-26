-- =============================================
-- Migration: public viewer support & share rewards
-- =============================================

-- 1. Extend image_jobs with public viewer metadata
ALTER TABLE public.image_jobs
  ADD COLUMN IF NOT EXISTS share_slug text,
  ADD COLUMN IF NOT EXISTS public_title text,
  ADD COLUMN IF NOT EXISTS public_summary text,
  ADD COLUMN IF NOT EXISTS public_assets jsonb,
  ADD COLUMN IF NOT EXISTS share_visit_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS share_conversion_count integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.image_jobs.share_slug IS 'Public-friendly slug used for viewer pages.';
COMMENT ON COLUMN public.image_jobs.public_title IS 'Title snapshot for the public viewer page.';
COMMENT ON COLUMN public.image_jobs.public_summary IS 'Summary/description snapshot for the public viewer page.';
COMMENT ON COLUMN public.image_jobs.public_assets IS 'JSON array describing public media assets (images/videos) for the viewer page.';
COMMENT ON COLUMN public.image_jobs.share_visit_count IS 'Number of recorded share visits for this job.';
COMMENT ON COLUMN public.image_jobs.share_conversion_count IS 'Number of successful share conversions for this job.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_image_jobs_share_slug
  ON public.image_jobs (share_slug)
  WHERE share_slug IS NOT NULL;

-- 2. Public read access policy for published jobs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'image_jobs'
      AND policyname = 'Public can view published jobs'
  ) THEN
    EXECUTE '
      CREATE POLICY "Public can view published jobs"
      ON public.image_jobs
      FOR SELECT
      USING (is_public = true AND share_slug IS NOT NULL)
    ';
  END IF;
END $$;

-- 3. Share conversion tracking table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'job_share_conversion_status'
  ) THEN
    CREATE TYPE public.job_share_conversion_status AS ENUM ('pending', 'rewarded', 'dismissed');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.job_share_conversions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id uuid NOT NULL REFERENCES public.image_jobs(id) ON DELETE CASCADE,
  inviter_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  invited_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status public.job_share_conversion_status NOT NULL DEFAULT 'pending',
  reward_granted_at timestamptz,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT job_share_conversions_unique_invitee UNIQUE (job_id, invited_user_id)
);

COMMENT ON TABLE public.job_share_conversions IS 'Tracks share-driven conversions for public image jobs and invitation rewards.';
COMMENT ON COLUMN public.job_share_conversions.status IS 'Lifecycle status of the share conversion record.';
COMMENT ON COLUMN public.job_share_conversions.metadata IS 'Additional details such as share source, locale, or request context.';

CREATE INDEX IF NOT EXISTS idx_job_share_conversions_job_id
  ON public.job_share_conversions (job_id);

CREATE INDEX IF NOT EXISTS idx_job_share_conversions_invited_user_id
  ON public.job_share_conversions (invited_user_id);

CREATE INDEX IF NOT EXISTS idx_job_share_conversions_status
  ON public.job_share_conversions (status);

ALTER TABLE public.job_share_conversions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'job_share_conversions'
      AND policyname = 'Restrict share conversions to service role'
  ) THEN
    EXECUTE '
      CREATE POLICY "Restrict share conversions to service role"
      ON public.job_share_conversions
      FOR ALL
      USING (auth.role() = ''service_role'')
      WITH CHECK (auth.role() = ''service_role'')
    ';
  END IF;
END $$;

-- 4. Trigger for updated_at maintenance
CREATE OR REPLACE FUNCTION public.update_job_share_conversions_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_job_share_conversions_updated_at ON public.job_share_conversions;
CREATE TRIGGER update_job_share_conversions_updated_at
BEFORE UPDATE ON public.job_share_conversions
FOR EACH ROW
EXECUTE FUNCTION public.update_job_share_conversions_updated_at();

-- 5. Counter helper functions
CREATE OR REPLACE FUNCTION public.increment_image_job_share_visit(p_job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.image_jobs
  SET share_visit_count = share_visit_count + 1
  WHERE id = p_job_id;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_image_job_share_visit(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_image_job_share_visit(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.increment_image_job_share_conversion(p_job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.image_jobs
  SET share_conversion_count = share_conversion_count + 1
  WHERE id = p_job_id;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_image_job_share_conversion(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_image_job_share_conversion(uuid) TO service_role;

-- 6. Share reward helper
CREATE OR REPLACE FUNCTION public.grant_share_reward_and_log(
  p_user_id uuid,
  p_credits_to_add integer,
  p_related_job_id uuid,
  p_log_type text DEFAULT 'share_reward',
  p_notes text DEFAULT 'Share invitation reward'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_one_time_balance integer;
  v_new_subscription_balance integer;
BEGIN
  IF p_credits_to_add <= 0 THEN
    RETURN;
  END IF;

  INSERT INTO public.usage (user_id, one_time_credits_balance, subscription_credits_balance)
  VALUES (p_user_id, p_credits_to_add, 0)
  ON CONFLICT (user_id)
  DO UPDATE SET one_time_credits_balance = public.usage.one_time_credits_balance + p_credits_to_add
  RETURNING one_time_credits_balance, subscription_credits_balance INTO v_new_one_time_balance, v_new_subscription_balance;

  INSERT INTO public.credit_logs(
    user_id,
    amount,
    one_time_balance_after,
    subscription_balance_after,
    type,
    notes,
    related_job_id
  )
  VALUES (
    p_user_id,
    p_credits_to_add,
    v_new_one_time_balance,
    v_new_subscription_balance,
    COALESCE(p_log_type, 'share_reward'),
    COALESCE(p_notes, 'Share invitation reward'),
    p_related_job_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.grant_share_reward_and_log(uuid, integer, uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_share_reward_and_log(uuid, integer, uuid, text, text) TO service_role;

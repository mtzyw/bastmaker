-- Update the function to check for all non-terminal statuses
CREATE OR REPLACE FUNCTION check_user_concurrency_limit(p_user_id UUID, p_limit INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_active_jobs_count INTEGER;
BEGIN
  -- Count jobs that are NOT in a terminal state (succeeded, failed, canceled)
  -- This covers 'pending', 'processing', 'queued', 'starting', etc.
  SELECT COUNT(*)
  INTO v_active_jobs_count
  FROM ai_jobs
  WHERE user_id = p_user_id
    AND status NOT IN ('succeeded', 'failed', 'canceled');

  -- Return TRUE if the user is under the limit, FALSE otherwise
  IF v_active_jobs_count < p_limit THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;

-- Create a function to check if a user has reached their concurrency limit
CREATE OR REPLACE FUNCTION check_user_concurrency_limit(p_user_id UUID, p_limit INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_active_jobs_count INTEGER;
BEGIN
  -- Count jobs that are in 'pending' or 'processing' status
  SELECT COUNT(*)
  INTO v_active_jobs_count
  FROM ai_jobs
  WHERE user_id = p_user_id
    AND status IN ('pending', 'processing');

  -- Return TRUE if the user is under the limit, FALSE otherwise
  IF v_active_jobs_count < p_limit THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;

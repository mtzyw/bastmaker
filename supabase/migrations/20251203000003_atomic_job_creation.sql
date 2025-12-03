-- Function to atomically check concurrency limit and insert a new job
CREATE OR REPLACE FUNCTION create_ai_job_secure(
  p_user_id UUID,
  p_limit INTEGER,
  p_provider_code TEXT,
  p_modality_code TEXT,
  p_model_slug TEXT,
  p_input_params JSONB,
  p_metadata JSONB,
  p_cost_estimated NUMERIC,
  p_pricing_snapshot JSONB,
  p_is_public BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_active_count INTEGER;
  v_result JSONB;
BEGIN
  -- Acquire advisory lock for this user to serialize checks
  -- Using hashtext to convert UUID to integer for the lock key
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));

  -- Check current active jobs
  SELECT COUNT(*)
  INTO v_active_count
  FROM ai_jobs
  WHERE user_id = p_user_id
    AND status NOT IN (
      'succeeded', 
      'failed', 
      'canceled', 
      'completed', 
      'cancelled_insufficient_credits'
    );

  IF v_active_count >= p_limit THEN
    -- Raise a specific exception that can be caught by the client
    RAISE EXCEPTION 'CONCURRENCY_LIMIT_EXCEEDED';
  END IF;

  -- Insert the job
  INSERT INTO ai_jobs (
    user_id,
    provider_code,
    modality_code,
    model_slug_at_submit,
    status,
    input_params_json,
    metadata_json,
    cost_estimated_credits,
    pricing_snapshot_json,
    is_public
  ) VALUES (
    p_user_id,
    p_provider_code,
    p_modality_code,
    p_model_slug,
    'pending',
    p_input_params,
    p_metadata,
    p_cost_estimated,
    p_pricing_snapshot,
    p_is_public
  )
  RETURNING to_jsonb(ai_jobs.*) INTO v_result;

  RETURN v_result;
END;
$$;

-- Add last_daily_credit_at column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_daily_credit_at TIMESTAMPTZ;

-- Create RPC function to grant daily free credits
CREATE OR REPLACE FUNCTION grant_daily_free_credits(p_user_id UUID, p_daily_amount INTEGER DEFAULT 10)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subscription_status TEXT;
  v_current_total_credits INTEGER;
  v_one_time_credits INTEGER;
  v_subscription_credits INTEGER;
  v_last_credit_at TIMESTAMPTZ;
  v_credits_to_add INTEGER;
BEGIN
  -- 1. Check if user exists and get current credit info
  SELECT 
    u.last_daily_credit_at,
    COALESCE(us.subscription_credits_balance, 0),
    COALESCE(us.one_time_credits_balance, 0)
  INTO 
    v_last_credit_at,
    v_subscription_credits,
    v_one_time_credits
  FROM users u
  LEFT JOIN usage us ON u.id = us.user_id
  WHERE u.id = p_user_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  v_current_total_credits := v_subscription_credits + v_one_time_credits;

  -- 2. Check if user has an active subscription
  -- We consider 'active' and 'trialing' as active subscriptions that shouldn't get "free" daily credits
  -- (unless we want to give daily credits to subscribers too, but the requirement implies "free users")
  SELECT status INTO v_subscription_status
  FROM subscriptions
  WHERE user_id = p_user_id
    AND status IN ('active', 'trialing')
  LIMIT 1;

  -- If user has an active subscription, do nothing
  IF v_subscription_status IS NOT NULL THEN
    RETURN FALSE;
  END IF;

  -- 3. Check if already granted today (UTC)
  IF v_last_credit_at IS NOT NULL AND DATE(v_last_credit_at AT TIME ZONE 'UTC') = DATE(NOW() AT TIME ZONE 'UTC') THEN
    RETURN FALSE;
  END IF;

  -- 4. Check if current credits are below the daily amount
  IF v_current_total_credits >= p_daily_amount THEN
    -- Even if we haven't granted today, if they have enough credits, we don't top up (Reset Mode)
    -- But we SHOULD update the timestamp so we don't check again unnecessarily? 
    -- Actually, for "Reset Mode", if they have > 10, we just leave it. 
    -- If they spend it down to 5 later today, should we top it up then? 
    -- Usually "Daily" implies once per day. 
    -- So if they start with 20, spend 15 (left 5), we probably shouldn't top up until tomorrow.
    -- However, the simplest logic for "Reset to 10 daily" is: 
    -- "If it's a new day, and you have < 10, bump to 10."
    RETURN FALSE;
  END IF;

  -- 5. Calculate how much to add to reach p_daily_amount
  -- We add to subscription_credits_balance
  v_credits_to_add := p_daily_amount - v_current_total_credits;

  IF v_credits_to_add <= 0 THEN
    RETURN FALSE;
  END IF;

  -- 6. Update usage and users table
  UPDATE usage
  SET subscription_credits_balance = subscription_credits_balance + v_credits_to_add,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  UPDATE users
  SET last_daily_credit_at = NOW()
  WHERE id = p_user_id;

  -- 7. Log the transaction
  INSERT INTO credit_logs (
    user_id,
    amount,
    type,
    notes,
    subscription_balance_after,
    one_time_balance_after
  ) VALUES (
    p_user_id,
    v_credits_to_add,
    'daily_free_grant',
    'Daily free credits reset to ' || p_daily_amount,
    v_subscription_credits + v_credits_to_add,
    v_one_time_credits
  );

  RETURN TRUE;
END;
$$;

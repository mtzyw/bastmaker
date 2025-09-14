-- Create the table to store credit transaction logs
CREATE TABLE public.credit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id),
    amount INT NOT NULL, -- The amount of credits changed. Positive for addition, negative for deduction.
    one_time_balance_after INT NOT NULL, -- The user's one-time credit balance after this transaction.
    subscription_balance_after INT NOT NULL, -- The user's subscription credit balance after this transaction.
    type TEXT NOT NULL, -- The type of transaction, e.g., 'feature_usage', 'one_time_purchase', 'subscription_grant', 'refund_revoke'.
    notes TEXT, -- Additional details about the transaction, e.g., "Used AI summary feature".
    related_order_id uuid REFERENCES public.orders(id), -- Optional foreign key to the orders table.
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN public.credit_logs.amount IS 'The amount of credits changed. Positive for additions, negative for deductions.';
COMMENT ON COLUMN public.credit_logs.one_time_balance_after IS 'The user''s one-time credit balance after this transaction.';
COMMENT ON COLUMN public.credit_logs.subscription_balance_after IS 'The user''s subscription credit balance after this transaction.';
COMMENT ON COLUMN public.credit_logs.type IS 'Type of transaction (e.g., ''feature_usage'', ''one_time_purchase'').';
COMMENT ON COLUMN public.credit_logs.notes IS 'Additional details or notes about the transaction.';
COMMENT ON COLUMN public.credit_logs.related_order_id IS 'Optional foreign key to the `orders` table, linking the log to a purchase or refund.';

CREATE INDEX idx_credit_logs_user_id ON public.credit_logs(user_id);

ALTER TABLE public.credit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow user to read their own credit logs"
ON public.credit_logs
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Disallow user to modify credit logs"
ON public.credit_logs
FOR ALL USING (false) WITH CHECK (false);


--------------------------------------------------------------------------------
-- create RPCs
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.deduct_credits_and_log(
    p_user_id uuid,
    p_deduct_amount integer,
    p_notes text
)
RETURNS boolean AS $$
DECLARE
    v_current_one_time_credits integer;
    v_current_subscription_credits integer;
    v_total_credits integer;
    v_deducted_from_subscription integer;
    v_deducted_from_one_time integer;
    v_new_one_time_balance integer;
    v_new_subscription_balance integer;
BEGIN
    SELECT one_time_credits_balance, subscription_credits_balance
    INTO v_current_one_time_credits, v_current_subscription_credits
    FROM public.usage
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    v_total_credits := v_current_one_time_credits + v_current_subscription_credits;

    IF v_total_credits < p_deduct_amount THEN
        RETURN false;
    END IF;

    v_deducted_from_subscription := LEAST(v_current_subscription_credits, p_deduct_amount);
    v_deducted_from_one_time := p_deduct_amount - v_deducted_from_subscription;

    v_new_subscription_balance := v_current_subscription_credits - v_deducted_from_subscription;
    v_new_one_time_balance := v_current_one_time_credits - v_deducted_from_one_time;

    UPDATE public.usage
    SET
        subscription_credits_balance = v_new_subscription_balance,
        one_time_credits_balance = v_new_one_time_balance
    WHERE user_id = p_user_id;

    INSERT INTO public.credit_logs(user_id, amount, one_time_balance_after, subscription_balance_after, type, notes)
    VALUES (p_user_id, -p_deduct_amount, v_new_one_time_balance, v_new_subscription_balance, 'feature_usage', p_notes);

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION public.grant_one_time_credits_and_log(
    p_user_id uuid,
    p_credits_to_add integer,
    p_related_order_id uuid DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    v_new_one_time_balance integer;
    v_new_subscription_balance integer;
BEGIN
    INSERT INTO public.usage (user_id, one_time_credits_balance, subscription_credits_balance)
    VALUES (p_user_id, p_credits_to_add, 0)
    ON CONFLICT (user_id)
    DO UPDATE SET one_time_credits_balance = usage.one_time_credits_balance + p_credits_to_add
    RETURNING one_time_credits_balance, subscription_credits_balance INTO v_new_one_time_balance, v_new_subscription_balance;

    INSERT INTO public.credit_logs(user_id, amount, one_time_balance_after, subscription_balance_after, type, notes, related_order_id)
    VALUES (p_user_id, p_credits_to_add, v_new_one_time_balance, v_new_subscription_balance, 'one_time_purchase', 'One-time credit purchase', p_related_order_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION public.grant_subscription_credits_and_log(
    p_user_id uuid,
    p_credits_to_set integer,
    p_related_order_id uuid DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    v_new_one_time_balance integer;
    v_new_subscription_balance integer;
BEGIN
    INSERT INTO public.usage (user_id, one_time_credits_balance, subscription_credits_balance)
    VALUES (p_user_id, 0, p_credits_to_set)
    ON CONFLICT (user_id)
    DO UPDATE SET subscription_credits_balance = p_credits_to_set
    RETURNING one_time_credits_balance, subscription_credits_balance INTO v_new_one_time_balance, v_new_subscription_balance;

    INSERT INTO public.credit_logs(user_id, amount, one_time_balance_after, subscription_balance_after, type, notes, related_order_id)
    VALUES (p_user_id, p_credits_to_set, v_new_one_time_balance, v_new_subscription_balance, 'subscription_grant', 'Subscription credits granted/reset', p_related_order_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION public.revoke_credits_and_log(
    p_user_id uuid,
    p_revoke_one_time integer,
    p_revoke_subscription integer,
    p_log_type text,
    p_notes text,
    p_related_order_id uuid DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    v_new_one_time_balance integer;
    v_new_subscription_balance integer;
    v_total_revoked integer;
BEGIN
    v_total_revoked := p_revoke_one_time + p_revoke_subscription;
    IF v_total_revoked <= 0 THEN
        RETURN;
    END IF;

    UPDATE public.usage
    SET
        one_time_credits_balance = usage.one_time_credits_balance - p_revoke_one_time,
        subscription_credits_balance = usage.subscription_credits_balance - p_revoke_subscription
    WHERE user_id = p_user_id
    RETURNING one_time_credits_balance, subscription_credits_balance INTO v_new_one_time_balance, v_new_subscription_balance;

    IF FOUND THEN
        INSERT INTO public.credit_logs(user_id, amount, one_time_balance_after, subscription_balance_after, type, notes, related_order_id)
        VALUES (p_user_id, -v_total_revoked, v_new_one_time_balance, v_new_subscription_balance, p_log_type, p_notes, p_related_order_id);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to grant welcome credits for new users
CREATE OR REPLACE FUNCTION public.grant_welcome_credits_and_log(
    p_user_id uuid,
    p_welcome_credits integer DEFAULT 30
)
RETURNS boolean AS $$
DECLARE
    v_existing_usage_count integer;
    v_new_one_time_balance integer;
    v_new_subscription_balance integer;
BEGIN
    SELECT COUNT(*)
    INTO v_existing_usage_count
    FROM public.usage
    WHERE user_id = p_user_id;

    IF v_existing_usage_count > 0 THEN
        RETURN false;
    END IF;

    INSERT INTO public.usage (user_id, one_time_credits_balance, subscription_credits_balance)
    VALUES (p_user_id, p_welcome_credits, 0)
    RETURNING one_time_credits_balance, subscription_credits_balance 
    INTO v_new_one_time_balance, v_new_subscription_balance;

    INSERT INTO public.credit_logs(user_id, amount, one_time_balance_after, subscription_balance_after, type, notes)
    VALUES (p_user_id, p_welcome_credits, v_new_one_time_balance, v_new_subscription_balance, 'welcome_bonus', 'Welcome bonus for new user');

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


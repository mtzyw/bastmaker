

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."job_status" AS ENUM (
    'starting',
    'processing',
    'succeeded',
    'failed',
    'canceled'
);


ALTER TYPE "public"."job_status" OWNER TO "postgres";


CREATE TYPE "public"."post_status" AS ENUM (
    'draft',
    'published',
    'archived'
);


ALTER TYPE "public"."post_status" OWNER TO "postgres";


CREATE TYPE "public"."post_visibility" AS ENUM (
    'public',
    'logged_in',
    'subscribers'
);


ALTER TYPE "public"."post_visibility" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."allocate_specific_monthly_credit_for_year_plan"("p_user_id" "uuid", "p_monthly_credits" integer, "p_current_yyyy_mm" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_usage_record RECORD;
    v_yearly_details jsonb;
    v_new_yearly_details jsonb;
BEGIN
    SELECT * INTO v_usage_record FROM public.usage WHERE user_id = p_user_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE WARNING 'User usage record not found for user_id: %', p_user_id;
        RETURN;
    END IF;

    v_yearly_details := v_usage_record.balance_jsonb->'yearly_allocation_details';

    IF v_yearly_details IS NULL THEN
        RAISE WARNING 'Yearly allocation details not found for user_id: %', p_user_id;
        RETURN;
    END IF;

    IF (v_yearly_details->>'remaining_months')::integer > 0 AND
        NOW() >= (v_yearly_details->>'next_credit_date')::timestamptz AND
        v_yearly_details->>'last_allocated_month' <> p_current_yyyy_mm THEN

        v_new_yearly_details := jsonb_set(
            jsonb_set(
                jsonb_set(
                    v_yearly_details,
                    '{remaining_months}',
                    to_jsonb((v_yearly_details->>'remaining_months')::integer - 1)
                ),
                '{next_credit_date}',
                to_jsonb((v_yearly_details->>'next_credit_date')::timestamptz + INTERVAL '1 month')
            ),
            '{last_allocated_month}',
            to_jsonb(p_current_yyyy_mm)
        );

        UPDATE public.usage
        SET
            subscription_credits_balance = p_monthly_credits,
            balance_jsonb = jsonb_set(usage.balance_jsonb, '{yearly_allocation_details}', v_new_yearly_details)
        WHERE user_id = p_user_id;

    ELSE
      RAISE LOG 'Skipping credit allocation for user % for month % (remaining: %, next_date: %, last_allocated: %)', 
                  p_user_id, p_current_yyyy_mm, v_yearly_details->>'remaining_months', v_yearly_details->>'next_credit_date', v_yearly_details->>'last_allocated_month';
    END IF;
END;
$$;


ALTER FUNCTION "public"."allocate_specific_monthly_credit_for_year_plan"("p_user_id" "uuid", "p_monthly_credits" integer, "p_current_yyyy_mm" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."deduct_credits_and_log"("p_user_id" "uuid", "p_deduct_amount" integer, "p_notes" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."deduct_credits_and_log"("p_user_id" "uuid", "p_deduct_amount" integer, "p_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."deduct_credits_priority_one_time"("p_user_id" "uuid", "p_amount_to_deduct" integer) RETURNS TABLE("success" boolean, "message" "text", "new_one_time_credits_balance" integer, "new_subscription_credits_balance" integer, "new_total_available_credits" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  current_one_time INTEGER;
  current_subscription INTEGER;
  total_available INTEGER;
  deducted_from_one_time INTEGER := 0;
  deducted_from_sub INTEGER := 0;
  remaining_deduction INTEGER := p_amount_to_deduct;
BEGIN
  SELECT COALESCE(one_time_credits_balance, 0), COALESCE(subscription_credits_balance, 0)
  INTO current_one_time, current_subscription
  FROM public.usage WHERE user_id = p_user_id;

  IF NOT FOUND THEN 
    RETURN QUERY SELECT FALSE, 'User has no credit balance.', 0, 0, 0; 
    RETURN; 
  END IF;
  total_available := current_one_time + current_subscription;
  IF total_available < p_amount_to_deduct THEN 
    RETURN QUERY SELECT FALSE, 'Insufficient credits. Required: ' || p_amount_to_deduct || ', Available: ' || total_available, current_one_time, current_subscription, total_available; 
    RETURN; 
  END IF;

  IF current_one_time >= remaining_deduction THEN
    deducted_from_one_time := remaining_deduction;
    current_one_time := current_one_time - remaining_deduction;
    remaining_deduction := 0;
  ELSE
    deducted_from_one_time := current_one_time;
    remaining_deduction := remaining_deduction - current_one_time;
    current_one_time := 0;
  END IF;

  IF remaining_deduction > 0 AND current_subscription >= remaining_deduction THEN
    deducted_from_sub := remaining_deduction;
    current_subscription := current_subscription - remaining_deduction;
    remaining_deduction := 0;
  ELSIF remaining_deduction > 0 THEN
    deducted_from_sub := current_subscription;
    current_subscription := 0;
    remaining_deduction := remaining_deduction - deducted_from_sub;
  END IF;

  IF remaining_deduction > 0 THEN
    RAISE WARNING 'Deduct credits (priority one-time) calculation error for user %: amount %, remaining %', p_user_id, p_amount_to_deduct, remaining_deduction;
    SELECT COALESCE(u.one_time_credits_balance, 0), COALESCE(u.subscription_credits_balance, 0) INTO current_one_time, current_subscription FROM public.usage u WHERE u.user_id = p_user_id;
    RETURN QUERY SELECT FALSE, 'Credit deduction calculation error.', current_one_time, current_subscription, current_one_time + current_subscription;
    RETURN;
  END IF;

  UPDATE public.usage SET one_time_credits_balance = current_one_time, subscription_credits_balance = current_subscription, updated_at = NOW() WHERE user_id = p_user_id;
  RETURN QUERY SELECT TRUE, 'Credits deducted. From One-Time: ' || deducted_from_one_time || '. From Subscription: ' || deducted_from_sub, current_one_time, current_subscription, current_one_time + current_subscription;
EXCEPTION WHEN OTHERS THEN 
  RAISE WARNING 'Error: %', SQLERRM; 
  RETURN QUERY SELECT 
    FALSE, 
    'Error: ' || SQLERRM, 
    COALESCE((SELECT u.one_time_credits_balance FROM public.usage u WHERE u.user_id = p_user_id LIMIT 1),0), 
    COALESCE((SELECT u.subscription_credits_balance FROM public.usage u WHERE u.user_id = p_user_id LIMIT 1),0), 
    COALESCE((SELECT u.one_time_credits_balance + u.subscription_credits_balance FROM public.usage u WHERE u.user_id = p_user_id LIMIT 1),0);
END;
$$;


ALTER FUNCTION "public"."deduct_credits_priority_one_time"("p_user_id" "uuid", "p_amount_to_deduct" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."deduct_credits_priority_subscription"("p_user_id" "uuid", "p_amount_to_deduct" integer) RETURNS TABLE("success" boolean, "message" "text", "new_one_time_credits_balance" integer, "new_subscription_credits_balance" integer, "new_total_available_credits" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  current_one_time INTEGER;
  current_subscription INTEGER;
  total_available INTEGER;
  deducted_from_sub INTEGER := 0;
  deducted_from_one_time INTEGER := 0;
  remaining_deduction INTEGER := p_amount_to_deduct;
BEGIN
  SELECT COALESCE(one_time_credits_balance, 0), COALESCE(subscription_credits_balance, 0)
  INTO current_one_time, current_subscription
  FROM public.usage WHERE user_id = p_user_id;

  IF NOT FOUND THEN 
    RETURN QUERY SELECT FALSE, 'User has no credit balance.', 0, 0, 0; 
    RETURN; 
  END IF;
  total_available := current_one_time + current_subscription;
  IF total_available < p_amount_to_deduct THEN 
    RETURN QUERY SELECT FALSE, 'Insufficient credits. Required: ' || p_amount_to_deduct || ', Available: ' || total_available, current_one_time, current_subscription, total_available; 
    RETURN; 
  END IF;

  IF current_subscription >= remaining_deduction THEN
    deducted_from_sub := remaining_deduction;
    current_subscription := current_subscription - remaining_deduction;
    remaining_deduction := 0;
  ELSE
    deducted_from_sub := current_subscription;
    remaining_deduction := remaining_deduction - current_subscription;
    current_subscription := 0;
  END IF;

  IF remaining_deduction > 0 AND current_one_time >= remaining_deduction THEN
    deducted_from_one_time := remaining_deduction;
    current_one_time := current_one_time - remaining_deduction;
    remaining_deduction := 0;
  ELSIF remaining_deduction > 0 THEN
    deducted_from_one_time := current_one_time;
    current_one_time := 0;
    remaining_deduction := remaining_deduction - deducted_from_one_time; 
  END IF;
  
  IF remaining_deduction > 0 THEN
    RAISE WARNING 'Deduct credits (priority sub) calculation error for user %: amount %, remaining %', p_user_id, p_amount_to_deduct, remaining_deduction;
    SELECT COALESCE(u.one_time_credits_balance, 0), COALESCE(u.subscription_credits_balance, 0) INTO current_one_time, current_subscription FROM public.usage u WHERE u.user_id = p_user_id;
    RETURN QUERY SELECT FALSE, 'Credit deduction calculation error.', current_one_time, current_subscription, current_one_time + current_subscription;
    RETURN;
  END IF;

  UPDATE public.usage SET one_time_credits_balance = current_one_time, subscription_credits_balance = current_subscription, updated_at = NOW() WHERE user_id = p_user_id;
  RETURN QUERY SELECT TRUE, 'Credits deducted. From Subscription: ' || deducted_from_sub || '. From One-Time: ' || deducted_from_one_time, current_one_time, current_subscription, current_one_time + current_subscription;
EXCEPTION WHEN OTHERS THEN 
  RAISE WARNING 'Error: %', SQLERRM; 
  RETURN QUERY SELECT 
    FALSE, 
    'Error: ' || SQLERRM, 
    COALESCE((SELECT u.one_time_credits_balance FROM public.usage u WHERE u.user_id = p_user_id LIMIT 1),0), 
    COALESCE((SELECT u.subscription_credits_balance FROM public.usage u WHERE u.user_id = p_user_id LIMIT 1),0), 
    COALESCE((SELECT u.one_time_credits_balance + u.subscription_credits_balance FROM public.usage u WHERE u.user_id = p_user_id LIMIT 1),0);
END;
$$;


ALTER FUNCTION "public"."deduct_credits_priority_subscription"("p_user_id" "uuid", "p_amount_to_deduct" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."deduct_one_time_credits"("p_user_id" "uuid", "p_amount_to_deduct" integer) RETURNS TABLE("success" boolean, "message" "text", "new_one_time_credits_balance" integer, "new_subscription_credits_balance" integer, "new_total_available_credits" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  current_one_time INTEGER;
  current_subscription INTEGER;
BEGIN
  SELECT COALESCE(one_time_credits_balance, 0), COALESCE(subscription_credits_balance, 0)
  INTO current_one_time, current_subscription
  FROM public.usage WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'User has no credit balance.', 0, 0, 0;
    RETURN;
  END IF;

  IF current_one_time < p_amount_to_deduct THEN
    RETURN QUERY SELECT FALSE, 'Insufficient one-time credits. Required: ' || p_amount_to_deduct || ', Available: ' || current_one_time, current_one_time, current_subscription, current_one_time + current_subscription;
    RETURN;
  END IF;

  UPDATE public.usage
  SET one_time_credits_balance = current_one_time - p_amount_to_deduct, updated_at = NOW()
  WHERE user_id = p_user_id;

  current_one_time := current_one_time - p_amount_to_deduct;
  RETURN QUERY SELECT TRUE, 'Deducted ' || p_amount_to_deduct || ' from one-time credits.', current_one_time, current_subscription, current_one_time + current_subscription;
EXCEPTION WHEN OTHERS THEN 
  RAISE WARNING 'Error: %', SQLERRM;
  RETURN QUERY SELECT 
    FALSE, 
    'Error: ' || SQLERRM, 
    COALESCE((SELECT u.one_time_credits_balance FROM public.usage u WHERE u.user_id = p_user_id LIMIT 1),0), 
    COALESCE((SELECT u.subscription_credits_balance FROM public.usage u WHERE u.user_id = p_user_id LIMIT 1),0), 
    COALESCE((SELECT u.one_time_credits_balance + u.subscription_credits_balance FROM public.usage u WHERE u.user_id = p_user_id LIMIT 1),0);
END;
$$;


ALTER FUNCTION "public"."deduct_one_time_credits"("p_user_id" "uuid", "p_amount_to_deduct" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."deduct_subscription_credits"("p_user_id" "uuid", "p_amount_to_deduct" integer) RETURNS TABLE("success" boolean, "message" "text", "new_one_time_credits_balance" integer, "new_subscription_credits_balance" integer, "new_total_available_credits" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  current_one_time INTEGER;
  current_subscription INTEGER;
BEGIN
  SELECT COALESCE(one_time_credits_balance, 0), COALESCE(subscription_credits_balance, 0)
  INTO current_one_time, current_subscription
  FROM public.usage WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'User has no credit balance.', 0, 0, 0;
    RETURN;
  END IF;

  IF current_subscription < p_amount_to_deduct THEN
    RETURN QUERY SELECT FALSE, 'Insufficient subscription credits. Required: ' || p_amount_to_deduct || ', Available: ' || current_subscription, current_one_time, current_subscription, current_one_time + current_subscription;
    RETURN;
  END IF;

  UPDATE public.usage
  SET subscription_credits_balance = current_subscription - p_amount_to_deduct, updated_at = NOW()
  WHERE user_id = p_user_id;

  current_subscription := current_subscription - p_amount_to_deduct;
  RETURN QUERY SELECT TRUE, 'Deducted ' || p_amount_to_deduct || ' from subscription credits.', current_one_time, current_subscription, current_one_time + current_subscription;
EXCEPTION WHEN OTHERS THEN 
  RAISE WARNING 'Error: %', SQLERRM; 
  RETURN QUERY SELECT 
    FALSE, 
    'Error: ' || SQLERRM, 
    COALESCE((SELECT u.one_time_credits_balance FROM public.usage u WHERE u.user_id = p_user_id LIMIT 1),0), 
    COALESCE((SELECT u.subscription_credits_balance FROM public.usage u WHERE u.user_id = p_user_id LIMIT 1),0), 
    COALESCE((SELECT u.one_time_credits_balance + u.subscription_credits_balance FROM public.usage u WHERE u.user_id = p_user_id LIMIT 1),0);
END;
$$;


ALTER FUNCTION "public"."deduct_subscription_credits"("p_user_id" "uuid", "p_amount_to_deduct" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."grant_one_time_credits_and_log"("p_user_id" "uuid", "p_credits_to_add" integer, "p_related_order_id" "uuid" DEFAULT NULL::"uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."grant_one_time_credits_and_log"("p_user_id" "uuid", "p_credits_to_add" integer, "p_related_order_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."grant_subscription_credits_and_log"("p_user_id" "uuid", "p_credits_to_set" integer, "p_related_order_id" "uuid" DEFAULT NULL::"uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_new_one_time_balance integer;
    v_new_subscription_balance integer;
    v_monthly_details jsonb;
BEGIN
    v_monthly_details := jsonb_build_object(
        'monthly_allocation_details', jsonb_build_object(
            'current_month_credits', p_credits_to_set
        )
    );
    INSERT INTO public.usage (user_id, one_time_credits_balance, subscription_credits_balance, balance_jsonb)
    VALUES (p_user_id, 0, p_credits_to_set, v_monthly_details)
    ON CONFLICT (user_id)
    DO UPDATE SET 
        subscription_credits_balance = p_credits_to_set,
        balance_jsonb = COALESCE(public.usage.balance_jsonb, '{}'::jsonb) - 'monthly_allocation_details' || v_monthly_details
    RETURNING one_time_credits_balance, subscription_credits_balance INTO v_new_one_time_balance, v_new_subscription_balance;

    INSERT INTO public.credit_logs(user_id, amount, one_time_balance_after, subscription_balance_after, type, notes, related_order_id)
    VALUES (p_user_id, p_credits_to_set, v_new_one_time_balance, v_new_subscription_balance, 'subscription_grant', 'Subscription credits granted/reset', p_related_order_id);
END;
$$;


ALTER FUNCTION "public"."grant_subscription_credits_and_log"("p_user_id" "uuid", "p_credits_to_set" integer, "p_related_order_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."grant_welcome_credits_and_log"("p_user_id" "uuid", "p_welcome_credits" integer DEFAULT 30) RETURNS TABLE("one_time_credits_balance" integer, "subscription_credits_balance" integer, "balance_jsonb" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_new_one_time_balance integer;
    v_new_subscription_balance integer;
    v_balance_jsonb jsonb;
BEGIN
    INSERT INTO public.usage (user_id, one_time_credits_balance, subscription_credits_balance)
    VALUES (p_user_id, p_welcome_credits, 0)
    ON CONFLICT (user_id) DO NOTHING
    RETURNING usage.one_time_credits_balance, usage.subscription_credits_balance, usage.balance_jsonb
    INTO v_new_one_time_balance, v_new_subscription_balance, v_balance_jsonb;

    IF FOUND THEN
        INSERT INTO public.credit_logs(user_id, amount, one_time_balance_after, subscription_balance_after, type, notes)
        VALUES (p_user_id, p_welcome_credits, v_new_one_time_balance, v_new_subscription_balance, 'welcome_bonus', 'Welcome bonus for new user');

        RETURN QUERY SELECT v_new_one_time_balance, v_new_subscription_balance, v_balance_jsonb;
    ELSE
        RETURN QUERY
            SELECT
                u.one_time_credits_balance,
                u.subscription_credits_balance,
                u.balance_jsonb
            FROM public.usage u
            WHERE u.user_id = p_user_id;
    END IF;
END;
$$;


ALTER FUNCTION "public"."grant_welcome_credits_and_log"("p_user_id" "uuid", "p_welcome_credits" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  -- Insert a new row into public.users
  -- Copies the id and email from the newly created auth.users record
  -- Sets the initial updated_at timestamp
  insert into public.users (id, email, updated_at)
  values (new.id, new.email, now());
  return new; -- The result is ignored on AFTER triggers, but it's good practice
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_published_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
        NEW.published_at = now();
    ELSIF NEW.status != 'published' THEN
        NEW.published_at = NULL;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_published_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."initialize_or_reset_yearly_allocation"("p_user_id" "uuid", "p_total_months" integer, "p_monthly_credits" integer, "p_subscription_start_date" timestamp with time zone) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_yearly_details jsonb;
BEGIN
    v_yearly_details := jsonb_build_object(
        'yearly_allocation_details', jsonb_build_object(
            'remaining_months', p_total_months - 1,
            'next_credit_date', p_subscription_start_date + INTERVAL '1 month',
            'monthly_credits', p_monthly_credits,
            'last_allocated_month', to_char(p_subscription_start_date, 'YYYY-MM')
        )
    );

    INSERT INTO public.usage (user_id, subscription_credits_balance, balance_jsonb)
    VALUES (p_user_id, p_monthly_credits, v_yearly_details)
    ON CONFLICT (user_id)
    DO UPDATE SET
        subscription_credits_balance = p_monthly_credits,
        balance_jsonb = COALESCE(public.usage.balance_jsonb, '{}'::jsonb) - 'yearly_allocation_details' || v_yearly_details;
END;
$$;


ALTER FUNCTION "public"."initialize_or_reset_yearly_allocation"("p_user_id" "uuid", "p_total_months" integer, "p_monthly_credits" integer, "p_subscription_start_date" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."initialize_or_reset_yearly_allocation"("p_user_id" "uuid", "p_total_months" integer, "p_monthly_credits" integer, "p_subscription_start_date" timestamp with time zone, "p_related_order_id" "uuid" DEFAULT NULL::"uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_yearly_details jsonb;
    v_new_one_time_balance integer;
    v_new_subscription_balance integer;
BEGIN
    v_yearly_details := jsonb_build_object(
        'yearly_allocation_details', jsonb_build_object(
            'remaining_months', p_total_months - 1,
            'next_credit_date', p_subscription_start_date + INTERVAL '1 month',
            'monthly_credits', p_monthly_credits,
            'last_allocated_month', to_char(p_subscription_start_date, 'YYYY-MM')
        )
    );

    INSERT INTO public.usage (user_id, subscription_credits_balance, balance_jsonb)
    VALUES (p_user_id, p_monthly_credits, v_yearly_details)
    ON CONFLICT (user_id)
    DO UPDATE SET
        subscription_credits_balance = p_monthly_credits,
        balance_jsonb = COALESCE(public.usage.balance_jsonb, '{}'::jsonb) - 'yearly_allocation_details' || v_yearly_details
    RETURNING one_time_credits_balance, subscription_credits_balance INTO v_new_one_time_balance, v_new_subscription_balance;

    INSERT INTO public.credit_logs(user_id, amount, one_time_balance_after, subscription_balance_after, type, notes, related_order_id)
    VALUES (p_user_id, p_monthly_credits, v_new_one_time_balance, v_new_subscription_balance, 'subscription_grant', 'Yearly plan initial credits granted', p_related_order_id);
END;
$$;


ALTER FUNCTION "public"."initialize_or_reset_yearly_allocation"("p_user_id" "uuid", "p_total_months" integer, "p_monthly_credits" integer, "p_subscription_start_date" timestamp with time zone, "p_related_order_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."revoke_credits"("p_user_id" "uuid", "p_revoke_one_time" integer, "p_revoke_subscription" integer, "p_clear_yearly_details" boolean DEFAULT false, "p_clear_monthly_details" boolean DEFAULT false) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_current_one_time_bal integer;
  v_current_sub_bal integer;
  v_new_one_time_bal integer;
  v_new_sub_bal integer;
  v_current_balance_jsonb jsonb;
  v_new_balance_jsonb jsonb;
BEGIN
  IF p_revoke_one_time < 0 OR p_revoke_subscription < 0 THEN
      RAISE WARNING 'Revoke amounts cannot be negative. User: %, One-Time: %, Subscription: %', p_user_id, p_revoke_one_time, p_revoke_subscription;
      RETURN false;
  END IF;

  SELECT
      one_time_credits_balance,
      subscription_credits_balance,
      balance_jsonb
  INTO
      v_current_one_time_bal,
      v_current_sub_bal,
      v_current_balance_jsonb
  FROM public.usage
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
      IF p_clear_yearly_details OR p_clear_monthly_details THEN
          RETURN true;
      END IF;
      RETURN true;
  END IF;

  v_new_one_time_bal := GREATEST(0, v_current_one_time_bal - p_revoke_one_time);
  v_new_sub_bal := GREATEST(0, v_current_sub_bal - p_revoke_subscription);

  v_new_balance_jsonb := COALESCE(v_current_balance_jsonb, '{}'::jsonb);
  
  IF p_clear_yearly_details THEN
      v_new_balance_jsonb := v_new_balance_jsonb - 'yearly_allocation_details';
  END IF;
  
  IF p_clear_monthly_details THEN
      v_new_balance_jsonb := v_new_balance_jsonb - 'monthly_allocation_details';
  END IF;

  IF v_new_one_time_bal <> v_current_one_time_bal OR 
      v_new_sub_bal <> v_current_sub_bal OR 
      v_new_balance_jsonb <> v_current_balance_jsonb THEN
      
      UPDATE public.usage
      SET
          one_time_credits_balance = v_new_one_time_bal,
          subscription_credits_balance = v_new_sub_bal,
          balance_jsonb = v_new_balance_jsonb
      WHERE user_id = p_user_id;
  END IF;

  RETURN true;

EXCEPTION
    WHEN others THEN
        RAISE WARNING 'Error in revoke_credits for user %: %', p_user_id, SQLERRM;
        RETURN false;
END;
$$;


ALTER FUNCTION "public"."revoke_credits"("p_user_id" "uuid", "p_revoke_one_time" integer, "p_revoke_subscription" integer, "p_clear_yearly_details" boolean, "p_clear_monthly_details" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."revoke_credits_and_log"("p_user_id" "uuid", "p_revoke_one_time" integer, "p_revoke_subscription" integer, "p_log_type" "text", "p_notes" "text", "p_related_order_id" "uuid" DEFAULT NULL::"uuid", "p_clear_yearly_details" boolean DEFAULT false, "p_clear_monthly_details" boolean DEFAULT false) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_current_one_time_bal integer;
    v_current_sub_bal integer;
    v_new_one_time_bal integer;
    v_new_sub_bal integer;
    v_current_balance_jsonb jsonb;
    v_new_balance_jsonb jsonb;
    v_amount_revoked integer;
BEGIN
    IF p_revoke_one_time < 0 OR p_revoke_subscription < 0 THEN
        RAISE WARNING 'Revoke amounts cannot be negative. User: %, One-Time: %, Subscription: %', p_user_id, p_revoke_one_time, p_revoke_subscription;
        RETURN;
    END IF;

    SELECT
        one_time_credits_balance,
        subscription_credits_balance,
        balance_jsonb
    INTO
        v_current_one_time_bal,
        v_current_sub_bal,
        v_current_balance_jsonb
    FROM public.usage
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    v_new_one_time_bal := GREATEST(0, v_current_one_time_bal - p_revoke_one_time);
    v_new_sub_bal := GREATEST(0, v_current_sub_bal - p_revoke_subscription);

    v_new_balance_jsonb := COALESCE(v_current_balance_jsonb, '{}'::jsonb);
    
    IF p_clear_yearly_details THEN
        v_new_balance_jsonb := v_new_balance_jsonb - 'yearly_allocation_details';
    END IF;
    
    IF p_clear_monthly_details THEN
        v_new_balance_jsonb := v_new_balance_jsonb - 'monthly_allocation_details';
    END IF;

    IF v_new_one_time_bal <> v_current_one_time_bal OR 
        v_new_sub_bal <> v_current_sub_bal OR 
        v_new_balance_jsonb <> v_current_balance_jsonb THEN
        
        UPDATE public.usage
        SET
            one_time_credits_balance = v_new_one_time_bal,
            subscription_credits_balance = v_new_sub_bal,
            balance_jsonb = v_new_balance_jsonb
        WHERE user_id = p_user_id;

        v_amount_revoked := (v_current_one_time_bal - v_new_one_time_bal) + (v_current_sub_bal - v_new_sub_bal);

        IF v_amount_revoked > 0 THEN
            INSERT INTO public.credit_logs(user_id, amount, one_time_balance_after, subscription_balance_after, type, notes, related_order_id)
            VALUES (p_user_id, -v_amount_revoked, v_new_one_time_bal, v_new_sub_bal, p_log_type, p_notes, p_related_order_id);
        END IF;
    END IF;

EXCEPTION
    WHEN others THEN
        RAISE WARNING 'Error in revoke_credits_and_log for user %: %', p_user_id, SQLERRM;
END;
$$;


ALTER FUNCTION "public"."revoke_credits_and_log"("p_user_id" "uuid", "p_revoke_one_time" integer, "p_revoke_subscription" integer, "p_log_type" "text", "p_notes" "text", "p_related_order_id" "uuid", "p_clear_yearly_details" boolean, "p_clear_monthly_details" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_my_profile"("new_full_name" "text", "new_avatar_url" "text", "new_invite_code" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.users
  SET
    full_name = new_full_name,
    avatar_url = new_avatar_url,
    -- Use CASE to convert an empty string to NULL, otherwise use the provided value
    invite_code = CASE WHEN new_invite_code = '' THEN NULL ELSE new_invite_code END
  WHERE id = auth.uid();
END;
$$;


ALTER FUNCTION "public"."update_my_profile"("new_full_name" "text", "new_avatar_url" "text", "new_invite_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."credit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "amount" integer NOT NULL,
    "one_time_balance_after" integer NOT NULL,
    "subscription_balance_after" integer NOT NULL,
    "type" "text" NOT NULL,
    "notes" "text",
    "related_order_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."credit_logs" OWNER TO "postgres";


COMMENT ON COLUMN "public"."credit_logs"."amount" IS 'The amount of credits changed. Positive for additions, negative for deductions.';



COMMENT ON COLUMN "public"."credit_logs"."one_time_balance_after" IS 'The user''s one-time credit balance after this transaction.';



COMMENT ON COLUMN "public"."credit_logs"."subscription_balance_after" IS 'The user''s subscription credit balance after this transaction.';



COMMENT ON COLUMN "public"."credit_logs"."type" IS 'Type of transaction (e.g., ''feature_usage'', ''one_time_purchase'').';



COMMENT ON COLUMN "public"."credit_logs"."notes" IS 'Additional details or notes about the transaction.';



COMMENT ON COLUMN "public"."credit_logs"."related_order_id" IS 'Optional foreign key to the `orders` table, linking the log to a purchase or refund.';



CREATE TABLE IF NOT EXISTS "public"."image_jobs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "public"."job_status" DEFAULT 'starting'::"public"."job_status" NOT NULL,
    "feature_id" character varying(255) NOT NULL,
    "provider" character varying(255) DEFAULT 'REPLICATE'::character varying NOT NULL,
    "provider_model" character varying(255),
    "provider_job_id" character varying(255),
    "request_params" "jsonb" NOT NULL,
    "final_seed_used" bigint,
    "temp_output_url" "text",
    "final_output_url" "text",
    "error_message" "text",
    "is_public" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."image_jobs" OWNER TO "postgres";


COMMENT ON TABLE "public"."image_jobs" IS 'Stores tasks related to AI image editing, linking users to their jobs.';



COMMENT ON COLUMN "public"."image_jobs"."id" IS 'Unique identifier for the edit job (job_id).';



COMMENT ON COLUMN "public"."image_jobs"."user_id" IS 'Foreign key to the user who initiated the job.';



COMMENT ON COLUMN "public"."image_jobs"."status" IS 'Current status of the job.';



COMMENT ON COLUMN "public"."image_jobs"."feature_id" IS 'Identifier for the specific AI function requested (e.g., "change_haircut").';



COMMENT ON COLUMN "public"."image_jobs"."provider" IS 'The AI service provider used (e.g., "REPLICATE").';



COMMENT ON COLUMN "public"."image_jobs"."provider_model" IS 'The specific model used from the provider.';



COMMENT ON COLUMN "public"."image_jobs"."provider_job_id" IS 'The job ID from the external AI provider for debugging.';



COMMENT ON COLUMN "public"."image_jobs"."request_params" IS 'The full JSON payload of parameters sent by the client.';



COMMENT ON COLUMN "public"."image_jobs"."final_seed_used" IS 'The seed value ultimately used by the AI model.';



COMMENT ON COLUMN "public"."image_jobs"."temp_output_url" IS 'Temporary URL for the result image from the provider webhook.';



COMMENT ON COLUMN "public"."image_jobs"."final_output_url" IS 'Permanent R2 storage URL for the final result image.';



COMMENT ON COLUMN "public"."image_jobs"."error_message" IS 'Detailed error message if the job failed.';



COMMENT ON COLUMN "public"."image_jobs"."is_public" IS 'Whether the result is displayed on a public showcase.';



COMMENT ON COLUMN "public"."image_jobs"."created_at" IS 'Timestamp of when the job was created.';



COMMENT ON COLUMN "public"."image_jobs"."updated_at" IS 'Timestamp of the last update to the job record.';



CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "provider" "text" NOT NULL,
    "provider_order_id" "text" NOT NULL,
    "status" "text" NOT NULL,
    "order_type" "text" NOT NULL,
    "product_id" "text",
    "plan_id" "uuid",
    "price_id" "text",
    "amount_subtotal" numeric,
    "amount_discount" numeric DEFAULT 0,
    "amount_tax" numeric DEFAULT 0,
    "amount_total" numeric NOT NULL,
    "currency" "text" NOT NULL,
    "subscription_provider_id" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


COMMENT ON TABLE "public"."orders" IS 'Stores all payment transactions and subscription lifecycle events.';



COMMENT ON COLUMN "public"."orders"."id" IS 'Unique order/record ID.';



COMMENT ON COLUMN "public"."orders"."user_id" IS 'Associated user ID from public.users.';



COMMENT ON COLUMN "public"."orders"."provider" IS 'Payment provider identifier (e.g., ''stripe'').';



COMMENT ON COLUMN "public"."orders"."provider_order_id" IS 'Provider''s unique ID for the transaction/subscription (e.g., pi_..., sub_..., cs_..., in_...).';



COMMENT ON COLUMN "public"."orders"."status" IS 'Order/subscription status (e.g., ''pending'', ''succeeded'', ''failed'', ''active'', ''canceled'', ''refunded'', ''past_due'', ''incomplete'').';



COMMENT ON COLUMN "public"."orders"."order_type" IS 'Type of order (e.g., ''one_time_purchase'', ''subscription_initial'', ''subscription_renewal'', ''refund'').';



COMMENT ON COLUMN "public"."orders"."product_id" IS 'Provider''s product ID.';



COMMENT ON COLUMN "public"."orders"."plan_id" IS 'Associated internal plan ID from public.pricing_plans.';



COMMENT ON COLUMN "public"."orders"."price_id" IS 'Provider''s price ID (e.g., price_...).';



COMMENT ON COLUMN "public"."orders"."amount_subtotal" IS 'Amount before discounts.';



COMMENT ON COLUMN "public"."orders"."amount_discount" IS 'Discount amount.';



COMMENT ON COLUMN "public"."orders"."amount_tax" IS 'Tax amount.';



COMMENT ON COLUMN "public"."orders"."amount_total" IS 'Final amount paid/due.';



COMMENT ON COLUMN "public"."orders"."currency" IS 'Currency code (e.g., ''usd'').';



COMMENT ON COLUMN "public"."orders"."subscription_provider_id" IS 'Associated Stripe subscription ID (sub_...) for subscription-related events.';



COMMENT ON COLUMN "public"."orders"."metadata" IS 'Stores additional information (e.g., Checkout Session metadata, refund reasons, coupon codes).';



COMMENT ON COLUMN "public"."orders"."created_at" IS 'Timestamp of record creation.';



COMMENT ON COLUMN "public"."orders"."updated_at" IS 'Timestamp of last record update.';



CREATE TABLE IF NOT EXISTS "public"."post_tags" (
    "post_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL
);


ALTER TABLE "public"."post_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "language" character varying(10) NOT NULL,
    "author_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "content" "text",
    "description" "text",
    "featured_image_url" "text",
    "is_pinned" boolean DEFAULT false NOT NULL,
    "status" "public"."post_status" DEFAULT 'draft'::"public"."post_status" NOT NULL,
    "visibility" "public"."post_visibility" DEFAULT 'public'::"public"."post_visibility" NOT NULL,
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pricing_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "environment" character varying(10) NOT NULL,
    "card_title" "text" NOT NULL,
    "card_description" "text",
    "stripe_price_id" character varying(255),
    "stripe_product_id" character varying(255),
    "payment_type" character varying(50),
    "recurring_interval" character varying(50),
    "trial_period_days" integer,
    "price" numeric,
    "currency" character varying(10),
    "display_price" character varying(50),
    "original_price" character varying(50),
    "price_suffix" character varying(100),
    "features" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "is_highlighted" boolean DEFAULT false NOT NULL,
    "highlight_text" "text",
    "button_text" "text",
    "button_link" "text",
    "display_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "lang_jsonb" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "benefits_jsonb" "jsonb" DEFAULT '{}'::"jsonb",
    "enable_manual_input_coupon" boolean DEFAULT false,
    "stripe_coupon_id" character varying,
    CONSTRAINT "pricing_plans_environment_check" CHECK ((("environment")::"text" = ANY ((ARRAY['test'::character varying, 'live'::character varying])::"text"[])))
);


ALTER TABLE "public"."pricing_plans" OWNER TO "postgres";


COMMENT ON TABLE "public"."pricing_plans" IS 'Stores configuration for pricing plans displayed as cards on the frontend.';



COMMENT ON COLUMN "public"."pricing_plans"."environment" IS 'Specifies if the plan is for the ''test'' or ''live'' Stripe environment.';



COMMENT ON COLUMN "public"."pricing_plans"."features" IS 'JSON array of features, e.g., [{"description": "Feature One", "included": true}]';



COMMENT ON COLUMN "public"."pricing_plans"."lang_jsonb" IS 'Stores translations for text fields in JSON format, keyed by language code.';



COMMENT ON COLUMN "public"."pricing_plans"."benefits_jsonb" IS 'JSON object defining plan benefits. E.g., {"monthly_credits": 500} for recurring credits, {"one_time_credits": 1000} for one-off credits.';



CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "plan_id" "uuid" NOT NULL,
    "stripe_subscription_id" "text" NOT NULL,
    "stripe_customer_id" "text" NOT NULL,
    "price_id" "text" NOT NULL,
    "status" "text" NOT NULL,
    "current_period_start" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "cancel_at_period_end" boolean DEFAULT false NOT NULL,
    "canceled_at" timestamp with time zone,
    "ended_at" timestamp with time zone,
    "trial_start" timestamp with time zone,
    "trial_end" timestamp with time zone,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


COMMENT ON TABLE "public"."subscriptions" IS 'Stores the current state and details of user subscriptions, synced from Stripe.';



COMMENT ON COLUMN "public"."subscriptions"."id" IS 'Unique identifier for the subscription record in this table.';



COMMENT ON COLUMN "public"."subscriptions"."user_id" IS 'Foreign key referencing the user associated with this subscription.';



COMMENT ON COLUMN "public"."subscriptions"."plan_id" IS 'Foreign key referencing the internal pricing plan associated with this subscription.';



COMMENT ON COLUMN "public"."subscriptions"."stripe_subscription_id" IS 'The unique subscription ID from Stripe (sub_...). Used as the primary link to Stripe data.';



COMMENT ON COLUMN "public"."subscriptions"."stripe_customer_id" IS 'The Stripe customer ID (cus_...) associated with this subscription.';



COMMENT ON COLUMN "public"."subscriptions"."price_id" IS 'The specific Stripe Price ID (price_...) for the subscription item being tracked.';



COMMENT ON COLUMN "public"."subscriptions"."status" IS 'The current status of the subscription as reported by Stripe (e.g., active, trialing, past_due, canceled).';



COMMENT ON COLUMN "public"."subscriptions"."current_period_start" IS 'Timestamp marking the beginning of the current billing period.';



COMMENT ON COLUMN "public"."subscriptions"."current_period_end" IS 'Timestamp marking the end of the current billing period.';



COMMENT ON COLUMN "public"."subscriptions"."cancel_at_period_end" IS 'Indicates if the subscription is scheduled to cancel at the end of the current billing period.';



COMMENT ON COLUMN "public"."subscriptions"."canceled_at" IS 'Timestamp when the subscription was formally canceled in Stripe.';



COMMENT ON COLUMN "public"."subscriptions"."ended_at" IS 'Timestamp indicating when the subscription access definitively ended (e.g., after cancellation or failed payment grace period).';



COMMENT ON COLUMN "public"."subscriptions"."trial_start" IS 'Timestamp marking the beginning of the trial period, if applicable.';



COMMENT ON COLUMN "public"."subscriptions"."trial_end" IS 'Timestamp marking the end of the trial period, if applicable.';



COMMENT ON COLUMN "public"."subscriptions"."metadata" IS 'JSONB field to store additional context or metadata from Stripe or the application.';



COMMENT ON COLUMN "public"."subscriptions"."created_at" IS 'Timestamp indicating when this subscription record was first created in the database.';



COMMENT ON COLUMN "public"."subscriptions"."updated_at" IS 'Timestamp indicating when this subscription record was last updated.';



CREATE TABLE IF NOT EXISTS "public"."tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."usage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "subscription_credits_balance" integer DEFAULT 0 NOT NULL,
    "one_time_credits_balance" integer DEFAULT 0 NOT NULL,
    "balance_jsonb" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "usage_one_time_credits_balance_check" CHECK (("one_time_credits_balance" >= 0)),
    CONSTRAINT "usage_subscription_credits_balance_check" CHECK (("subscription_credits_balance" >= 0))
);


ALTER TABLE "public"."usage" OWNER TO "postgres";


COMMENT ON TABLE "public"."usage" IS 'Stores usage data like credits balances for each user.';



COMMENT ON COLUMN "public"."usage"."user_id" IS 'Foreign key referencing the user associated with this usage record.';



COMMENT ON COLUMN "public"."usage"."subscription_credits_balance" IS 'Balance of credits granted via subscription, typically reset periodically upon successful payment.';



COMMENT ON COLUMN "public"."usage"."one_time_credits_balance" IS 'Balance of credits acquired through one-time purchases, accumulates over time.';



COMMENT ON COLUMN "public"."usage"."balance_jsonb" IS 'JSONB object to store additional balance information.';



COMMENT ON COLUMN "public"."usage"."created_at" IS 'Timestamp of when the user''s usage record was first created.';



COMMENT ON COLUMN "public"."usage"."updated_at" IS 'Timestamp of the last modification to the user''s usage record.';



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "billing_address" "jsonb",
    "payment_provider" "text",
    "stripe_customer_id" "text",
    "role" "text" DEFAULT 'user'::"text" NOT NULL,
    "invite_code" "text",
    "inviter_user_id" "uuid",
    CONSTRAINT "check_not_self_inviter" CHECK (("id" <> "inviter_user_id")),
    CONSTRAINT "users_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'user'::"text"])))
);

ALTER TABLE ONLY "public"."users" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" OWNER TO "postgres";


COMMENT ON TABLE "public"."users" IS 'Stores application-specific user profile data, extending the auth.users table.';



COMMENT ON COLUMN "public"."users"."id" IS 'Primary key, references auth.users.id.';



COMMENT ON COLUMN "public"."users"."email" IS 'User email, kept in sync with auth.users. Must be unique.';



COMMENT ON COLUMN "public"."users"."stripe_customer_id" IS 'Unique identifier for the user in Stripe.';



COMMENT ON COLUMN "public"."users"."invite_code" IS 'User-defined unique code for inviting others. Case-sensitive. Nullable until set by user.';



COMMENT ON COLUMN "public"."users"."inviter_user_id" IS 'The ID of the user (from this table) who invited the current user. Null if not invited.';



ALTER TABLE ONLY "public"."credit_logs"
    ADD CONSTRAINT "credit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."image_jobs"
    ADD CONSTRAINT "image_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_tags"
    ADD CONSTRAINT "post_tags_pkey" PRIMARY KEY ("post_id", "tag_id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_language_slug_unique" UNIQUE ("language", "slug");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pricing_plans"
    ADD CONSTRAINT "pricing_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_stripe_subscription_id_key" UNIQUE ("stripe_subscription_id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_name_unique" UNIQUE ("name");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."usage"
    ADD CONSTRAINT "usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."usage"
    ADD CONSTRAINT "usage_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_invite_code_key" UNIQUE ("invite_code");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_stripe_customer_id_key" UNIQUE ("stripe_customer_id");



CREATE INDEX "idx_credit_logs_user_id" ON "public"."credit_logs" USING "btree" ("user_id");



CREATE INDEX "idx_image_jobs_is_public" ON "public"."image_jobs" USING "btree" ("is_public");



CREATE INDEX "idx_image_jobs_provider_job_id" ON "public"."image_jobs" USING "btree" ("provider_job_id");



CREATE INDEX "idx_image_jobs_status" ON "public"."image_jobs" USING "btree" ("status");



CREATE INDEX "idx_image_jobs_user_id" ON "public"."image_jobs" USING "btree" ("user_id");



CREATE INDEX "idx_orders_plan_id" ON "public"."orders" USING "btree" ("plan_id");



CREATE INDEX "idx_orders_provider" ON "public"."orders" USING "btree" ("provider");



CREATE UNIQUE INDEX "idx_orders_provider_provider_order_id_unique" ON "public"."orders" USING "btree" ("provider", "provider_order_id");



CREATE INDEX "idx_orders_subscription_provider_id" ON "public"."orders" USING "btree" ("subscription_provider_id");



CREATE INDEX "idx_orders_user_id" ON "public"."orders" USING "btree" ("user_id");



CREATE INDEX "idx_post_tags_post_id" ON "public"."post_tags" USING "btree" ("post_id");



CREATE INDEX "idx_post_tags_tag_id" ON "public"."post_tags" USING "btree" ("tag_id");



CREATE INDEX "idx_posts_author_id" ON "public"."posts" USING "btree" ("author_id");



CREATE INDEX "idx_posts_is_pinned" ON "public"."posts" USING "btree" ("is_pinned") WHERE ("is_pinned" = true);



CREATE INDEX "idx_posts_language_status" ON "public"."posts" USING "btree" ("language", "status");



CREATE INDEX "idx_posts_published_at" ON "public"."posts" USING "btree" ("published_at");



CREATE INDEX "idx_posts_status" ON "public"."posts" USING "btree" ("status");



CREATE INDEX "idx_posts_visibility" ON "public"."posts" USING "btree" ("visibility");



CREATE INDEX "idx_subscriptions_plan_id" ON "public"."subscriptions" USING "btree" ("plan_id");



CREATE INDEX "idx_subscriptions_status" ON "public"."subscriptions" USING "btree" ("status");



CREATE INDEX "idx_subscriptions_stripe_customer_id" ON "public"."subscriptions" USING "btree" ("stripe_customer_id");



CREATE INDEX "idx_subscriptions_user_id" ON "public"."subscriptions" USING "btree" ("user_id");



CREATE INDEX "idx_tags_name" ON "public"."tags" USING "btree" ("name");



CREATE UNIQUE INDEX "unique_initial_subscription_record" ON "public"."orders" USING "btree" ("provider", "subscription_provider_id") WHERE ("order_type" = 'subscription_initial'::"text");



CREATE INDEX "users_email_idx" ON "public"."users" USING "btree" ("email");



CREATE INDEX "users_inviter_user_id_idx" ON "public"."users" USING "btree" ("inviter_user_id");



CREATE INDEX "users_stripe_customer_id_idx" ON "public"."users" USING "btree" ("stripe_customer_id");



CREATE OR REPLACE TRIGGER "handle_orders_updated_at" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "handle_subscriptions_updated_at" BEFORE UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "insert_posts_published_at" BEFORE INSERT ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."handle_published_at"();



CREATE OR REPLACE TRIGGER "on_pricing_plans_updated" BEFORE UPDATE ON "public"."pricing_plans" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_usage_updated" BEFORE UPDATE ON "public"."usage" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_users_update" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "update_image_jobs_updated_at" BEFORE UPDATE ON "public"."image_jobs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_posts_published_at" BEFORE UPDATE ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."handle_published_at"();



CREATE OR REPLACE TRIGGER "update_posts_updated_at" BEFORE UPDATE ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."credit_logs"
    ADD CONSTRAINT "credit_logs_related_order_id_fkey" FOREIGN KEY ("related_order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."credit_logs"
    ADD CONSTRAINT "credit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."image_jobs"
    ADD CONSTRAINT "image_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."pricing_plans"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_tags"
    ADD CONSTRAINT "post_tags_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_tags"
    ADD CONSTRAINT "post_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."pricing_plans"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."usage"
    ADD CONSTRAINT "usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_inviter_user_id_fkey" FOREIGN KEY ("inviter_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



CREATE POLICY "Allow authors to delete their own drafts" ON "public"."posts" FOR DELETE USING ((("auth"."uid"() = "author_id") AND ("status" = 'draft'::"public"."post_status")));



CREATE POLICY "Allow authors to read their own posts" ON "public"."posts" FOR SELECT USING (("auth"."uid"() = "author_id"));



CREATE POLICY "Allow authors to update their own drafts" ON "public"."posts" FOR UPDATE USING ((("auth"."uid"() = "author_id") AND ("status" = 'draft'::"public"."post_status"))) WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "Allow logged-in users read access" ON "public"."posts" FOR SELECT USING ((("status" = 'published'::"public"."post_status") AND ("visibility" = 'logged_in'::"public"."post_visibility") AND ("auth"."role"() = 'authenticated'::"text")));



CREATE POLICY "Allow public read access to active plans" ON "public"."pricing_plans" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Allow public read access to post_tags" ON "public"."post_tags" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to published posts" ON "public"."posts" FOR SELECT USING ((("status" = 'published'::"public"."post_status") AND ("visibility" = 'public'::"public"."post_visibility")));



CREATE POLICY "Allow public read access to tags" ON "public"."tags" FOR SELECT USING (true);



CREATE POLICY "Allow user read own orders" ON "public"."orders" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow user read own subscriptions" ON "public"."subscriptions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow user read own usage" ON "public"."usage" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow user read their own profile" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Allow user to read their own credit logs" ON "public"."credit_logs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Disallow user delete orders" ON "public"."orders" FOR DELETE USING (false);



CREATE POLICY "Disallow user delete subscriptions" ON "public"."subscriptions" FOR DELETE USING (false);



CREATE POLICY "Disallow user delete usage" ON "public"."usage" FOR DELETE USING (false);



CREATE POLICY "Disallow user insert orders" ON "public"."orders" FOR INSERT WITH CHECK (false);



CREATE POLICY "Disallow user insert subscriptions" ON "public"."subscriptions" FOR INSERT WITH CHECK (false);



CREATE POLICY "Disallow user insert usage" ON "public"."usage" FOR INSERT WITH CHECK (false);



CREATE POLICY "Disallow user to modify credit logs" ON "public"."credit_logs" USING (false) WITH CHECK (false);



CREATE POLICY "Disallow user update orders" ON "public"."orders" FOR UPDATE USING (false);



CREATE POLICY "Disallow user update subscriptions" ON "public"."subscriptions" FOR UPDATE USING (false);



CREATE POLICY "Disallow user update usage" ON "public"."usage" FOR UPDATE USING (false);



CREATE POLICY "Users can create their own jobs" ON "public"."image_jobs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own jobs" ON "public"."image_jobs" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own jobs" ON "public"."image_jobs" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."credit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."image_jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."post_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pricing_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."usage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."allocate_specific_monthly_credit_for_year_plan"("p_user_id" "uuid", "p_monthly_credits" integer, "p_current_yyyy_mm" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."allocate_specific_monthly_credit_for_year_plan"("p_user_id" "uuid", "p_monthly_credits" integer, "p_current_yyyy_mm" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."allocate_specific_monthly_credit_for_year_plan"("p_user_id" "uuid", "p_monthly_credits" integer, "p_current_yyyy_mm" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."deduct_credits_and_log"("p_user_id" "uuid", "p_deduct_amount" integer, "p_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."deduct_credits_and_log"("p_user_id" "uuid", "p_deduct_amount" integer, "p_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."deduct_credits_and_log"("p_user_id" "uuid", "p_deduct_amount" integer, "p_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."deduct_credits_priority_one_time"("p_user_id" "uuid", "p_amount_to_deduct" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."deduct_credits_priority_one_time"("p_user_id" "uuid", "p_amount_to_deduct" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."deduct_credits_priority_one_time"("p_user_id" "uuid", "p_amount_to_deduct" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."deduct_credits_priority_subscription"("p_user_id" "uuid", "p_amount_to_deduct" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."deduct_credits_priority_subscription"("p_user_id" "uuid", "p_amount_to_deduct" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."deduct_credits_priority_subscription"("p_user_id" "uuid", "p_amount_to_deduct" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."deduct_one_time_credits"("p_user_id" "uuid", "p_amount_to_deduct" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."deduct_one_time_credits"("p_user_id" "uuid", "p_amount_to_deduct" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."deduct_one_time_credits"("p_user_id" "uuid", "p_amount_to_deduct" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."deduct_subscription_credits"("p_user_id" "uuid", "p_amount_to_deduct" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."deduct_subscription_credits"("p_user_id" "uuid", "p_amount_to_deduct" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."deduct_subscription_credits"("p_user_id" "uuid", "p_amount_to_deduct" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."grant_one_time_credits_and_log"("p_user_id" "uuid", "p_credits_to_add" integer, "p_related_order_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."grant_one_time_credits_and_log"("p_user_id" "uuid", "p_credits_to_add" integer, "p_related_order_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."grant_one_time_credits_and_log"("p_user_id" "uuid", "p_credits_to_add" integer, "p_related_order_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."grant_subscription_credits_and_log"("p_user_id" "uuid", "p_credits_to_set" integer, "p_related_order_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."grant_subscription_credits_and_log"("p_user_id" "uuid", "p_credits_to_set" integer, "p_related_order_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."grant_subscription_credits_and_log"("p_user_id" "uuid", "p_credits_to_set" integer, "p_related_order_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."grant_welcome_credits_and_log"("p_user_id" "uuid", "p_welcome_credits" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."grant_welcome_credits_and_log"("p_user_id" "uuid", "p_welcome_credits" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."grant_welcome_credits_and_log"("p_user_id" "uuid", "p_welcome_credits" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_published_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_published_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_published_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."initialize_or_reset_yearly_allocation"("p_user_id" "uuid", "p_total_months" integer, "p_monthly_credits" integer, "p_subscription_start_date" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."initialize_or_reset_yearly_allocation"("p_user_id" "uuid", "p_total_months" integer, "p_monthly_credits" integer, "p_subscription_start_date" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."initialize_or_reset_yearly_allocation"("p_user_id" "uuid", "p_total_months" integer, "p_monthly_credits" integer, "p_subscription_start_date" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."initialize_or_reset_yearly_allocation"("p_user_id" "uuid", "p_total_months" integer, "p_monthly_credits" integer, "p_subscription_start_date" timestamp with time zone, "p_related_order_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."initialize_or_reset_yearly_allocation"("p_user_id" "uuid", "p_total_months" integer, "p_monthly_credits" integer, "p_subscription_start_date" timestamp with time zone, "p_related_order_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."initialize_or_reset_yearly_allocation"("p_user_id" "uuid", "p_total_months" integer, "p_monthly_credits" integer, "p_subscription_start_date" timestamp with time zone, "p_related_order_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."revoke_credits"("p_user_id" "uuid", "p_revoke_one_time" integer, "p_revoke_subscription" integer, "p_clear_yearly_details" boolean, "p_clear_monthly_details" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."revoke_credits"("p_user_id" "uuid", "p_revoke_one_time" integer, "p_revoke_subscription" integer, "p_clear_yearly_details" boolean, "p_clear_monthly_details" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."revoke_credits"("p_user_id" "uuid", "p_revoke_one_time" integer, "p_revoke_subscription" integer, "p_clear_yearly_details" boolean, "p_clear_monthly_details" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."revoke_credits_and_log"("p_user_id" "uuid", "p_revoke_one_time" integer, "p_revoke_subscription" integer, "p_log_type" "text", "p_notes" "text", "p_related_order_id" "uuid", "p_clear_yearly_details" boolean, "p_clear_monthly_details" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."revoke_credits_and_log"("p_user_id" "uuid", "p_revoke_one_time" integer, "p_revoke_subscription" integer, "p_log_type" "text", "p_notes" "text", "p_related_order_id" "uuid", "p_clear_yearly_details" boolean, "p_clear_monthly_details" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."revoke_credits_and_log"("p_user_id" "uuid", "p_revoke_one_time" integer, "p_revoke_subscription" integer, "p_log_type" "text", "p_notes" "text", "p_related_order_id" "uuid", "p_clear_yearly_details" boolean, "p_clear_monthly_details" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_my_profile"("new_full_name" "text", "new_avatar_url" "text", "new_invite_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_my_profile"("new_full_name" "text", "new_avatar_url" "text", "new_invite_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_my_profile"("new_full_name" "text", "new_avatar_url" "text", "new_invite_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."credit_logs" TO "anon";
GRANT ALL ON TABLE "public"."credit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."image_jobs" TO "anon";
GRANT ALL ON TABLE "public"."image_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."image_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."post_tags" TO "anon";
GRANT ALL ON TABLE "public"."post_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."post_tags" TO "service_role";



GRANT ALL ON TABLE "public"."posts" TO "anon";
GRANT ALL ON TABLE "public"."posts" TO "authenticated";
GRANT ALL ON TABLE "public"."posts" TO "service_role";



GRANT ALL ON TABLE "public"."pricing_plans" TO "anon";
GRANT ALL ON TABLE "public"."pricing_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."pricing_plans" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."tags" TO "anon";
GRANT ALL ON TABLE "public"."tags" TO "authenticated";
GRANT ALL ON TABLE "public"."tags" TO "service_role";



GRANT ALL ON TABLE "public"."usage" TO "anon";
GRANT ALL ON TABLE "public"."usage" TO "authenticated";
GRANT ALL ON TABLE "public"."usage" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";



























create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


RESET ALL;

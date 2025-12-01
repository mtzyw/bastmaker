'use server';

import { actionResponse, ActionResult } from '@/lib/action-response';
import { createClient } from '@/lib/supabase/server';
import { Database } from '@/lib/supabase/types';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const supabaseAdmin = createAdminClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface UserBenefits {
  activePlanId: string | null;
  subscriptionStatus: string | null; // e.g., 'active', 'trialing', 'past_due', 'canceled', null
  currentPeriodEnd: string | null; // subscription end date
  nextCreditDate: string | null; // [subscription] monthly is null, yearly is the next credit date
  totalAvailableCredits: number;
  subscriptionCreditsBalance: number;
  oneTimeCreditsBalance: number;
}

interface UsageData {
  subscription_credits_balance: number | null;
  one_time_credits_balance: number | null;
  balance_jsonb: any;
}

interface SubscriptionData {
  plan_id: string;
  status: string;
  current_period_end: string | null;
}

const defaultUserBenefits: UserBenefits = {
  activePlanId: null,
  subscriptionStatus: null,
  currentPeriodEnd: null,
  nextCreditDate: null,
  totalAvailableCredits: 0,
  subscriptionCreditsBalance: 0,
  oneTimeCreditsBalance: 0,
};

function createUserBenefitsFromData(
  usageData: UsageData | null,
  subscription: SubscriptionData | null,
  currentYearlyDetails: any | null
): UserBenefits {
  const subCredits = (usageData?.subscription_credits_balance ?? 0) as number;
  const oneTimeCredits = (usageData?.one_time_credits_balance ?? 0) as number;
  const totalCredits = subCredits + oneTimeCredits;

  const currentPeriodEnd = subscription?.current_period_end ?? null;
  const nextCreditDate = currentYearlyDetails?.next_credit_date ?? null;

  let finalStatus = subscription?.status ?? null;
  if (finalStatus && subscription?.current_period_end && new Date(subscription.current_period_end) < new Date()) {
    finalStatus = 'inactive_period_ended';
  }

  return {
    activePlanId: (finalStatus === 'active' || finalStatus === 'trialing') ? subscription?.plan_id ?? null : null,
    subscriptionStatus: finalStatus,
    currentPeriodEnd,
    nextCreditDate,
    totalAvailableCredits: totalCredits,
    subscriptionCreditsBalance: subCredits,
    oneTimeCreditsBalance: oneTimeCredits,
  };
}

async function fetchSubscriptionData(supabase: any, userId: string): Promise<SubscriptionData | null> {
  try {
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('plan_id, status, current_period_end, cancel_at_period_end')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subscriptionError) {
      console.error(`Error fetching subscription data for user ${userId}:`, subscriptionError);
      return null;
    }

    return subscription;
  } catch (error) {
    console.error(`Unexpected error in fetchSubscriptionData for user ${userId}:`, error);
    return null;
  }
}

/**
 * Helper function to handle welcome credits for new users
 */
async function handleWelcomeCredits(userId: string): Promise<UsageData | null> {
  try {
    const welcomeCredits = parseInt(process.env.NEXT_PUBLIC_WELCOME_CREDITS ?? '0');
    if (!welcomeCredits) {
      return null;
    }

    const { data: usageDataFromRPC, error: welcomeError } = await supabaseAdmin
      .rpc('grant_welcome_credits_and_log', {
        p_user_id: userId,
        p_welcome_credits: welcomeCredits,
      })
      .maybeSingle();

    if (welcomeError) {
      console.error(`Error calling grant_welcome_credits_and_log RPC for user ${userId}:`, welcomeError);
      return null;
    }

    return usageDataFromRPC;
  } catch (welcomeCreditError) {
    console.error(`Unexpected error granting welcome credits for user ${userId}:`, welcomeCreditError);
    return null;
  }
}

/**
 * Retrieves the user's current benefits including plan, status, and credit balances.
 *
 * @param userId The UUID of the user.
 * @returns A promise resolving to the UserBenefits object.
 */
export async function getUserBenefits(userId: string): Promise<UserBenefits> {
  if (!userId) {
    return defaultUserBenefits;
  }

  const supabase = await createClient();

  try {
    const { data: usageData, error: usageError } = await supabase
      .from('usage')
      .select('subscription_credits_balance, one_time_credits_balance, balance_jsonb')
      .eq('user_id', userId)
      .maybeSingle();

    if (usageError) {
      console.error(`Error fetching usage data for user ${userId}:`, usageError);
      return defaultUserBenefits;
    }

    let finalUsageData: UsageData | null = usageData;

    // ------------------------------------------
    // new user, grant welcome credits
    // ------------------------------------------
    if (!usageData) {
      finalUsageData = await handleWelcomeCredits(userId);
    }

    // ------------------------------------------
    // Daily Free Credits Logic (Lazy Reset)
    // ------------------------------------------
    // Only check if we have usage data (meaning user exists)
    if (finalUsageData) {
      // We optimistically try to grant. The RPC handles all checks (free plan, time, balance < 10).
      // If it returns TRUE, it means a grant happened, so we should refetch.
      const { data: granted, error: grantError } = await supabaseAdmin.rpc('grant_daily_free_credits', {
        p_user_id: userId,
        p_daily_amount: 10 // Hardcoded to 10 as per requirement
      });

      if (grantError) {
        console.error(`Error attempting to grant daily free credits for user ${userId}:`, grantError);
      } else if (granted) {
        console.log(`Daily free credits granted for user ${userId}. Refetching usage.`);
        const { data: updatedUsageData, error: refetchError } = await supabase
          .from('usage')
          .select('subscription_credits_balance, one_time_credits_balance, balance_jsonb')
          .eq('user_id', userId)
          .maybeSingle();

        if (!refetchError && updatedUsageData) {
          finalUsageData = updatedUsageData;
        }
      }
    }

    // ------------------------------------------
    // Start of Yearly Subscription Catch-up Logic
    // ------------------------------------------
    if (finalUsageData) {
      let currentBalanceJsonb = finalUsageData.balance_jsonb as any;
      let currentYearlyDetails = currentBalanceJsonb?.yearly_allocation_details;

      while (
        currentYearlyDetails &&
        currentYearlyDetails.remaining_months > 0 &&
        currentYearlyDetails.next_credit_date &&
        new Date() >= new Date(currentYearlyDetails.next_credit_date)
      ) {
        const creditsToAllocate = currentYearlyDetails.monthly_credits;
        const yearMonthToAllocate = new Date(currentYearlyDetails.next_credit_date).toISOString().slice(0, 7);

        console.log(`Attempting to allocate credits for user ${userId}, month ${yearMonthToAllocate}, remaining: ${currentYearlyDetails.remaining_months}`);

        const { error: rpcError } = await supabaseAdmin.rpc('allocate_specific_monthly_credit_for_year_plan', {
          p_user_id: userId,
          p_monthly_credits: creditsToAllocate,
          p_current_yyyy_mm: yearMonthToAllocate
        });

        if (rpcError) {
          console.error(`Catch-up: Error calling allocate_specific_monthly_credit_for_year_plan for user ${userId}, month ${yearMonthToAllocate}:`, rpcError);
          break;
        } else {
          console.log(`Catch-up: Successfully allocated or skipped for user ${userId}, month ${yearMonthToAllocate}. Re-fetching usage data.`);
          const { data: updatedUsageData, error: refetchError } = await supabase
            .from('usage')
            .select('subscription_credits_balance, one_time_credits_balance, balance_jsonb')
            .eq('user_id', userId)
            .maybeSingle();

          if (refetchError) {
            console.error(`Catch-up: Error re-fetching usage data for user ${userId} after allocation:`, refetchError);
            break;
          }
          if (!updatedUsageData) {
            console.warn(`Catch-up: Usage data disappeared for user ${userId} after allocation. Stopping.`);
            finalUsageData = null;
            break;
          }

          finalUsageData = updatedUsageData;
          currentBalanceJsonb = finalUsageData.balance_jsonb as any;
          currentYearlyDetails = currentBalanceJsonb?.yearly_allocation_details;

          if (!currentYearlyDetails) {
            console.log(`Catch-up: yearly_allocation_details no longer present for user ${userId} after allocation. Stopping loop.`);
            break;
          }
        }
      }
      // ------------------------------------------
      // End of Yearly Subscription Catch-up Logic
      // ------------------------------------------

      const subscription = await fetchSubscriptionData(supabase, userId);

      return createUserBenefitsFromData(finalUsageData, subscription, currentYearlyDetails);
    } else {
      return defaultUserBenefits;
    }
  } catch (error) {
    console.error(`Unexpected error in getUserBenefits for user ${userId}:`, error);
    return defaultUserBenefits;
  }
}

export async function getClientUserBenefits(): Promise<ActionResult<UserBenefits>> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return actionResponse.unauthorized();
  }

  try {
    const benefits = await getUserBenefits(user.id);
    return actionResponse.success(benefits);
  } catch (error: any) {
    console.error("Error fetching user benefits for client:", error);
    return actionResponse.error(
      error.message || "Failed to fetch user benefits."
    );
  }
}

export interface DetailedSubscriptionInfo {
  activePlanId: string | null;
  subscriptionStatus: string | null;
  totalAvailableCredits: number;
  subscriptionCreditsBalance: number;
  oneTimeCreditsBalance: number;
  subscription: {
    current_period_start: string | null;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
    stripe_subscription_id: string | null;
  } | null;
  plan: {
    id: string;
    card_title: string;
    recurring_interval: string | null;
    benefits_jsonb: any;
  } | null;
  yearlyAllocation: {
    monthlyCredits: number;
    nextCreditDate: string;
    remainingMonths: number;
    lastAllocatedMonth: string;
  } | null;
}

export async function getDetailedSubscriptionInfo(userId: string): Promise<DetailedSubscriptionInfo> {
  const emptyInfo: DetailedSubscriptionInfo = {
    activePlanId: null,
    subscriptionStatus: null,
    totalAvailableCredits: 0,
    subscriptionCreditsBalance: 0,
    oneTimeCreditsBalance: 0,
    subscription: null,
    plan: null,
    yearlyAllocation: null,
  };

  if (!userId) {
    return emptyInfo;
  }

  const supabase = await createClient();

  try {
    const { data: usageData } = await supabase
      .from('usage')
      .select('subscription_credits_balance, one_time_credits_balance, balance_jsonb')
      .eq('user_id', userId)
      .maybeSingle();

    let finalUsageData: UsageData | null = usageData;

    if (!usageData) {
      finalUsageData = await handleWelcomeCredits(userId);
    }

    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select(`
        plan_id,
        status,
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        stripe_subscription_id
      `)
      .eq('user_id', userId)
      .in('status', ['active'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subscriptionError) {
      console.error(`Error fetching subscription data for user ${userId}:`, subscriptionError);
    }

    let planDetails = null;
    if (subscription?.plan_id) {
      const { data: plan, error: planError } = await supabase
        .from('pricing_plans')
        .select(`
          id,
          card_title,
          recurring_interval,
          benefits_jsonb
        `)
        .eq('id', subscription.plan_id)
        .single();

      if (planError) {
        console.error(`Error fetching plan data for plan_id ${subscription.plan_id}:`, planError);
      } else {
        planDetails = plan;
      }
    }

    const subCredits = (finalUsageData?.subscription_credits_balance ?? 0) as number;
    const oneTimeCredits = (finalUsageData?.one_time_credits_balance ?? 0) as number;
    const totalCredits = subCredits + oneTimeCredits;

    let finalStatus = subscription?.status ?? null;
    if (finalStatus && subscription?.current_period_end && new Date(subscription.current_period_end) < new Date()) {
      finalStatus = 'inactive_period_ended';
    }

    // Extract yearly allocation details if present
    let yearlyAllocation = null;
    if (finalUsageData?.balance_jsonb) {
      const balanceJsonb = finalUsageData.balance_jsonb as any;
      const yearlyDetails = balanceJsonb?.yearly_allocation_details;

      if (yearlyDetails &&
        yearlyDetails.monthly_credits &&
        yearlyDetails.next_credit_date &&
        yearlyDetails.remaining_months !== undefined) {
        yearlyAllocation = {
          monthlyCredits: yearlyDetails.monthly_credits,
          nextCreditDate: yearlyDetails.next_credit_date,
          remainingMonths: yearlyDetails.remaining_months,
          lastAllocatedMonth: yearlyDetails.last_allocated_month || '',
        };
      }
    }

    return {
      activePlanId: (finalStatus === 'active' || finalStatus === 'trialing') ? subscription?.plan_id ?? null : null,
      subscriptionStatus: finalStatus,
      totalAvailableCredits: totalCredits,
      subscriptionCreditsBalance: subCredits,
      oneTimeCreditsBalance: oneTimeCredits,
      subscription: subscription ? {
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        stripe_subscription_id: subscription.stripe_subscription_id,
      } : null,
      plan: planDetails,
      yearlyAllocation: yearlyAllocation,
    };
  } catch (error) {
    console.error(`Unexpected error in getDetailedSubscriptionInfo for user ${userId}:`, error);
    return emptyInfo;
  }
}

export async function getClientDetailedSubscriptionInfo(): Promise<ActionResult<DetailedSubscriptionInfo | null>> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return actionResponse.unauthorized();
  }

  try {
    const info = await getDetailedSubscriptionInfo(user.id);
    return actionResponse.success(info);
  } catch (error: any) {
    console.error('Error fetching detailed subscription info for client:', error);
    return actionResponse.error(error.message || 'Failed to fetch detailed subscription info.');
  }
}

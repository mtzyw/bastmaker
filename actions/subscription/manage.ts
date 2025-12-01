'use server';

import stripe from '@/lib/stripe/stripe';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function getUserAndSubscription(subscriptionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  if (!stripe) throw new Error("Stripe not initialized");

  // Verify subscription ownership
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('user_id, stripe_subscription_id')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (!sub || sub.user_id !== user.id) {
    throw new Error("Subscription not found or access denied");
  }

  return { user, stripe };
}

export async function cancelSubscription(subscriptionId: string) {
  try {
    const { stripe } = await getUserAndSubscription(subscriptionId);

    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    revalidatePath('/dashboard/subscription');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function resumeSubscription(subscriptionId: string) {
  try {
    const { stripe } = await getUserAndSubscription(subscriptionId);

    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });

    revalidatePath('/dashboard/subscription');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

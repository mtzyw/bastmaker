import type { RequestCookies } from "next/headers";

import { incrementAiJobShareConversion } from "@/actions/ai-jobs/public";
import { shareRewardConfig, SHARE_REWARD_INVITEE_LOG_TYPE, SHARE_REWARD_OWNER_LOG_TYPE } from "@/config/share";
import { getServiceRoleClient } from "@/lib/supabase/admin";
import { getShareAttributionCookie, clearShareAttributionCookie } from "@/lib/share/cookie";

type ConsumeOptions = {
  store?: RequestCookies;
};

export type ShareConsumptionResult = {
  consumed: boolean;
  reason?: string;
};

const UNIQUE_VIOLATION_CODE = "23505";

export async function consumeShareAttributionForUser(
  userId: string,
  options?: ConsumeOptions
): Promise<ShareConsumptionResult> {
  if (!userId) {
    return { consumed: false, reason: "missing_user" };
  }

  const payload = await getShareAttributionCookie(options?.store);
  if (!payload) {
    return { consumed: false, reason: "no_cookie" };
  }

  if (payload.ownerId === userId) {
    await clearShareAttributionCookie(options?.store).catch((error) => {
      console.error("[share-consume] failed to clear cookie for owner self-visit", error);
    });
    return { consumed: false, reason: "owner_visit" };
  }

  const supabase = getServiceRoleClient();

  const mode = payload.mode ?? "job";

  if (mode === "invite") {
    const { data: existingUser, error: existingUserError } = await supabase
      .from("users")
      .select("inviter_user_id")
      .eq("id", userId)
      .maybeSingle();

    if (existingUserError) {
      console.error("[share-consume] failed to load user profile for invite", existingUserError);
      return { consumed: false, reason: "user_fetch_failed" };
    }

    if (existingUser?.inviter_user_id) {
      await clearShareAttributionCookie(options?.store).catch((error) => {
        console.error("[share-consume] failed to clear cookie after existing inviter", error);
      });
      return { consumed: false, reason: "already_has_inviter" };
    }

    const { error: updateUserError } = await supabase
      .from("users")
      .update({ inviter_user_id: payload.ownerId })
      .eq("id", userId);

    if (updateUserError) {
      console.error("[share-consume] failed to set inviter for user", updateUserError);
      return { consumed: false, reason: "invite_set_failed" };
    }

    const { ownerCredits, inviteeCredits } = shareRewardConfig;
    const notes = `Invite reward from ${payload.ownerId}`;

    if (ownerCredits > 0) {
      const { error } = await supabase.rpc("grant_share_reward_and_log", {
        p_user_id: payload.ownerId,
        p_credits_to_add: ownerCredits,
        p_related_job_id: null,
        p_log_type: SHARE_REWARD_OWNER_LOG_TYPE,
        p_notes: notes,
      });

      if (error) {
        console.error("[share-consume] failed to grant invite owner reward", error);
      }
    }

    if (inviteeCredits > 0) {
      const { error } = await supabase.rpc("grant_share_reward_and_log", {
        p_user_id: userId,
        p_credits_to_add: inviteeCredits,
        p_related_job_id: null,
        p_log_type: SHARE_REWARD_INVITEE_LOG_TYPE,
        p_notes: notes,
      });

      if (error) {
        console.error("[share-consume] failed to grant invitee reward", error);
      }
    }

    await clearShareAttributionCookie(options?.store).catch((error) => {
      console.error("[share-consume] failed to clear invite cookie", error);
    });

    return { consumed: true };
  }

  if (!payload.jobId) {
    await clearShareAttributionCookie(options?.store).catch((error) => {
      console.error("[share-consume] failed to clear cookie with missing job id", error);
    });
    return { consumed: false, reason: "missing_job" };
  }

  const { data: job, error: jobError } = await supabase
    .from("ai_jobs")
    .select(
      "id, user_id, is_public, share_conversion_count, share_slug"
    )
    .eq("id", payload.jobId)
    .maybeSingle();

  if (jobError) {
    console.error("[share-consume] failed to load job", jobError);
    return { consumed: false, reason: "job_fetch_failed" };
  }

  if (!job || !job.is_public) {
    await clearShareAttributionCookie(options?.store).catch((error) => {
      console.error("[share-consume] failed to clear cookie after missing job", error);
    });
    return { consumed: false, reason: "job_not_public" };
  }

  if (job.user_id !== payload.ownerId) {
    await clearShareAttributionCookie(options?.store).catch((error) => {
      console.error("[share-consume] failed to clear cookie after owner mismatch", error);
    });
    return { consumed: false, reason: "owner_mismatch" };
  }

  const { ownerCredits, inviteeCredits, maxRewardsPerJob } = shareRewardConfig;
  const rewardEnabled = ownerCredits > 0 || inviteeCredits > 0;

  const currentConversions = job.share_conversion_count ?? 0;

  if (maxRewardsPerJob > 0 && currentConversions >= maxRewardsPerJob) {
    await clearShareAttributionCookie(options?.store).catch((error) => {
      console.error("[share-consume] failed to clear cookie after reaching cap", error);
    });
    return { consumed: false, reason: "max_reached" };
  }

  const metadata = {
    shareSlug: job.share_slug ?? payload.shareSlug,
    locale: payload.locale,
    source: payload.source,
    consumedAt: new Date().toISOString(),
  };

  let conversionId: string | null = null;
  let alreadyRewarded = false;

  const { data: conversion, error: conversionError } = await supabase
    .from("job_share_conversions")
    .insert({
      job_id: job.id,
      inviter_user_id: payload.ownerId,
      invited_user_id: userId,
      metadata,
    })
    .select("id, status")
    .single();

  if (conversionError) {
    if (conversionError.code === UNIQUE_VIOLATION_CODE) {
      const { data: existing, error: fetchExistingError } = await supabase
        .from("job_share_conversions")
        .select("id, status")
        .eq("job_id", job.id)
        .eq("invited_user_id", userId)
        .maybeSingle();

      if (fetchExistingError) {
        console.error("[share-consume] failed to read existing conversion", fetchExistingError);
        return { consumed: false, reason: "conversion_lookup_failed" };
      }

      if (!existing) {
        console.error("[share-consume] duplicate insert but missing existing record");
        return { consumed: false, reason: "conversion_inconsistent" };
      }

      conversionId = existing.id;
      alreadyRewarded = existing.status === "rewarded";
    } else {
      console.error("[share-consume] failed to insert conversion", conversionError);
      return { consumed: false, reason: "conversion_insert_failed" };
    }
  } else if (conversion) {
    conversionId = conversion.id;
  }

  if (!conversionId) {
    return { consumed: false, reason: "missing_conversion_id" };
  }

  if (alreadyRewarded) {
    await clearShareAttributionCookie(options?.store).catch((error) => {
      console.error("[share-consume] failed to clear cookie for rewarded conversion", error);
    });
    return { consumed: false, reason: "already_rewarded" };
  }

  // Update invite relationship if not set.
  await supabase
    .from("users")
    .update({ inviter_user_id: payload.ownerId })
    .eq("id", userId)
    .is("inviter_user_id", null);

  await supabase
    .from("job_share_conversions")
    .update({ metadata })
    .eq("id", conversionId);

  if (!rewardEnabled) {
    await supabase
      .from("job_share_conversions")
      .update({
        status: "dismissed",
        metadata,
      })
      .eq("id", conversionId);

    await clearShareAttributionCookie(options?.store).catch((error) => {
      console.error("[share-consume] failed to clear cookie when reward disabled", error);
    });

    return { consumed: false, reason: "reward_disabled" };
  }

  const shareSlugValue = job.share_slug ?? payload.shareSlug ?? job.id;
  const ownerNotes = `Share reward for job ${shareSlugValue}`;

  if (ownerCredits > 0) {
    const { error } = await supabase.rpc("grant_share_reward_and_log", {
      p_user_id: payload.ownerId,
      p_credits_to_add: ownerCredits,
      p_related_job_id: job.id,
      p_log_type: SHARE_REWARD_OWNER_LOG_TYPE,
      p_notes: ownerNotes,
    });

    if (error) {
      console.error("[share-consume] failed to grant owner reward", error);
      await markConversionDismissed(supabase, conversionId, metadata);
      return { consumed: false, reason: "owner_reward_failed" };
    }
  }

  if (inviteeCredits > 0) {
    const { error } = await supabase.rpc("grant_share_reward_and_log", {
      p_user_id: userId,
      p_credits_to_add: inviteeCredits,
      p_related_job_id: job.id,
      p_log_type: SHARE_REWARD_INVITEE_LOG_TYPE,
      p_notes: ownerNotes,
    });

    if (error) {
      console.error("[share-consume] failed to grant invitee reward", error);
      await markConversionDismissed(supabase, conversionId, metadata);
      return { consumed: false, reason: "invitee_reward_failed" };
    }
  }

  const { error: updateError } = await supabase
    .from("job_share_conversions")
    .update({
      status: "rewarded",
      reward_granted_at: new Date().toISOString(),
      metadata,
    })
    .eq("id", conversionId);

  if (updateError) {
    console.error("[share-consume] failed to update conversion status", updateError);
  }

  await incrementAiJobShareConversion(job.id);

  await clearShareAttributionCookie(options?.store).catch((error) => {
    console.error("[share-consume] failed to clear attribution cookie", error);
  });

  return { consumed: true };
}

async function markConversionDismissed(
  client: ReturnType<typeof getServiceRoleClient>,
  conversionId: string,
  metadata: Record<string, unknown>
) {
  await client
    .from("job_share_conversions")
    .update({
      status: "dismissed",
      metadata,
    })
    .eq("id", conversionId);
}

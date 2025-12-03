import { getUserBenefits } from "@/actions/usage/benefits";
import { deductCredits } from "@/actions/usage/deduct";
import {
  createFreepikLipSyncTask,
  FreepikRequestError,
  type FreepikLipSyncPayload,
  type FreepikTaskResponse,
} from "@/lib/ai/freepik-client";
import { mapFreepikStatus } from "@/lib/ai/freepik-status";
import { attachJobToLatestCreditLog, refundCreditsForJob } from "@/lib/ai/job-finance";
import { DEFAULT_LIP_SYNC_MODEL, getLipSyncModelConfig } from "@/lib/ai/lip-sync-config";
import { formatProviderError } from "@/lib/ai/provider-error";
import { apiResponse } from "@/lib/api-response";
import { ensureJobShareMetadata } from "@/lib/share/job-share";
import { createClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/types";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  model: z.string().optional(),
  video_url: z.string().url(),
  audio_url: z.string().url(),
  seed: z.number().int().optional(),
  guidance_scale: z.number().min(0).max(10).optional(),
  return_private_url: z.boolean().optional(),
  is_public: z.boolean().optional(),
});

type LipSyncTaskPayload = {
  jobId: string;
  providerJobId: string | null;
  status: string;
  freepikStatus: string | null;
  creditsCost: number;
  updatedBenefits?: any;
};

type DeductionContext = {
  wasCharged: boolean;
  amount: number;
};

function getWebhookUrl(): string | undefined {
  const base = process.env.WEBHOOK_BASE_URL?.replace(/\/$/, "");
  if (!base) {
    return undefined;
  }
  return `${base}/api/ai/freepik/webhook`;
}

export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return apiResponse.badRequest("Invalid JSON payload");
  }

  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) {
    return apiResponse.badRequest("Invalid request payload");
  }

  const data = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiResponse.unauthorized();
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Supabase service role credentials are not configured");
    return apiResponse.serverError("Server configuration error");
  }

  const adminSupabase = createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  const resolvedModel = data.model ?? DEFAULT_LIP_SYNC_MODEL;
  const modelConfig = getLipSyncModelConfig(resolvedModel);
  const isPublic = data.is_public ?? true;

  const metadataJson: Record<string, any> = {
    source: "lip-sync",
    credits_cost: modelConfig.creditsCost,
    video_url: data.video_url,
    audio_url: data.audio_url,
    seed: data.seed ?? null,
    guidance_scale: data.guidance_scale ?? null,
    return_private_url: data.return_private_url ?? false,
    freepik_latest_status: null,
    freepik_initial_status: null,
    freepik_task_id: null,
    is_public: isPublic,
    model_display_name: modelConfig.displayName,
  };

  const pricingSnapshot = {
    credits_cost: modelConfig.creditsCost,
    currency: "credits",
    captured_at: new Date().toISOString(),
  };

  const inputParams = {
    model: resolvedModel,
    video_url: data.video_url,
    audio_url: data.audio_url,
    seed: data.seed ?? null,
    guidance_scale: data.guidance_scale ?? null,
    return_private_url: data.return_private_url ?? false,
  };

  // Check concurrency limit
  const userBenefits = await getUserBenefits(user.id);
  const isPaidUser = userBenefits.subscriptionStatus === 'active' || userBenefits.subscriptionStatus === 'trialing';
  const concurrencyLimit = isPaidUser ? 4 : 1;

  const { data: jobRecordJson, error: insertError } = await adminSupabase
    .rpc('create_ai_job_secure', {
      p_user_id: user.id,
      p_limit: concurrencyLimit,
      p_provider_code: modelConfig.providerCode,
      p_modality_code: modelConfig.defaultModality,
      p_model_slug: resolvedModel,
      p_input_params: inputParams,
      p_metadata: metadataJson,
      p_cost_estimated: modelConfig.creditsCost,
      p_pricing_snapshot: pricingSnapshot,
      p_is_public: isPublic,
    });

  if (insertError) {
    console.error("[lip-sync] failed to create job via RPC", insertError);
    if (insertError.message === 'CONCURRENCY_LIMIT_EXCEEDED') {
      return apiResponse.error(
        `3 tasks are running. Please wait before adding new ones.`,
        429
      );
    }
    return apiResponse.serverError("Failed to create job record");
  }

  const jobRecord = jobRecordJson as Database['public']['Tables']['ai_jobs']['Row'];

  if (insertError || !jobRecord) {
    console.error("[lip-sync] failed to insert ai_jobs record", insertError);
    return apiResponse.serverError("Failed to create job record");
  }

  await ensureJobShareMetadata({
    adminClient: adminSupabase,
    jobId: jobRecord.id,
    currentShareSlug: jobRecord.share_slug,
    publicTitle: "AI Lip Sync",
    publicSummary: "Sync video lips with uploaded audio",
    publicAssets: [],
    isPublic,
  });

  const deduction: DeductionContext = {
    wasCharged: false,
    amount: modelConfig.creditsCost,
  };

  let updatedBenefits: any = null;

  if (modelConfig.creditsCost > 0) {
    const deductionNote = "AI lip sync generation";
    const deducted = await deductCredits(modelConfig.creditsCost, deductionNote);

    if (!deducted.success) {
      await adminSupabase
        .from("ai_jobs")
        .update({
          status: "cancelled_insufficient_credits",
          error_message: deducted.error ?? "Insufficient credits",
        })
        .eq("id", jobRecord.id);

      return apiResponse.error(deducted.error ?? "Insufficient credits", 402);
    }

    deduction.wasCharged = true;
    updatedBenefits = deducted.data?.updatedBenefits ?? null;

    await attachJobToLatestCreditLog(adminSupabase, user.id, jobRecord.id, deductionNote);
  }

  const payload: FreepikLipSyncPayload = {
    video_url: data.video_url,
    audio_url: data.audio_url,
  };

  if (typeof data.seed === "number") {
    payload.seed = data.seed;
  }

  if (typeof data.guidance_scale === "number") {
    payload.guidance_scale = data.guidance_scale;
  }

  if (typeof data.return_private_url === "boolean") {
    payload.return_private_url = data.return_private_url;
  }

  const webhookUrl = getWebhookUrl();
  if (webhookUrl) {
    payload.webhook_url = webhookUrl;
  }

  try {
    const freepikResponse = (await createFreepikLipSyncTask(payload)) as
      | FreepikTaskResponse
      | Record<string, unknown>
      | null;
    const taskData = (freepikResponse as FreepikTaskResponse | null)?.data ?? null;
    const providerJobId: string | null = taskData?.task_id ?? null;
    const freepikStatus: string | null = taskData?.status ?? null;
    const internalStatus = mapFreepikStatus(freepikStatus);

    const updatedMetadata: Record<string, any> = {
      ...metadataJson,
      freepik_task_id: providerJobId,
      freepik_initial_status: freepikStatus,
      freepik_latest_status: freepikStatus,
      freepik_last_event_at: new Date().toISOString(),
    };

    const updates: Database["public"]["Tables"]["ai_jobs"]["Update"] = {
      provider_job_id: providerJobId,
      status: internalStatus,
      cost_actual_credits: deduction.wasCharged ? deduction.amount : 0,
      metadata_json: updatedMetadata,
    };

    if (internalStatus === "failed") {
      const providerError = formatProviderError(
        (taskData as any)?.error ??
        (taskData as any)?.message ??
        (freepikResponse as any)?.error ??
        (freepikResponse as any)?.message,
      );
      const errorMessage = providerError ?? "Lip sync failed. Please try again.";
      updates.error_message = errorMessage;
      updatedMetadata.error_message = errorMessage;

      if (deduction.wasCharged) {
        await refundCreditsForJob(
          adminSupabase,
          user.id,
          deduction.amount,
          jobRecord.id,
          "Refund: Lip sync task failed immediately",
        );
        updates.cost_actual_credits = 0;
        updatedMetadata.refund_issued = true;
        deduction.wasCharged = false;
      }
    }

    await adminSupabase
      .from("ai_jobs")
      .update(updates)
      .eq("id", jobRecord.id);

    await adminSupabase.from("ai_job_events").insert({
      job_id: jobRecord.id,
      event_type: "freepik_lip_sync_task_created",
      payload_json: freepikResponse as Json,
    });

    return apiResponse.success<LipSyncTaskPayload>({
      jobId: jobRecord.id,
      providerJobId,
      status: internalStatus,
      freepikStatus,
      creditsCost: deduction.wasCharged ? deduction.amount : 0,
      updatedBenefits,
    });
  } catch (error) {
    console.error("[lip-sync] task submission failed", error);

    let message = "Failed to submit lip sync task";
    let statusCode = 500;

    if (error instanceof FreepikRequestError) {
      message = error.message;
      statusCode = error.status ?? 500;
    }

    await adminSupabase
      .from("ai_jobs")
      .update({
        status: "failed",
        error_message: message,
      })
      .eq("id", jobRecord.id);

    if (deduction.wasCharged) {
      await refundCreditsForJob(adminSupabase, user.id, deduction.amount, jobRecord.id);
    }

    return apiResponse.error(message, statusCode);
  }
}

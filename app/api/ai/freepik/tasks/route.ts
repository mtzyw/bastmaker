import { deductCredits } from "@/actions/usage/deduct";
import {
  createFreepikImageTask,
  FreepikImagePayload,
  FreepikRequestError,
  FreepikTaskResponse,
} from "@/lib/ai/freepik-client";
import { attachJobToLatestCreditLog, refundCreditsForJob } from "@/lib/ai/job-finance";
import { mapFreepikStatus } from "@/lib/ai/freepik-status";
import { getTextToImageModelConfig } from "@/lib/ai/text-to-image-config";
import { apiResponse } from "@/lib/api-response";
import { createClient } from "@/lib/supabase/server";
import { Database } from "@/lib/supabase/types";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  model: z.string().min(1),
  prompt: z.string().min(1),
  aspect_ratio: z.string().optional(),
  reference_images: z.array(z.string().min(1)).max(5).optional(),
  translate_prompt: z.boolean().optional(),
});

type FreepikTaskPayload = {
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
  const trimmedPrompt = data.prompt.trim();
  if (!trimmedPrompt) {
    return apiResponse.badRequest("Prompt is required");
  }

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
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const modelConfig = getTextToImageModelConfig(data.model);
  const isImageToImage = (data.reference_images?.length ?? 0) > 0;
  const modalityCode = isImageToImage ? "i2i" : modelConfig.defaultModality;
  const referenceImageCount = data.reference_images?.length ?? 0;

  const metadataJson = {
    source: "text-to-image",
    translate_prompt: data.translate_prompt ?? false,
    is_image_to_image: isImageToImage,
    reference_image_count: referenceImageCount,
    credits_cost: modelConfig.creditsCost,
  };

  const pricingSnapshot = {
    credits_cost: modelConfig.creditsCost,
    currency: "credits",
    captured_at: new Date().toISOString(),
  };

  const inputParams = {
    model: data.model,
    prompt: trimmedPrompt,
    aspect_ratio: data.aspect_ratio ?? null,
    reference_image_count: referenceImageCount,
  };

  const { data: jobRecord, error: insertError } = await adminSupabase
    .from("ai_jobs")
    .insert({
      user_id: user.id,
      provider_code: modelConfig.providerCode,
      modality_code: modalityCode,
      model_slug_at_submit: data.model,
      status: "pending",
      input_params_json: inputParams,
      metadata_json: metadataJson,
      cost_estimated_credits: modelConfig.creditsCost,
      pricing_snapshot_json: pricingSnapshot,
    })
    .select()
    .single();

  if (insertError || !jobRecord) {
    console.error("[freepik] failed to insert ai_jobs record", insertError);
    return apiResponse.serverError("Failed to create job record");
  }

  const deduction: DeductionContext = {
    wasCharged: false,
    amount: modelConfig.creditsCost,
  };
  let updatedBenefits: any = null;

  if (modelConfig.creditsCost > 0) {
    const deductionNote = `AI image generation - ${modelConfig.displayName}`;
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

  const payload: FreepikImagePayload = {
    prompt: trimmedPrompt,
  };

  if (data.aspect_ratio && data.model !== "gemini-2-5-flash-image-preview") {
    payload.aspect_ratio = data.aspect_ratio;
  }

  if (referenceImageCount > 0) {
    payload.reference_images = data.model === "gemini-2-5-flash-image-preview"
      ? data.reference_images!.slice(0, 3)
      : data.reference_images;
  }

  const webhookUrl = getWebhookUrl();
  if (webhookUrl) {
    payload.webhook_url = webhookUrl;
  }

  try {
    const freepikResponse = (await createFreepikImageTask(
      data.model,
      payload
    )) as FreepikTaskResponse | Record<string, unknown> | null;
    const taskData = (freepikResponse as FreepikTaskResponse | null)?.data ?? null;
    const providerJobId: string | null = taskData?.task_id ?? null;
    const freepikStatus: string | null = taskData?.status ?? null;
    const internalStatus = mapFreepikStatus(freepikStatus);

    const updatedMetadata = {
      ...metadataJson,
      freepik_initial_status: freepikStatus,
    };

    await adminSupabase
      .from("ai_jobs")
      .update({
        provider_job_id: providerJobId,
        status: internalStatus,
        cost_actual_credits: deduction.wasCharged ? deduction.amount : 0,
        metadata_json: updatedMetadata,
      })
      .eq("id", jobRecord.id);

    await adminSupabase.from("ai_job_events").insert({
      job_id: jobRecord.id,
      event_type: "freepik_task_created",
      payload_json: freepikResponse,
    });

    return apiResponse.success<FreepikTaskPayload>({
      jobId: jobRecord.id,
      providerJobId,
      status: internalStatus,
      freepikStatus,
      creditsCost: deduction.wasCharged ? deduction.amount : 0,
      updatedBenefits,
    });
  } catch (error) {
    console.error("[freepik] task submission failed", error);

    let message = "Failed to submit Freepik task";
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

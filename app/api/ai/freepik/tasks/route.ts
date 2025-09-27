import { deductCredits } from "@/actions/usage/deduct";
import {
  createFreepikImageTask,
  FreepikImagePayload,
  FreepikRequestError,
  FreepikTaskResponse,
} from "@/lib/ai/freepik-client";
import { attachJobToLatestCreditLog, refundCreditsForJob } from "@/lib/ai/job-finance";
import { mapFreepikStatus } from "@/lib/ai/freepik-status";
import { formatProviderError } from "@/lib/ai/provider-error";
import { getTextToImageModelConfig } from "@/lib/ai/text-to-image-config";
import { apiResponse } from "@/lib/api-response";
import { createClient } from "@/lib/supabase/server";
import { Database } from "@/lib/supabase/types";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { z } from "zod";
import { generateShareSlug } from "@/lib/share/slug";

const requestSchema = z.object({
  model: z.string().min(1),
  prompt: z.string().min(1),
  aspect_ratio: z.string().optional(),
  reference_images: z.array(z.string().min(1)).max(5).optional(),
  translate_prompt: z.boolean().optional(),
  is_public: z.boolean().optional(),
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
  const isPublic = data.is_public ?? true;
  const trimmedPrompt = data.prompt.trim();
  const referenceImageUrls = (data.reference_images ?? []).filter(
    (url): url is string => typeof url === "string" && url.length > 0,
  );
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
    prompt: trimmedPrompt,
    original_prompt: trimmedPrompt,
    model_display_name: modelConfig.displayName,
    modality_code: modalityCode,
    reference_inputs: referenceImageUrls,
    is_public: isPublic,
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
      is_public: isPublic,
    })
    .select()
    .single();

  if (insertError || !jobRecord) {
    console.error("[freepik] failed to insert ai_jobs record", insertError);
    return apiResponse.serverError("Failed to create job record");
  }

  if (jobRecord.share_slug === null || jobRecord.share_slug === undefined) {
    const shareSlug = generateShareSlug();
    const publicTitle = trimmedPrompt.length > 80 ? `${trimmedPrompt.slice(0, 77)}...` : trimmedPrompt;
    const publicSummary = `${modelConfig.displayName} • ${isImageToImage ? "Image to Image" : "Text to Image"}`;

    await adminSupabase
      .from("ai_jobs")
      .update({
        share_slug: shareSlug,
        public_title: publicTitle || modelConfig.displayName,
        public_summary: publicSummary,
        public_assets: [],
        is_public: isPublic,
      })
      .eq("id", jobRecord.id);
  }

  if (referenceImageUrls.length > 0) {
    const inputRows = referenceImageUrls.map((url, index) => ({
      job_id: jobRecord.id,
      index,
      type: "image",
      source: "reference",
      url,
      metadata_json: {
        role: "reference",
        model: data.model,
      },
    }));

    const { error: inputsError } = await adminSupabase.from("ai_job_inputs").insert(inputRows);
    if (inputsError) {
      console.error("[freepik] failed to record reference inputs", inputsError);
    }
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
          (freepikResponse as any)?.message
      );
      const errorMessage = providerError ?? "Generation failed. Please try again.";
      updates.error_message = errorMessage;
      updatedMetadata.error_message = errorMessage;

      if (deduction.wasCharged) {
        await refundCreditsForJob(
          adminSupabase,
          user.id,
          deduction.amount,
          jobRecord.id,
          "Refund: Freepik task failed immediately"
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

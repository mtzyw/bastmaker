import { deductCredits } from "@/actions/usage/deduct";
import {
  createFreepikVideoTask,
  FreepikRequestError,
  FreepikTaskResponse,
} from "@/lib/ai/freepik-client";
import { mapFreepikStatus } from "@/lib/ai/freepik-status";
import { attachJobToLatestCreditLog, refundCreditsForJob } from "@/lib/ai/job-finance";
import { apiResponse } from "@/lib/api-response";
import { ensureJobShareMetadata } from "@/lib/share/job-share";
import { shareModalityDisplayName } from "@/lib/share/job-metadata";
import { createClient } from "@/lib/supabase/server";
import { Database } from "@/lib/supabase/types";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { z } from "zod";
import { fetchVideoEffectTemplate } from "@/lib/video-effects/templates";
import {
  generateR2Key,
  getDataFromDataUrl,
  serverUploadFile,
} from "@/lib/cloudflare/r2";

// Simplified request schema from frontend
const requestSchema = z.object({
  effect_slug: z.string().min(1),
  assets: z
    .record(
      z.object({
        url: z.string().url(),
      })
    )
    .optional(),
  // Keep image_url for backward compatibility with older clients if any
  image_url: z.string().url().optional(),
});

// This mapping is the key to replacing the giant switch statement.
// It tells the backend what the primary image parameter is called for each model.
const PRIMARY_IMAGE_PARAM_MAP: Record<string, string> = {
  "minimax-hailuo-02-768p": "first_frame_image",
  "minimax-hailuo-02-1080p": "first_frame_image",
  "kling-v2-1-master": "image",
  "kling-v2-5-pro": "image",
  "kling-v2-1-std": "image",
  "pixverse-v5": "image_url",
  "seedance-pro-1080p": "image",
  "seedance-pro-720p": "image",
  "seedance-pro-480p": "image",
  "seedance-lite-1080p": "image",
  "seedance-lite-720p": "image",
  "seedance-lite-480p": "image",
  "wan-v2-2-720p": "image",
  "wan-v2-2-580p": "image",
  "wan-v2-2-480p": "image",
};

// This function handles any minor, model-specific tweaks needed after the main payload is built.
function applyModelSpecificTweaks(payload: Record<string, any>, model: string) {
  const tweakedPayload = { ...payload };
  // Example: Ensure duration is a string for models that require it
  if (model.startsWith("kling-") || model.startsWith("seedance-") || model.startsWith("wan-")) {
    if (typeof tweakedPayload.duration === "number") {
      tweakedPayload.duration = String(tweakedPayload.duration);
    }
  }
  return tweakedPayload;
}

function getWebhookUrl(): string | undefined {
  const base = process.env.WEBHOOK_BASE_URL?.replace(/\/$/, "");
  if (!base) {
    return undefined;
  }
  return `${base}/api/ai/freepik/webhook`;
}

async function ensureR2Url(
  source: string | undefined,
  kind: string
): Promise<string | undefined> {
  if (!source || !source.startsWith("data:")) {
    return source;
  }

  const parsed = getDataFromDataUrl(source);
  if (!parsed) {
    throw new Error("Invalid image data format.");
  }

  const [, rawSubtype] = parsed.contentType.split("/");
  const extension = rawSubtype?.toLowerCase()?.includes("png") ? "png" : "jpg";
  const key = generateR2Key({
    fileName: `${kind}-${Date.now()}.${extension}`,
    path: "image-to-videos",
  });

  const uploadResult = await serverUploadFile({
    data: parsed.buffer,
    contentType: parsed.contentType,
    key,
  });

  return uploadResult.url;
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

  const { effect_slug, assets, image_url } = parsed.data;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return apiResponse.unauthorized();
  }

  const effectTemplate = await fetchVideoEffectTemplate(effect_slug);
  if (!effectTemplate) {
    return apiResponse.notFound("Effect template not found");
  }

  const {
    providerModel: apiModel,
    metadata,
    pricing_credits_override,
    providerCode,
    slug,
    title,
  } = effectTemplate;
  
  const modelDisplayName = metadata?.model_display_name ?? apiModel;
  
  // 1. Start with the base payload from the database
  let payload: Record<string, any> = { ...(metadata?.freepik_params ?? {}) };

  // 2. Collect all reference assets (primary + template-specific slots)
  const resolvedReferenceMap = new Map<string, string>();
  const missingRequiredSlots: string[] = [];

  const assignAsset = async (
    slot: string,
    source: string | null | undefined,
    { required = false, payloadKey }: { required?: boolean; payloadKey?: string } = {}
  ) => {
    if (!source) {
      if (required) {
        missingRequiredSlots.push(slot);
      }
      return;
    }

    const remoteUrl = await ensureR2Url(source, slot).catch(() => null);
    if (!remoteUrl) {
      if (required) {
        missingRequiredSlots.push(slot);
      }
      return;
    }

    resolvedReferenceMap.set(slot, remoteUrl);

    if (payloadKey) {
      payload[payloadKey] = remoteUrl;
    } else if (slot !== "primary" && payload[slot] === undefined) {
      payload[slot] = remoteUrl;
    }
  };

  const primaryParamName = PRIMARY_IMAGE_PARAM_MAP[apiModel!];
  await assignAsset("primary", assets?.primary?.url ?? image_url ?? null, {
    required: Boolean(primaryParamName),
    payloadKey: primaryParamName,
  });

  for (const input of effectTemplate.inputs) {
    if (input.slot === "primary") {
      continue;
    }
    const providedUrl = assets?.[input.slot]?.url ?? null;
    const payloadKey = typeof input.metadata?.param === "string" && input.metadata.param.length > 0
      ? input.metadata.param
      : typeof input.metadata?.payload_param === "string" && input.metadata.payload_param.length > 0
      ? input.metadata.payload_param
      : undefined;

    await assignAsset(input.slot, providedUrl, {
      required: input.isRequired,
      payloadKey,
    });
  }

  for (const [slot, value] of Object.entries(assets ?? {})) {
    if (slot === "primary" || resolvedReferenceMap.has(slot)) {
      continue;
    }
    await assignAsset(slot, value?.url ?? null);
  }

  if (missingRequiredSlots.length > 0) {
    return apiResponse.badRequest(`缺少必要素材：${missingRequiredSlots.join(", ")}`);
  }

  const primaryImageUrl = resolvedReferenceMap.get("primary") ?? null;
  const referenceImageUrls = Array.from(resolvedReferenceMap.values());

  // 3. Apply model-specific tweaks
  payload = applyModelSpecificTweaks(payload, apiModel!);

  // 4. Add webhook URL
  const webhookUrl = getWebhookUrl();
  if (webhookUrl) {
    payload.webhook_url = webhookUrl;
  }

  // 5. Final validation
  if (!payload.prompt) {
    return apiResponse.badRequest("A prompt is required in the effect template's freepik_params.");
  }
  const imageParam = PRIMARY_IMAGE_PARAM_MAP[apiModel!];
  if (imageParam && !payload[imageParam] && (apiModel!.startsWith("seedance-") || apiModel!.startsWith("wan-") || apiModel!.startsWith("pixverse-v5"))) {
    return apiResponse.badRequest(`Model ${apiModel} requires a reference image.`);
  }

  // --- Boilerplate for DB operations and credit deduction ---
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Supabase service role credentials are not configured");
    return apiResponse.serverError("Server configuration error");
  }
  const adminSupabase = createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const effectiveCreditsCost = pricing_credits_override ?? 25;
  const modalityCode = imageParam && payload[imageParam] ? "i2v" : "t2v";

  const metadataJsonForJob = {
    source: "video",
    api_model: apiModel,
    prompt: payload.prompt,
    model_display_name: modelDisplayName,
    modality_code: modalityCode,
    credits_cost: effectiveCreditsCost,
    effect_slug: slug,
    effect_title: title,
    reference_inputs: Object.fromEntries(Array.from(resolvedReferenceMap.keys()).map((slot) => [slot, true])),
    reference_image_urls: referenceImageUrls,
    reference_image_count: referenceImageUrls.length,
    primary_image_url: primaryImageUrl ?? null,
  };

  const { data: jobRecord, error: insertError } = await adminSupabase
    .from("ai_jobs")
    .insert({
      user_id: user.id,
      provider_code: providerCode,
      modality_code: modalityCode,
      model_slug_at_submit: modelDisplayName,
      status: "pending",
      input_params_json: {
        effect_slug: slug,
        reference_image_urls: referenceImageUrls,
        reference_image_count: referenceImageUrls.length,
        image_url: primaryImageUrl ?? null,
        primary_image_url: primaryImageUrl ?? null,
        ...payload,
      },
      metadata_json: metadataJsonForJob,
      cost_estimated_credits: effectiveCreditsCost,
      pricing_snapshot_json: { credits_cost: effectiveCreditsCost, currency: "credits", captured_at: new Date().toISOString() },
    })
    .select()
    .single();

  if (insertError || !jobRecord) {
    console.error("[effects-video] failed to insert ai_jobs record", insertError);
    return apiResponse.serverError("Failed to create job record");
  }

  const shareTitleSource =
    (typeof payload.prompt === "string" && payload.prompt.trim().length > 0 ? payload.prompt.trim() : null) ??
    title ??
    modelDisplayName;
  const publicTitle =
    shareTitleSource && shareTitleSource.length > 80
      ? `${shareTitleSource.slice(0, 77)}...`
      : shareTitleSource ?? modelDisplayName;
  const summaryParts = [title ?? modelDisplayName, shareModalityDisplayName(modalityCode), effectTemplate.category].filter(
    (value): value is string => Boolean(value && value.length > 0)
  );
  const publicSummary = summaryParts.join(" • ") || null;

  await ensureJobShareMetadata({
    adminClient: adminSupabase,
    jobId: jobRecord.id,
    currentShareSlug: jobRecord.share_slug,
    publicTitle,
    publicSummary,
    publicAssets: [],
    isPublic: true,
  });

  if (resolvedReferenceMap.size > 0) {
    const inputRows: Database["public"]["Tables"]["ai_job_inputs"]["Insert"][] = [];
    let index = 0;
    for (const [slot, url] of resolvedReferenceMap.entries()) {
      inputRows.push({
        job_id: jobRecord.id,
        index: index++,
        type: "image",
        source: slot,
        url,
        metadata_json: {
          role: slot,
          effect_slug: slug,
        },
      });
    }

    const { error: inputsError } = await adminSupabase.from("ai_job_inputs").insert(inputRows);
    if (inputsError) {
      console.error("[effects-video] failed to record reference inputs", inputsError);
    }
  }

  const deduction = { wasCharged: false, amount: effectiveCreditsCost };
  let updatedBenefits: any = null;
  if (effectiveCreditsCost > 0) {
    const deducted = await deductCredits(effectiveCreditsCost, `AI video generation - ${modelDisplayName}`);
    if (!deducted.success) {
      await adminSupabase.from("ai_jobs").update({ status: "cancelled_insufficient_credits", error_message: deducted.error ?? "Insufficient credits" }).eq("id", jobRecord.id);
      return apiResponse.error(deducted.error ?? "Insufficient credits", 402);
    }
    deduction.wasCharged = true;
    updatedBenefits = deducted.data?.updatedBenefits ?? null;
    await attachJobToLatestCreditLog(adminSupabase, user.id, jobRecord.id, `AI video generation - ${modelDisplayName}`);
  }

  // --- Final API call ---
  try {
    console.log("[effects-video] request payload", { endpoint: apiModel, payload });
    const freepikResponse = await createFreepikVideoTask(apiModel, payload) as FreepikTaskResponse | Record<string, unknown> | null;
    console.log("[effects-video] response", freepikResponse);

    const taskData = (freepikResponse as FreepikTaskResponse | null)?.data ?? null;
    const providerJobId: string | null = taskData?.task_id ?? null;
    const freepikStatus: string | null = taskData?.status ?? null;
    const internalStatus = mapFreepikStatus(freepikStatus);

    const updates: Partial<Database["public"]["Tables"]["ai_jobs"]["Row"]> = {
      provider_job_id: providerJobId,
      status: internalStatus,
      cost_actual_credits: deduction.wasCharged ? deduction.amount : 0,
    };

    if (internalStatus === "failed") {
      const errorMessage = (taskData as any)?.error?.message ?? (taskData as any)?.message ?? "Generation failed immediately.";
      updates.error_message = errorMessage;
      if (deduction.wasCharged) {
        await refundCreditsForJob(adminSupabase, user.id, deduction.amount, jobRecord.id, "Refund: Freepik task failed immediately");
        updates.cost_actual_credits = 0;
      }
    }

    await adminSupabase.from("ai_jobs").update(updates).eq("id", jobRecord.id);

    return apiResponse.success({
      jobId: jobRecord.id,
      providerJobId,
      status: internalStatus,
      freepikStatus,
      creditsCost: deduction.wasCharged ? deduction.amount : 0,
      updatedBenefits,
    });
  } catch (error: any) {
    console.error("[effects-video] task submission failed", error);
    const message = error instanceof FreepikRequestError ? error.message : "Failed to submit Freepik video task";
    await adminSupabase.from("ai_jobs").update({ status: "failed", error_message: message }).eq("id", jobRecord.id);
    if (deduction.wasCharged) {
      await refundCreditsForJob(adminSupabase, user.id, deduction.amount, jobRecord.id);
    }
    return apiResponse.error(message, 500);
  }
}

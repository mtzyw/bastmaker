import { deductCredits } from "@/actions/usage/deduct";
import { toFreepikModelValue } from "@/lib/ai/freepik";
import {
  createFreepikImageTask,
  FreepikImagePayload,
  FreepikRequestError,
  FreepikTaskResponse,
} from "@/lib/ai/freepik-client";
import { mapFreepikStatus } from "@/lib/ai/freepik-status";
import { attachJobToLatestCreditLog, refundCreditsForJob } from "@/lib/ai/job-finance";
import { formatProviderError } from "@/lib/ai/provider-error";
import { apiResponse } from "@/lib/api-response";
import {
  generateR2Key,
  getDataFromDataUrl,
  serverUploadFile,
} from "@/lib/cloudflare/r2";
import {
  fetchImageEffectTemplate,
  type ImageEffectTemplate,
} from "@/lib/image-effects/templates";
import { ensureJobShareMetadata } from "@/lib/share/job-share";
import { createClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/types";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { z } from "zod";

type AssetPayload = { url: string };

const requestSchema = z.object({
  effect_slug: z.string().min(1),
  assets: z
    .record(
      z.object({
        url: z.string().min(1),
      })
    )
    .optional(),
  image_url: z.string().url().optional(),
  prompt: z.string().optional(),
  negative_prompt: z.string().optional(),
  aspect_ratio: z.string().optional(),
  translate_prompt: z.boolean().optional(),
  variables: z.record(z.string(), z.unknown()).optional(),
  is_public: z.boolean().optional(),
});

async function ensureRemoteAsset(
  source: string | null | undefined,
  slot: string
): Promise<string | undefined> {
  if (!source) {
    return undefined;
  }

  if (!source.startsWith("data:")) {
    return source;
  }

  const parsed = getDataFromDataUrl(source);
  if (!parsed) {
    throw new Error("图片数据格式不正确，请重新上传");
  }

  const key = generateR2Key({
    fileName: `${slot}-${Date.now()}.png`,
    path: "image-effects",
  });

  const uploadResult = await serverUploadFile({
    data: parsed.buffer,
    contentType: parsed.contentType,
    key,
  });

  return uploadResult.url;
}

function resolveTemplatePrompt(
  template: ImageEffectTemplate,
  overrides: {
    prompt?: string;
    negative_prompt?: string;
    aspect_ratio?: string;
    translate_prompt?: boolean;
  }
) {
  const defaults = (template.metadata?.freepik_params ?? {}) as Record<string, any>;
  const prompt = overrides.prompt ?? defaults.prompt;
  if (!prompt) {
    throw new Error("模板缺少默认提示词，请先在后台配置 prompt");
  }

  return {
    prompt,
    negativePrompt: overrides.negative_prompt ?? defaults.negative_prompt ?? null,
    aspectRatio: overrides.aspect_ratio ?? defaults.aspect_ratio ?? null,
    translatePrompt:
      typeof overrides.translate_prompt === "boolean"
        ? overrides.translate_prompt
        : typeof defaults.translate_prompt === "boolean"
          ? defaults.translate_prompt
          : false,
  };
}

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

  const {
    effect_slug,
    assets,
    image_url,
    prompt: promptOverride,
    negative_prompt,
    aspect_ratio,
    translate_prompt,
    is_public,
  } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiResponse.unauthorized();
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[image-effects] missing Supabase service credentials");
    return apiResponse.serverError("Server configuration error");
  }

  const adminSupabase = createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const template = await fetchImageEffectTemplate(effect_slug);
  if (!template) {
    return apiResponse.notFound("Image effect template not found");
  }

  if (!template.providerModel || template.providerModel.length === 0) {
    return apiResponse.serverError("Template missing provider model configuration");
  }

  const isPublic = is_public ?? true;

  // Prepare assets
  const assetEntries = Object.entries(assets ?? {}) as Array<[string, AssetPayload]>;
  const resolvedAssets = new Map<string, string>();

  if (image_url) {
    resolvedAssets.set("primary", image_url);
  }

  for (const [slot, value] of assetEntries) {
    if (!value?.url) {
      continue;
    }
    resolvedAssets.set(slot, value.url);
  }

  const requiredSlots =
    template.inputs.length > 0
      ? template.inputs
      : [
        {
          id: "primary",
          slot: "primary",
          type: "image",
          isRequired: true,
          maxSizeMb: null,
          instructions: null,
          metadata: {},
          displayOrder: 0,
        },
      ];

  const missingSlots: string[] = [];

  for (const input of requiredSlots) {
    const providedUrl = resolvedAssets.get(input.slot);
    if (!providedUrl && input.isRequired) {
      missingSlots.push(input.slot);
    }
  }

  if (missingSlots.length > 0) {
    return apiResponse.badRequest(
      `缺少必要素材：${missingSlots.join("，")}`
    );
  }

  // Ensure remote URLs (upload data URLs to R2 if needed)
  for (const [slot, url] of Array.from(resolvedAssets.entries())) {
    const remote = await ensureRemoteAsset(url, slot);
    if (remote) {
      resolvedAssets.set(slot, remote);
    }
  }

  const primaryImageUrl =
    resolvedAssets.get("primary") ??
    resolvedAssets.values().next().value ??
    null;

  if (!primaryImageUrl) {
    return apiResponse.badRequest("缺少 primary 图片素材");
  }

  const { prompt, negativePrompt, aspectRatio, translatePrompt } =
    resolveTemplatePrompt(template, {
      prompt: promptOverride,
      negative_prompt,
      aspect_ratio,
      translate_prompt,
    });

  const referenceInputs = Object.fromEntries(
    Array.from(resolvedAssets.keys()).map((slot) => [slot, true])
  );
  const referenceImageUrls = Array.from(resolvedAssets.values());

  const pricingSnapshot = {
    credits_cost: template.pricingCreditsOverride ?? 6,
    currency: "credits",
    captured_at: new Date().toISOString(),
  };

  const metadataJson = {
    source: "image-effect",
    effect_slug: template.slug,
    effect_title: template.title,
    credits_cost: template.pricingCreditsOverride ?? 6,
    prompt,
    negative_prompt: negativePrompt,
    aspect_ratio: aspectRatio,
    translate_prompt: translatePrompt,
    reference_inputs: referenceInputs,
    reference_image_urls: referenceImageUrls,
    reference_image_count: referenceImageUrls.length,
    primary_image_url: primaryImageUrl,
    model_display_name: template.metadata?.model_display_name ?? template.title,
    is_public: isPublic,
  };

  if (parsed.data.variables && Object.keys(parsed.data.variables).length > 0) {
    (metadataJson as any).variables = parsed.data.variables;
  }

  const inputParams = {
    effect_slug: template.slug,
    prompt,
    negative_prompt: negativePrompt,
    aspect_ratio: aspectRatio,
    translate_prompt: translatePrompt,
    reference_image_urls: referenceImageUrls,
    primary_image_url: primaryImageUrl,
    provider_model: template.providerModel,
  };

  if (parsed.data.variables && Object.keys(parsed.data.variables).length > 0) {
    (inputParams as any).variables = parsed.data.variables;
  }

  const { data: jobRecord, error: insertError } = await adminSupabase
    .from("ai_jobs")
    .insert({
      user_id: user.id,
      provider_code: template.providerCode,
      modality_code: "i2i",
      model_slug_at_submit: template.providerModel,
      status: "pending",
      input_params_json: inputParams,
      metadata_json: metadataJson,
      cost_estimated_credits: template.pricingCreditsOverride ?? 6,
      pricing_snapshot_json: pricingSnapshot,
      is_public: isPublic,
    })
    .select()
    .single();

  if (insertError || !jobRecord) {
    console.error("[image-effects] failed to insert ai_jobs", insertError);
    return apiResponse.serverError("Failed to create job record");
  }

  await ensureJobShareMetadata({
    adminClient: adminSupabase,
    jobId: jobRecord.id,
    currentShareSlug: jobRecord.share_slug,
    publicTitle: template.title,
    publicSummary: `${template.title} • AI Image Effect`,
    publicAssets: [],
    isPublic,
  });

  if (referenceImageUrls.length > 0) {
    const inputRows: Database["public"]["Tables"]["ai_job_inputs"]["Insert"][] = [];
    let index = 0;
    for (const [slot, url] of resolvedAssets.entries()) {
      inputRows.push({
        job_id: jobRecord.id,
        index: index++,
        type: "image",
        source: slot,
        url,
        metadata_json: {
          role: slot,
          effect_slug: template.slug,
        },
      });
    }

    const { error: inputsError } = await adminSupabase
      .from("ai_job_inputs")
      .insert(inputRows);
    if (inputsError) {
      console.error("[image-effects] failed to record reference inputs", inputsError);
    }
  }

  const deduction = {
    wasCharged: false,
    amount: template.pricingCreditsOverride ?? 6,
  };
  let updatedBenefits: any = null;

  if (deduction.amount > 0) {
    const deducted = await deductCredits(
      deduction.amount,
      `AI image effect - ${template.title}`
    );

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

    await attachJobToLatestCreditLog(
      adminSupabase,
      user.id,
      jobRecord.id,
      `AI image effect - ${template.title}`
    );
  }

  const payload: FreepikImagePayload = {
    prompt,
    aspect_ratio: aspectRatio ?? undefined,
    reference_images: referenceImageUrls,
    translate_prompt: translatePrompt,
    // image_url: primaryImageUrl ?? undefined, // Removed to fix validation error with seedream-v4-edit
    negative_prompt: negativePrompt ?? undefined,
    webhook_url: getWebhookUrl(),
  };

  try {
    const providerModel = toFreepikModelValue(template.providerModel);
    console.log("[image-effects] submitting task:", {
      model: providerModel,
      originalModel: template.providerModel,
      payload,
    });

    const freepikResponse = (await createFreepikImageTask(
      providerModel,
      payload
    )) as FreepikTaskResponse | Record<string, unknown> | null;

    const taskData = (freepikResponse as FreepikTaskResponse | null)?.data ?? null;
    const providerJobId: string | null = taskData?.task_id ?? null;
    const freepikStatus: string | null = taskData?.status ?? null;
    const internalStatus = mapFreepikStatus(freepikStatus);

    const updates: Database["public"]["Tables"]["ai_jobs"]["Update"] = {
      provider_job_id: providerJobId,
      status: internalStatus,
      cost_actual_credits: deduction.wasCharged ? deduction.amount : 0,
      metadata_json: {
        ...metadataJson,
        freepik_task_id: providerJobId,
        freepik_initial_status: freepikStatus,
        freepik_latest_status: freepikStatus,
        freepik_last_event_at: new Date().toISOString(),
      },
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
      if (deduction.wasCharged) {
        await refundCreditsForJob(
          adminSupabase,
          user.id,
          deduction.amount,
          jobRecord.id,
          "Refund: Freepik image effect task failed immediately"
        );
        updates.cost_actual_credits = 0;
        deduction.wasCharged = false;
      }
    }

    await adminSupabase.from("ai_jobs").update(updates).eq("id", jobRecord.id);

    await adminSupabase.from("ai_job_events").insert({
      job_id: jobRecord.id,
      event_type: "freepik_image_effect_task_created",
      payload_json: freepikResponse as Json,
    });

    return apiResponse.success({
      jobId: jobRecord.id,
      providerJobId,
      status: internalStatus,
      freepikStatus,
      creditsCost: deduction.wasCharged ? deduction.amount : 0,
      updatedBenefits,
    });
  } catch (error: any) {
    console.error("[image-effects] task submission failed", error);

    let message = "Failed to submit Freepik image effect task";
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

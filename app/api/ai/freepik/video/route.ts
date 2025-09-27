import { deductCredits } from "@/actions/usage/deduct";
import {
  createFreepikVideoTask,
  FreepikRequestError,
  FreepikTaskResponse,
} from "@/lib/ai/freepik-client";
import { mapFreepikStatus } from "@/lib/ai/freepik-status";
import { formatProviderError } from "@/lib/ai/provider-error";
import { getVideoModelConfig, resolveVideoApiModel } from "@/lib/ai/video-config";
import { attachJobToLatestCreditLog, refundCreditsForJob } from "@/lib/ai/job-finance";
import { toFreepikAspectRatio } from "@/lib/ai/freepik";
import { apiResponse } from "@/lib/api-response";
import { createClient } from "@/lib/supabase/server";
import { Database } from "@/lib/supabase/types";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { z } from "zod";
import { generateShareSlug } from "@/lib/share/slug";
import {
  generateR2Key,
  getDataFromDataUrl,
  serverUploadFile,
} from "@/lib/cloudflare/r2";

const requestSchema = z.object({
  mode: z.enum(["text", "image", "transition"]).optional(),
  model: z.string().min(1),
  api_model: z.string().min(1).optional(),
  prompt: z.string().optional(),
  translate_prompt: z.boolean().optional(),
  prompt_optimizer: z.boolean().optional(),
  resolution: z.string().optional(),
  duration: z.union([z.string(), z.number()]).optional(),
  video_length: z.union([z.string(), z.number()]).optional(),
  aspect_ratio: z.string().optional(),
  negative_prompt: z.string().optional(),
  image_url: z.string().url().optional(),
  first_frame_image_url: z.string().url().optional(),
  last_frame_image_url: z.string().url().optional(),
  tail_image_url: z.string().url().optional(),
  intro_image_url: z.string().url().optional(),
  outro_image_url: z.string().url().optional(),
  seed: z.union([z.number(), z.string()]).optional(),
  cfg_scale: z.number().min(0).max(1).optional(),
  static_mask: z.string().optional(),
  dynamic_masks: z.unknown().optional(),
});

type ParsedRequest = z.infer<typeof requestSchema>;

type VideoMode = "text" | "image" | "transition";

function resolveMode(data: ParsedRequest): VideoMode {
  if (data.mode) {
    return data.mode;
  }

  const hasTransitionImages = Boolean(data.intro_image_url && data.outro_image_url);
  if (hasTransitionImages) {
    return "transition";
  }

  const imageUrl = data.image_url ?? data.first_frame_image_url;
  if (imageUrl) {
    return "image";
  }

  return "text";
}

function getWebhookUrl(): string | undefined {
  const base = process.env.WEBHOOK_BASE_URL?.replace(/\/$/, "");
  if (!base) {
    return undefined;
  }
  return `${base}/api/ai/freepik/webhook`;
}

const ENDPOINT_ALLOWED_DURATIONS: Record<string, (number | string)[]> = {
  "minimax-hailuo-02-768p": [6, 10],
  "minimax-hailuo-02-1080p": [6],
  "kling-v2-1-master": ["5", "10"],
  "kling-v2-5-pro": ["5", "10"],
  "kling-v2-1-std": ["5", "10"],
  "pixverse-v5": [5, 8],
  "pixverse-v5-transition": [5, 8],
  "seedance-pro-1080p": ["5", "10"],
  "seedance-pro-720p": ["5", "10"],
  "seedance-pro-480p": ["5", "10"],
  "seedance-lite-1080p": ["5", "10"],
  "seedance-lite-720p": ["5", "10"],
  "seedance-lite-480p": ["5", "10"],
  "wan-v2-2-720p": ["5", "10"],
  "wan-v2-2-580p": ["5", "10"],
  "wan-v2-2-480p": ["5", "10"],
};

const TRANSPARENT_IMAGE_BY_RATIO: Record<string, string> = {
  "16:9": "https://static.bestmaker.ai/transparent_images/transparent_16_9_1920x1080.png",
  "9:16": "https://static.bestmaker.ai/transparent_images/transparent_9_16_1080x1920.png",
  "1:1": "https://static.bestmaker.ai/transparent_images/transparent_1_1_1080x1080.png",
  "3:4": "https://static.bestmaker.ai/transparent_images/transparent_3_4_1200x1600.png",
  "4:3": "https://static.bestmaker.ai/transparent_images/transparent_4_3_1600x1200.png",
};

function getDefaultTransparentImage(aspectRatio?: string | null): string | undefined {
  if (!aspectRatio) {
    return TRANSPARENT_IMAGE_BY_RATIO["16:9"];
  }
  return TRANSPARENT_IMAGE_BY_RATIO[aspectRatio] ?? TRANSPARENT_IMAGE_BY_RATIO["16:9"];
}

async function ensureR2Url(
  source: string | undefined,
  kind: "primary" | "tail" | "intro" | "outro"
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

  const [, rawSubtype] = parsed.contentType.split("/");
  const normalizedSubtype = rawSubtype?.toLowerCase() ?? "";
  const extension = normalizedSubtype.includes("png")
    ? "png"
    : normalizedSubtype.includes("jpeg") || normalizedSubtype.includes("jpg")
      ? "jpg"
      : "png";

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

function ensureAllowedDuration(
  endpoint: string,
  durationNumber: number,
  durationString: string,
  resolution?: string
) {
  if (endpoint === "pixverse-v5" && resolution === "1080p" && durationNumber !== 5) {
    throw new Error("PixVerse V5 1080p 仅支持 5 秒时长");
  }

  const allowed = ENDPOINT_ALLOWED_DURATIONS[endpoint];
  if (!allowed) {
    return;
  }

  const matches = allowed.some((value) =>
    typeof value === "number" ? value === durationNumber : value === durationString
  );

  if (!matches) {
    throw new Error("所选模型暂不支持该视频时长");
  }
}

type BuildPayloadOptions = {
  endpoint: string;
  prompt?: string;
  promptOptimizer?: boolean;
  negativePrompt?: string;
  aspectRatio?: string;
  resolution?: string;
  durationNumber: number;
  durationString: string;
  imageUrl?: string;
  tailImageUrl?: string;
  introImageUrl?: string;
  outroImageUrl?: string;
  seed?: number;
  cfgScale?: number;
  staticMask?: string;
  dynamicMasks?: unknown;
  webhookUrl?: string;
};

function buildFreepikVideoPayload({
  endpoint,
  prompt,
  promptOptimizer,
  negativePrompt,
  aspectRatio,
  resolution,
  durationNumber,
  durationString,
  imageUrl,
  tailImageUrl,
  introImageUrl,
  outroImageUrl,
  seed,
  cfgScale,
  staticMask,
  dynamicMasks,
  webhookUrl,
}: BuildPayloadOptions): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  switch (endpoint) {
    case "minimax-hailuo-02-768p":
    case "minimax-hailuo-02-1080p": {
      if (!prompt) {
        throw new Error("Minimax 任务需要提供提示词");
      }
      payload.prompt = prompt;
      payload.duration = durationNumber;
      if (promptOptimizer) {
        payload.prompt_optimizer = true;
      }
      if (imageUrl) {
        payload.first_frame_image = imageUrl;
      }
      if (tailImageUrl) {
        payload.last_frame_image = tailImageUrl;
      }
      break;
    }
    case "kling-v2-1-master":
    case "kling-v2-5-pro":
    case "kling-v2-1-std": {
      if (!prompt && !imageUrl) {
        throw new Error("Kling 任务需要提示词或参考图");
      }
      if (prompt) {
        payload.prompt = prompt;
      }
      if (negativePrompt) {
        payload.negative_prompt = negativePrompt;
      }
      if (imageUrl) {
        payload.image = imageUrl;
      }
      if (tailImageUrl) {
        payload.image_tail = tailImageUrl;
      }
      if (!imageUrl && aspectRatio) {
        payload.aspect_ratio = toFreepikAspectRatio(aspectRatio);
      }
      payload.duration = durationString;
      payload.cfg_scale = typeof cfgScale === "number" ? cfgScale : 0.5;
      if (staticMask) {
        payload.static_mask = staticMask;
      }
      if (dynamicMasks) {
        payload.dynamic_masks = dynamicMasks;
      }
      break;
    }
    case "pixverse-v5": {
      if (!prompt) {
        throw new Error("PixVerse V5 需要提示词");
      }
      if (!imageUrl) {
        throw new Error("PixVerse V5 需要上传参考图");
      }
      if (!resolution) {
        throw new Error("PixVerse V5 需要选择分辨率");
      }
      payload.prompt = prompt;
      payload.image_url = imageUrl;
      payload.duration = durationNumber;
      payload.resolution = resolution;
      if (negativePrompt) {
        payload.negative_prompt = negativePrompt;
      }
      if (typeof seed === "number") {
        payload.seed = seed;
      }
      break;
    }
    case "pixverse-v5-transition": {
      if (!prompt) {
        throw new Error("PixVerse Transition 需要提示词");
      }
      if (!resolution) {
        throw new Error("PixVerse Transition 需要选择分辨率");
      }
      if (!introImageUrl || !outroImageUrl) {
        throw new Error("PixVerse Transition 需要首尾两张图片");
      }
      payload.prompt = prompt;
      payload.resolution = resolution;
      payload.duration = durationNumber;
      payload.first_image_url = introImageUrl;
      payload.last_image_url = outroImageUrl;
      if (negativePrompt) {
        payload.negative_prompt = negativePrompt;
      }
      if (typeof seed === "number") {
        payload.seed = seed;
      }
      break;
    }
    case "seedance-pro-1080p":
    case "seedance-pro-720p":
    case "seedance-pro-480p":
    case "seedance-lite-1080p":
    case "seedance-lite-720p":
    case "seedance-lite-480p": {
      if (!imageUrl) {
        throw new Error("Seedance 需要上传参考图");
      }
      if (!prompt) {
        throw new Error("Seedance 需要提示词");
      }
      payload.image = imageUrl;
      payload.prompt = prompt;
      payload.duration = durationString;
      if (aspectRatio) {
        payload.aspect_ratio = toFreepikAspectRatio(aspectRatio);
      }
      if (typeof seed === "number") {
        payload.seed = seed;
      }
      break;
    }
    case "wan-v2-2-720p":
    case "wan-v2-2-580p":
    case "wan-v2-2-480p": {
      if (!imageUrl) {
        throw new Error("Wan 需要上传参考图");
      }
      if (!prompt) {
        throw new Error("Wan 需要提示词");
      }
      payload.image = imageUrl;
      payload.prompt = prompt;
      payload.duration = durationString;
      payload.aspect_ratio = aspectRatio ? toFreepikAspectRatio(aspectRatio) : "auto";
      if (typeof seed === "number") {
        payload.seed = seed;
      }
      break;
    }
    default: {
      throw new Error(`暂不支持的 Freepik 视频模型：${endpoint}`);
    }
  }

  if (webhookUrl) {
    payload.webhook_url = webhookUrl;
  }

  return payload;
}

function normalizeSeed(value: ParsedRequest["seed"]): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseDuration(value?: string | number | null): { numberValue: number; stringValue: string } {
  if (value === undefined || value === null) {
    throw new Error("缺少视频时长配置");
  }

  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numberValue)) {
    throw new Error("视频时长格式不正确");
  }

  return {
    numberValue,
    stringValue: String(Math.trunc(numberValue)),
  };
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
  const mode = resolveMode(data);

  const prompt = data.prompt?.trim() ?? "";
  if (mode === "text" && !prompt) {
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

  const modelConfig = getVideoModelConfig(data.model);

  const apiModel = resolveVideoApiModel(data.model, data.resolution ?? null, data.api_model ?? null);
  if (!apiModel) {
    return apiResponse.badRequest("未找到对应的模型端点配置");
  }

  const durationSource = data.duration ?? data.video_length;
  let duration: { numberValue: number; stringValue: string };
  try {
    duration = parseDuration(durationSource ?? null);
  } catch (error: any) {
    return apiResponse.badRequest(error?.message ?? "Invalid duration");
  }

  try {
    ensureAllowedDuration(apiModel, duration.numberValue, duration.stringValue, data.resolution);
  } catch (error: any) {
    return apiResponse.badRequest(error?.message ?? "Unsupported duration");
  }

  const promptOptimizer = data.prompt_optimizer ?? (data.translate_prompt ?? false);

  const primaryInputSource = data.image_url ?? data.first_frame_image_url ?? null;
  const tailInputSource = data.tail_image_url ?? data.last_frame_image_url ?? null;
  const introInputSource = data.intro_image_url ?? null;
  const outroInputSource = data.outro_image_url ?? null;

  const primaryImageUrl =
    primaryInputSource ??
    (mode === "text" ? getDefaultTransparentImage(data.aspect_ratio) : undefined);
  const tailImageUrl = tailInputSource ?? undefined;
  const introImageUrl = introInputSource ?? undefined;
  const outroImageUrl = outroInputSource ?? undefined;
  const numericSeed = normalizeSeed(data.seed);

  const modalityCode: "t2v" | "i2v" = mode === "text" ? "t2v" : "i2v";

  const metadataJson = {
    source: "video",
    mode,
    translate_prompt: data.translate_prompt ?? false,
    prompt_optimizer: promptOptimizer,
    resolution: data.resolution ?? null,
    aspect_ratio: data.aspect_ratio ?? null,
    duration: duration.numberValue,
    api_model: apiModel,
    prompt: prompt,
    original_prompt: prompt,
    model_display_name: modelConfig.displayName,
    modality_code: modalityCode,
    credits_cost: modelConfig.creditsCost,
    reference_inputs: {
      primary: Boolean(primaryInputSource),
      tail: Boolean(tailInputSource),
      intro: Boolean(introInputSource),
      outro: Boolean(outroInputSource),
    },
  };

  const pricingSnapshot = {
    credits_cost: modelConfig.creditsCost,
    currency: "credits",
    captured_at: new Date().toISOString(),
  };

  const inputParams = {
    model: data.model,
    prompt: prompt || null,
    resolution: data.resolution ?? null,
    duration: duration.numberValue,
    aspect_ratio: data.aspect_ratio ?? null,
    mode,
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
    console.error("[freepik-video] failed to insert ai_jobs record", insertError);
    return apiResponse.serverError("Failed to create job record");
  }

  if (jobRecord.share_slug === null || jobRecord.share_slug === undefined) {
    const shareSlug = generateShareSlug();
    const publicTitle = prompt.length > 80 ? `${prompt.slice(0, 77)}...` : prompt;
    const publicSummary = `${modelConfig.displayName} • ${mode === "text" ? "Text to Video" : "Image to Video"}`;

    await adminSupabase
      .from("ai_jobs")
      .update({
        share_slug: shareSlug,
        public_title: publicTitle || modelConfig.displayName,
        public_summary: publicSummary,
        public_assets: [],
        is_public: true,
      })
      .eq("id", jobRecord.id);
  }

  const deduction = {
    wasCharged: false,
    amount: modelConfig.creditsCost,
  };
  let updatedBenefits: any = null;

  if (modelConfig.creditsCost > 0) {
    const deductionNote = `AI video generation - ${modelConfig.displayName}`;
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

  const webhookUrl = getWebhookUrl();

  let payload: Record<string, unknown>;
  let resolvedPrimaryImageUrl: string | undefined;
  let resolvedTailImageUrl: string | undefined;
  let resolvedIntroImageUrl: string | undefined;
  let resolvedOutroImageUrl: string | undefined;
  try {
    [
      resolvedPrimaryImageUrl,
      resolvedTailImageUrl,
      resolvedIntroImageUrl,
      resolvedOutroImageUrl,
    ] = await Promise.all([
      ensureR2Url(primaryImageUrl, "primary"),
      ensureR2Url(tailImageUrl, "tail"),
      ensureR2Url(introImageUrl, "intro"),
      ensureR2Url(outroImageUrl, "outro"),
    ]);

    payload = buildFreepikVideoPayload({
      endpoint: apiModel,
      prompt: prompt || undefined,
      promptOptimizer,
      negativePrompt: data.negative_prompt,
      aspectRatio: data.aspect_ratio,
      resolution: data.resolution,
      durationNumber: duration.numberValue,
      durationString: duration.stringValue,
      imageUrl: resolvedPrimaryImageUrl ?? undefined,
      tailImageUrl: resolvedTailImageUrl ?? undefined,
      introImageUrl: resolvedIntroImageUrl ?? undefined,
      outroImageUrl: resolvedOutroImageUrl ?? undefined,
      seed: numericSeed,
      cfgScale: data.cfg_scale,
      staticMask: data.static_mask,
      dynamicMasks: data.dynamic_masks,
      webhookUrl,
    });
  } catch (error: any) {
    await adminSupabase
      .from("ai_jobs")
      .update({
        status: "failed",
        error_message: error?.message ?? "Invalid payload",
      })
      .eq("id", jobRecord.id);

    if (deduction.wasCharged) {
      await refundCreditsForJob(adminSupabase, user.id, deduction.amount, jobRecord.id);
    }

    return apiResponse.badRequest(error?.message ?? "Invalid payload");
  }

  try {
    const inputRows: Database["public"]["Tables"]["ai_job_inputs"]["Insert"][] = [];
    let inputIndex = 0;

    const addInput = (url: string | null | undefined, source: string) => {
      if (!url) return;
      inputRows.push({
        job_id: jobRecord.id,
        index: inputIndex++,
        type: "image",
        source,
        url,
        metadata_json: {
          role: source,
          mode,
        },
      });
    };

    if (primaryInputSource) {
      addInput(resolvedPrimaryImageUrl, "primary");
    }
    if (tailInputSource) {
      addInput(resolvedTailImageUrl, "tail");
    }
    if (introInputSource) {
      addInput(resolvedIntroImageUrl, "intro");
    }
    if (outroInputSource) {
      addInput(resolvedOutroImageUrl, "outro");
    }

    if (inputRows.length > 0) {
      const { error: inputsError } = await adminSupabase.from("ai_job_inputs").insert(inputRows);
      if (inputsError) {
        console.error("[freepik-video] failed to record reference inputs", inputsError);
      }
    }

    console.log("[freepik-video] request payload", {
      endpoint: apiModel,
      payload,
    });
    const freepikResponse = (await createFreepikVideoTask(
      apiModel,
      payload
    )) as FreepikTaskResponse | Record<string, unknown> | null;

    console.log("[freepik-video] response", freepikResponse);
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
      event_type: "freepik_video_task_created",
      payload_json: freepikResponse,
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
    console.error("[freepik-video] task submission failed", error);

    let message = "Failed to submit Freepik video task";
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

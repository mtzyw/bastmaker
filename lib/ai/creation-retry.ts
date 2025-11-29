import { CreationItem, CreationOutput } from "@/lib/ai/creations";
import { DEFAULT_SOUND_EFFECT_MODEL, getSoundEffectModelConfig } from "@/lib/ai/sound-effect-config";
import { getTextToImageModelConfig } from "@/lib/ai/text-to-image-config";
import { getVideoCreditsCost, getVideoModelConfig } from "@/lib/ai/video-config";

export type RegenerationResultPayload = {
  jobId?: string | null;
  providerJobId?: string | null;
  status?: string | null;
  freepikStatus?: string | null;
  creditsCost?: number | null;
};

export type RegenerationPlan = {
  endpoint:
  | "/api/ai/freepik/tasks"
  | "/api/ai/freepik/video"
  | "/api/ai/freepik/sound"
  | "/api/ai/effects/video"
  | "/api/ai/effects/image";
  payload: Record<string, unknown>;
  optimisticItem: CreationItem;
  buildPersistedItem: (result: RegenerationResultPayload) => CreationItem;
};

export type RepromptDraft =
  | {
    kind: "text-to-image";
    route: "/text-to-image";
    prompt: string;
    translatePrompt: boolean;
    model: string;
    aspectRatio?: string | null;
    isPublic?: boolean;
  }
  | {
    kind: "image-to-image";
    route: "/image-to-image";
    prompt: string;
    translatePrompt: boolean;
    model: string;
    referenceImageUrls: string[];
    aspectRatio?: string | null;
    isPublic?: boolean;
  }
  | {
    kind: "text-to-video";
    route: "/text-to-video";
    prompt: string;
    translatePrompt: boolean;
    model: string;
    resolution?: string | null;
    videoLength?: string;
    duration?: number;
    aspectRatio?: string | null;
    isPublic?: boolean;
  }
  | {
    kind: "image-to-video";
    route: "/image-to-video";
    prompt: string;
    translatePrompt: boolean;
    model: string;
    mode: NormalizedVideoMode;
    resolution?: string | null;
    videoLength?: string;
    duration?: number;
    aspectRatio?: string | null;
    primaryImageUrl?: string | null;
    introImageUrl?: string | null;
    outroImageUrl?: string | null;
    tailImageUrl?: string | null;
    additionalAssets?: Record<string, string>;
    isPublic?: boolean;
  }
  | {
    kind: "sound-effects";
    route: "/sound-generation";
    prompt: string;
    translatePrompt: boolean;
    durationSeconds?: number;
    loop?: boolean;
    promptInfluence?: number;
    isPublic?: boolean;
  };

type NormalizedVideoMode = "text" | "image" | "transition";

export function buildRegenerationPlan(item: CreationItem): RegenerationPlan {
  const effectSlug = getString(item.metadata?.effect_slug ?? item.inputParams?.effect_slug);
  if (effectSlug) {
    const source = getString(item.metadata?.source);
    if (source === "image-effect") {
      return buildImageEffectPlan(item, effectSlug);
    }
    return buildVideoEffectPlan(item, effectSlug);
  }

  const modality = getString(item.modalityCode ?? item.metadata?.modality_code);
  const source = getString(item.metadata?.source);
  const mode = getString(item.metadata?.mode ?? item.inputParams?.mode) as NormalizedVideoMode | undefined;
  if (source === "lip-sync") {
    throw new Error("当前暂不支持对口型任务的重新生成");
  }

  const isVideoLike =
    source === "video" ||
    modality === "t2v" ||
    modality === "i2v" ||
    mode === "text" ||
    mode === "image" ||
    mode === "transition";
  const isImageGenerationLike = source === "text-to-image" || source === "image-to-image" || modality === "t2i" || modality === "i2i";
  const isSoundLike = source === "sound" || modality === "t2a";

  if (isSoundLike) {
    return buildSoundEffectPlan(item);
  }

  if (!isVideoLike && (source === "image-to-image" || modality === "i2i" || (item.isImageToImage && isImageGenerationLike))) {
    return buildImageToImagePlan(item);
  }

  if (!isVideoLike && (source === "text-to-image" || modality === "t2i" || isImageGenerationLike)) {
    return buildTextToImagePlan(item);
  }

  if (isVideoLike) {
    const resolvedMode: NormalizedVideoMode =
      mode === "image" || mode === "transition"
        ? mode
        : modality === "i2v" || hasVideoReferenceImages(item)
          ? "image"
          : "text";

    if (resolvedMode === "text") {
      return buildTextToVideoPlan(item);
    }
    return buildImageToVideoPlan(item, resolvedMode);
  }

  throw new Error("暂不支持该类型任务的重新生成");
}

export function buildRepromptDraft(item: CreationItem): RepromptDraft {
  const effectSlug = getString(item.metadata?.effect_slug ?? item.inputParams?.effect_slug);
  if (effectSlug) {
    throw new Error("特效任务暂不支持重新编辑");
  }

  const modality = getString(item.modalityCode ?? item.metadata?.modality_code);
  const source = getString(item.metadata?.source);
  const mode = getString(item.metadata?.mode ?? item.inputParams?.mode) as NormalizedVideoMode | undefined;
  const isVideoLike =
    source === "video" ||
    modality === "t2v" ||
    modality === "i2v" ||
    mode === "text" ||
    mode === "image" ||
    mode === "transition";
  const isImageGenerationLike =
    source === "text-to-image" || source === "image-to-image" || modality === "t2i" || modality === "i2i";
  const isSoundLike = source === "sound" || modality === "t2a";

  if (isSoundLike) {
    return buildSoundEffectReprompt(item);
  }

  if (!isVideoLike && (source === "image-to-image" || modality === "i2i" || (item.isImageToImage && isImageGenerationLike))) {
    return buildImageToImageReprompt(item);
  }

  if (!isVideoLike && (source === "text-to-image" || modality === "t2i" || isImageGenerationLike)) {
    return buildTextToImageReprompt(item);
  }

  if (isVideoLike) {
    const resolvedMode: NormalizedVideoMode =
      mode === "image" || mode === "transition"
        ? mode
        : modality === "i2v" || hasVideoReferenceImages(item)
          ? "image"
          : "text";

    if (resolvedMode === "text") {
      return buildTextToVideoReprompt(item);
    }
    return buildImageToVideoReprompt(item, resolvedMode);
  }

  throw new Error("暂不支持该类型任务的重新编辑");
}

function buildTextToImagePlan(item: CreationItem): RegenerationPlan {
  const model = resolveTextToImageModel(item);
  const prompt = getString(item.inputParams?.prompt ?? item.metadata?.prompt);
  if (!prompt) {
    throw new Error("原始任务缺少提示词，无法重新生成");
  }

  const aspectRatio = getString(item.inputParams?.aspect_ratio);
  const translatePrompt = getBoolean(item.metadata?.translate_prompt ?? item.inputParams?.translate_prompt);
  const isPublic = getBoolean(item.metadata?.is_public, true);
  const referenceImageUrls = extractReferenceImageUrls(item);

  const payload: Record<string, unknown> = {
    model,
    prompt,
    aspect_ratio: aspectRatio ?? undefined,
    translate_prompt: translatePrompt,
    is_public: isPublic,
    reference_images: referenceImageUrls.length > 0 ? referenceImageUrls : undefined,
  };

  const modelConfig = safeGetTextToImageConfig(model);
  const optimistic = makeBaseOptimisticItem(item, {
    jobId: generateTempJobId(),
    modelSlug: model,
    providerCode: modelConfig?.providerCode ?? item.providerCode,
    costCredits: modelConfig?.creditsCost ?? item.costCredits ?? 0,
    metadata: {
      source: referenceImageUrls.length > 0 ? "image-to-image" : "text-to-image",
      translate_prompt: translatePrompt,
      is_image_to_image: referenceImageUrls.length > 0,
      reference_image_count: referenceImageUrls.length,
      reference_image_urls: referenceImageUrls,
      primary_image_url: referenceImageUrls[0] ?? null,
      is_public: isPublic,
      prompt,
      original_prompt: prompt,
      model_display_name: modelConfig?.displayName ?? item.metadata?.model_display_name ?? null,
    },
    inputParams: {
      model,
      prompt,
      aspect_ratio: aspectRatio ?? null,
      reference_image_count: referenceImageUrls.length,
      reference_image_urls: referenceImageUrls,
      primary_image_url: referenceImageUrls[0] ?? null,
      is_public: isPublic,
    },
    modalityCode: referenceImageUrls.length > 0 ? "i2i" : "t2i",
    isImageToImage: referenceImageUrls.length > 0,
    referenceImageCount: referenceImageUrls.length,
  });

  return {
    endpoint: "/api/ai/freepik/tasks",
    payload: removeUndefined(payload),
    optimisticItem: optimistic,
    buildPersistedItem: (result) =>
      buildPersistedFromOptimistic(optimistic, result, {
        metadata: {
          freepik_initial_status: optimistic.metadata.freepik_initial_status ?? "processing",
        },
      }),
  };
}

function buildImageToImagePlan(item: CreationItem): RegenerationPlan {
  const model = resolveTextToImageModel(item);
  const prompt = getString(item.inputParams?.prompt ?? item.metadata?.prompt);
  if (!prompt) {
    throw new Error("原始任务缺少提示词，无法重新生成");
  }

  const referenceImageUrls = extractReferenceImageUrls(item);
  if (referenceImageUrls.length === 0) {
    throw new Error("原始任务缺少参考图，无法重新生成");
  }

  const translatePrompt = getBoolean(item.metadata?.translate_prompt ?? item.inputParams?.translate_prompt);
  const isPublic = getBoolean(item.metadata?.is_public, true);

  const payload: Record<string, unknown> = {
    model,
    prompt,
    reference_images: referenceImageUrls,
    translate_prompt: translatePrompt,
    is_public: isPublic,
  };

  const modelConfig = safeGetTextToImageConfig(model);
  const optimistic = makeBaseOptimisticItem(item, {
    jobId: generateTempJobId(),
    modelSlug: model,
    providerCode: modelConfig?.providerCode ?? item.providerCode,
    costCredits: modelConfig?.creditsCost ?? item.costCredits ?? 0,
    metadata: {
      source: "image-to-image",
      translate_prompt: translatePrompt,
      is_image_to_image: true,
      reference_image_count: referenceImageUrls.length,
      reference_image_urls: referenceImageUrls,
      primary_image_url: referenceImageUrls[0] ?? null,
      is_public: isPublic,
      prompt,
      original_prompt: prompt,
      model_display_name: modelConfig?.displayName ?? item.metadata?.model_display_name ?? null,
    },
    inputParams: {
      model,
      prompt,
      reference_image_count: referenceImageUrls.length,
      reference_image_urls: referenceImageUrls,
      primary_image_url: referenceImageUrls[0] ?? null,
      is_public: isPublic,
    },
    modalityCode: "i2i",
    isImageToImage: true,
    referenceImageCount: referenceImageUrls.length,
  });

  return {
    endpoint: "/api/ai/freepik/tasks",
    payload: removeUndefined(payload),
    optimisticItem: optimistic,
    buildPersistedItem: (result) =>
      buildPersistedFromOptimistic(optimistic, result, {
        metadata: {
          freepik_initial_status: optimistic.metadata.freepik_initial_status ?? "processing",
        },
      }),
  };
}

function buildSoundEffectPlan(item: CreationItem): RegenerationPlan {
  const model =
    getString(item.inputParams?.model ?? item.modelSlug ?? DEFAULT_SOUND_EFFECT_MODEL) ??
    DEFAULT_SOUND_EFFECT_MODEL;
  const prompt =
    getString(item.inputParams?.text ?? item.inputParams?.prompt ?? item.metadata?.prompt) ??
    getString(item.metadata?.original_prompt);
  if (!prompt) {
    throw new Error("原始任务缺少提示词，无法重新生成");
  }

  const translatePrompt = getBoolean(
    item.metadata?.translate_prompt ?? item.inputParams?.translate_prompt
  );
  const durationValue = normalizeNumber(
    item.inputParams?.duration_seconds ?? item.metadata?.duration_seconds ?? item.metadata?.duration
  );
  const loop = getBoolean(item.inputParams?.loop ?? item.metadata?.loop);
  const influenceValue = normalizeNumber(
    item.inputParams?.prompt_influence ?? item.metadata?.prompt_influence
  );
  const config = safeGetSoundConfig(model);
  const durationSeconds = clampNumber(
    durationValue ?? config.defaultDurationSeconds,
    0.5,
    22
  );
  const promptInfluence =
    influenceValue != null ? clampNumber(influenceValue, 0, 1) : config.defaultPromptInfluence;
  const isPublic = getBoolean(item.metadata?.is_public, true);

  const payload: Record<string, unknown> = {
    model,
    text: prompt,
    duration_seconds: durationSeconds,
    loop,
    prompt_influence: promptInfluence,
    translate_prompt: translatePrompt,
    is_public: isPublic,
  };

  const optimistic = makeBaseOptimisticItem(item, {
    jobId: generateTempJobId(),
    modelSlug: model,
    providerCode: config.providerCode,
    costCredits: config.creditsCost,
    metadata: {
      source: "sound",
      mode: "text",
      translate_prompt: translatePrompt,
      credits_cost: config.creditsCost,
      prompt,
      original_prompt: prompt,
      duration_seconds: durationSeconds,
      loop,
      prompt_influence: promptInfluence,
      modality_code: config.defaultModality,
      model_display_name: config.displayName,
      is_public: isPublic,
    },
    inputParams: {
      model,
      text: prompt,
      duration_seconds: durationSeconds,
      loop,
      prompt_influence: promptInfluence,
      is_public: isPublic,
    },
    modalityCode: config.defaultModality,
    isImageToImage: false,
    referenceImageCount: 0,
  });

  return {
    endpoint: "/api/ai/freepik/sound",
    payload: removeUndefined(payload),
    optimisticItem: optimistic,
    buildPersistedItem: (result) =>
      buildPersistedFromOptimistic(optimistic, result, {
        metadata: {
          freepik_initial_status: optimistic.metadata.freepik_initial_status ?? "processing",
        },
      }),
  };
}

function buildTextToVideoPlan(item: CreationItem): RegenerationPlan {
  const model = resolveVideoModel(item);
  const prompt = getString(item.inputParams?.prompt ?? item.metadata?.prompt);
  if (!prompt) {
    throw new Error("原始任务缺少提示词，无法重新生成");
  }

  const translatePrompt = getBoolean(item.metadata?.translate_prompt ?? item.inputParams?.translate_prompt);
  const resolution = getString(item.inputParams?.resolution ?? item.metadata?.resolution);
  const aspectRatio = getString(item.inputParams?.aspect_ratio ?? item.metadata?.aspect_ratio);
  const durationNumber = normalizeNumber(item.inputParams?.duration ?? item.metadata?.duration);
  if (durationNumber == null) {
    throw new Error("原始任务缺少视频时长，无法重新生成");
  }
  const videoLength = item.inputParams?.video_length ?? String(durationNumber);
  const isPublic = getBoolean(item.metadata?.is_public, true);

  const payload: Record<string, unknown> = {
    mode: "text",
    model,
    prompt,
    translate_prompt: translatePrompt,
    resolution: resolution ?? undefined,
    video_length: videoLength,
    duration: durationNumber,
    aspect_ratio: aspectRatio ?? undefined,
    is_public: isPublic,
  };

  const modelConfig = safeGetVideoConfig(model);
  const estimatedCredits = getVideoCreditsCost(model, resolution ?? undefined, videoLength);
  const optimistic = makeBaseOptimisticItem(item, {
    jobId: generateTempJobId(),
    modelSlug: model,
    providerCode: modelConfig?.providerCode ?? item.providerCode,
    costCredits: estimatedCredits,
    metadata: {
      source: "video",
      mode: "text",
      translate_prompt: translatePrompt,
      resolution,
      aspect_ratio: aspectRatio ?? null,
      duration: durationNumber,
      reference_inputs: { primary: false, intro: false, outro: false, tail: false },
      reference_image_count: 0,
      reference_image_urls: [],
      is_image_to_image: false,
      prompt,
      original_prompt: prompt,
      model_display_name: modelConfig?.displayName ?? item.metadata?.model_display_name ?? null,
      is_public: isPublic,
      credits_cost: estimatedCredits,
    },
    inputParams: {
      model,
      prompt,
      translate_prompt: translatePrompt,
      resolution,
      video_length: videoLength,
      duration: durationNumber,
      aspect_ratio: aspectRatio ?? null,
      mode: "text",
      reference_image_urls: [],
      primary_image_url: null,
      is_public: isPublic,
    },
    modalityCode: "t2v",
    isImageToImage: false,
    referenceImageCount: 0,
  });

  return {
    endpoint: "/api/ai/freepik/video",
    payload: removeUndefined(payload),
    optimisticItem: optimistic,
    buildPersistedItem: (result) =>
      buildPersistedFromOptimistic(optimistic, result, {
        metadata: {
          freepik_initial_status: optimistic.metadata.freepik_initial_status ?? "processing",
        },
      }),
  };
}

function buildImageToVideoPlan(item: CreationItem, mode: NormalizedVideoMode): RegenerationPlan {
  const model = resolveVideoModel(item);
  const prompt = getString(item.inputParams?.prompt ?? item.metadata?.prompt);
  if (!prompt) {
    throw new Error("原始任务缺少提示词，无法重新生成");
  }

  const translatePrompt = getBoolean(item.metadata?.translate_prompt ?? item.inputParams?.translate_prompt);
  const resolution = getString(item.inputParams?.resolution ?? item.metadata?.resolution);
  const aspectRatio = getString(item.inputParams?.aspect_ratio ?? item.metadata?.aspect_ratio);
  const durationNumber = normalizeNumber(item.inputParams?.duration ?? item.metadata?.duration);
  if (durationNumber == null) {
    throw new Error("原始任务缺少视频时长，无法重新生成");
  }
  const videoLength = item.inputParams?.video_length ?? String(durationNumber);

  const primaryImageUrl =
    getString(item.inputParams?.image_url ?? item.inputParams?.primary_image_url ?? item.metadata?.primary_image_url) ??
    getFirstReferenceImage(item);
  const introImageUrl = getString(item.inputParams?.intro_image_url);
  const outroImageUrl = getString(item.inputParams?.outro_image_url);
  const tailImageUrl =
    getString(item.inputParams?.tail_image_url ?? item.inputParams?.last_frame_image_url) ?? undefined;

  if (mode === "image" && !primaryImageUrl) {
    throw new Error("原始任务缺少参考图片，无法重新生成");
  }
  if (mode === "transition" && (!introImageUrl || !outroImageUrl)) {
    throw new Error("原始任务缺少首尾图片，无法重新生成");
  }
  const isPublic = getBoolean(item.metadata?.is_public, true);

  const payload: Record<string, unknown> = {
    mode,
    model,
    prompt,
    translate_prompt: translatePrompt,
    resolution: resolution ?? undefined,
    video_length: videoLength,
    duration: durationNumber,
    aspect_ratio: aspectRatio ?? undefined,
    image_url: primaryImageUrl ?? undefined,
    first_frame_image_url: primaryImageUrl ?? undefined,
    intro_image_url: introImageUrl ?? undefined,
    outro_image_url: outroImageUrl ?? undefined,
    tail_image_url: tailImageUrl ?? undefined,
    is_public: isPublic,
  };

  const referenceInputs = {
    primary: Boolean(primaryImageUrl),
    intro: Boolean(introImageUrl),
    outro: Boolean(outroImageUrl),
    tail: Boolean(tailImageUrl),
  };
  const referenceImageUrls = extractReferenceImageUrls(item);
  const referenceCount = Object.values(referenceInputs).filter(Boolean).length || referenceImageUrls.length;

  const modelConfig = safeGetVideoConfig(model);
  const estimatedCredits = getVideoCreditsCost(model, resolution ?? undefined, videoLength);
  const optimistic = makeBaseOptimisticItem(item, {
    jobId: generateTempJobId(),
    modelSlug: model,
    providerCode: modelConfig?.providerCode ?? item.providerCode,
    costCredits: estimatedCredits,
    metadata: {
      source: "video",
      mode,
      translate_prompt: translatePrompt,
      resolution,
      aspect_ratio: aspectRatio ?? null,
      duration: durationNumber,
      reference_inputs: referenceInputs,
      reference_image_count: referenceCount,
      reference_image_urls: referenceImageUrls.length > 0 ? referenceImageUrls : buildReferenceList(referenceInputs, {
        primary: primaryImageUrl,
        intro: introImageUrl,
        outro: outroImageUrl,
        tail: tailImageUrl,
      }),
      primary_image_url: primaryImageUrl ?? null,
      prompt,
      original_prompt: prompt,
      model_display_name: modelConfig?.displayName ?? item.metadata?.model_display_name ?? null,
      is_public: isPublic,
      credits_cost: estimatedCredits,
    },
    inputParams: {
      model,
      prompt,
      translate_prompt: translatePrompt,
      resolution,
      video_length: videoLength,
      duration: durationNumber,
      aspect_ratio: aspectRatio ?? null,
      mode,
      image_url: primaryImageUrl ?? null,
      first_frame_image_url: primaryImageUrl ?? null,
      intro_image_url: introImageUrl ?? null,
      outro_image_url: outroImageUrl ?? null,
      tail_image_url: tailImageUrl ?? null,
      reference_image_urls: buildReferenceList(referenceInputs, {
        primary: primaryImageUrl,
        intro: introImageUrl,
        outro: outroImageUrl,
        tail: tailImageUrl,
      }),
      primary_image_url: primaryImageUrl ?? null,
      is_public: isPublic,
    },
    modalityCode: "i2v",
    isImageToImage: true,
    referenceImageCount: referenceCount,
  });

  return {
    endpoint: "/api/ai/freepik/video",
    payload: removeUndefined(payload),
    optimisticItem: optimistic,
    buildPersistedItem: (result) =>
      buildPersistedFromOptimistic(optimistic, result, {
        metadata: {
          freepik_initial_status: optimistic.metadata.freepik_initial_status ?? "processing",
        },
      }),
  };
}

function buildTextToImageReprompt(item: CreationItem): RepromptDraft {
  const model = resolveTextToImageModel(item);
  const prompt = getString(item.inputParams?.prompt ?? item.metadata?.prompt);
  if (!prompt) {
    throw new Error("原始任务缺少提示词，无法重新编辑");
  }
  const translatePromptValue = item.metadata?.translate_prompt ?? item.inputParams?.translate_prompt;
  const aspectRatio = getString(item.inputParams?.aspect_ratio ?? item.metadata?.aspect_ratio);
  const isPublicValue = item.metadata?.is_public;

  return {
    kind: "text-to-image",
    route: "/text-to-image",
    prompt,
    translatePrompt: typeof translatePromptValue === "boolean" ? translatePromptValue : false,
    model: resolveTextToImageUiModel(model, item),
    aspectRatio: aspectRatio ?? undefined,
    isPublic: typeof isPublicValue === "boolean" ? isPublicValue : undefined,
  };
}

function buildImageToImageReprompt(item: CreationItem): RepromptDraft {
  const model = resolveTextToImageModel(item);
  const prompt = getString(item.inputParams?.prompt ?? item.metadata?.prompt);
  if (!prompt) {
    throw new Error("原始任务缺少提示词，无法重新编辑");
  }
  const translatePromptValue = item.metadata?.translate_prompt ?? item.inputParams?.translate_prompt;
  const referenceImageUrls = extractReferenceImageUrls(item);
  const isPublicValue = item.metadata?.is_public;

  return {
    kind: "image-to-image",
    route: "/image-to-image",
    prompt,
    translatePrompt: typeof translatePromptValue === "boolean" ? translatePromptValue : false,
    model: resolveTextToImageUiModel(model, item),
    referenceImageUrls,
    aspectRatio: getString(item.inputParams?.aspect_ratio ?? item.metadata?.aspect_ratio) ?? undefined,
    isPublic: typeof isPublicValue === "boolean" ? isPublicValue : undefined,
  };
}

function buildTextToVideoReprompt(item: CreationItem): RepromptDraft {
  const model = resolveVideoModel(item);
  const prompt = getString(item.inputParams?.prompt ?? item.metadata?.prompt);
  if (!prompt) {
    throw new Error("原始任务缺少提示词，无法重新编辑");
  }

  const translatePromptValue = item.metadata?.translate_prompt ?? item.inputParams?.translate_prompt;
  const resolution = getString(item.inputParams?.resolution ?? item.metadata?.resolution);
  const aspectRatio = getString(item.inputParams?.aspect_ratio ?? item.metadata?.aspect_ratio);
  const durationNumber = normalizeNumber(item.inputParams?.duration ?? item.metadata?.duration);
  const videoLengthRaw = item.inputParams?.video_length ?? (durationNumber != null ? String(Math.trunc(durationNumber)) : undefined);
  const isPublicValue = item.metadata?.is_public;

  return {
    kind: "text-to-video",
    route: "/text-to-video",
    prompt,
    translatePrompt: typeof translatePromptValue === "boolean" ? translatePromptValue : false,
    model: resolveVideoUiModel(model, item),
    resolution: resolution ?? undefined,
    videoLength: videoLengthRaw ?? undefined,
    duration: durationNumber ?? undefined,
    aspectRatio: aspectRatio ?? undefined,
    isPublic: typeof isPublicValue === "boolean" ? isPublicValue : undefined,
  };
}

function buildImageToVideoReprompt(item: CreationItem, mode: NormalizedVideoMode): RepromptDraft {
  const model = resolveVideoModel(item);
  const prompt = getString(item.inputParams?.prompt ?? item.metadata?.prompt);
  if (!prompt) {
    throw new Error("原始任务缺少提示词，无法重新编辑");
  }

  const translatePromptValue = item.metadata?.translate_prompt ?? item.inputParams?.translate_prompt;
  const resolution = getString(item.inputParams?.resolution ?? item.metadata?.resolution);
  const aspectRatio = getString(item.inputParams?.aspect_ratio ?? item.metadata?.aspect_ratio);
  const durationNumber = normalizeNumber(item.inputParams?.duration ?? item.metadata?.duration);
  const videoLengthRaw = item.inputParams?.video_length ?? (durationNumber != null ? String(Math.trunc(durationNumber)) : undefined);
  const isPublicValue = item.metadata?.is_public;

  const assets = buildEffectAssets(item);
  const primaryImageUrl =
    assets.primary?.url ??
    getString(item.inputParams?.image_url ?? item.inputParams?.primary_image_url ?? item.metadata?.primary_image_url) ??
    getFirstReferenceImage(item);

  const additionalAssets = pickAdditionalAssets(assets);

  return {
    kind: "image-to-video",
    route: "/image-to-video",
    prompt,
    translatePrompt: typeof translatePromptValue === "boolean" ? translatePromptValue : false,
    model: resolveVideoUiModel(model, item),
    mode,
    resolution: resolution ?? undefined,
    videoLength: videoLengthRaw ?? undefined,
    duration: durationNumber ?? undefined,
    aspectRatio: aspectRatio ?? undefined,
    primaryImageUrl: primaryImageUrl ?? null,
    introImageUrl: assets.intro?.url ?? null,
    outroImageUrl: assets.outro?.url ?? null,
    tailImageUrl: assets.tail?.url ?? null,
    additionalAssets: Object.keys(additionalAssets).length > 0 ? additionalAssets : undefined,
    isPublic: typeof isPublicValue === "boolean" ? isPublicValue : undefined,
  };
}

function buildSoundEffectReprompt(item: CreationItem): RepromptDraft {
  const prompt =
    getString(item.inputParams?.text ?? item.inputParams?.prompt ?? item.metadata?.prompt) ??
    getString(item.metadata?.original_prompt);
  if (!prompt) {
    throw new Error("原始任务缺少提示词，无法重新编辑");
  }

  const translatePromptValue = item.metadata?.translate_prompt ?? item.inputParams?.translate_prompt;
  const durationValue = normalizeNumber(
    item.inputParams?.duration_seconds ?? item.metadata?.duration_seconds ?? item.metadata?.duration
  );
  const loopValue = item.inputParams?.loop ?? item.metadata?.loop;
  const influenceValue = normalizeNumber(
    item.inputParams?.prompt_influence ?? item.metadata?.prompt_influence
  );
  const isPublicValue = item.metadata?.is_public;

  return {
    kind: "sound-effects",
    route: "/sound-generation",
    prompt,
    translatePrompt: typeof translatePromptValue === "boolean" ? translatePromptValue : false,
    durationSeconds: durationValue ?? undefined,
    loop: typeof loopValue === "boolean" ? loopValue : undefined,
    promptInfluence: influenceValue != null ? clampNumber(influenceValue, 0, 1) : undefined,
    isPublic: typeof isPublicValue === "boolean" ? isPublicValue : undefined,
  };
}

type EffectAssets = Record<string, { url: string }>;

function buildVideoEffectPlan(item: CreationItem, effectSlug: string): RegenerationPlan {
  const assets = buildEffectAssets(item);

  const primaryAsset = assets.primary;
  if (!primaryAsset) {
    throw new Error("原始特效任务缺少素材，无法重新生成");
  }

  const isPublic = getBoolean(item.metadata?.is_public, true);
  const variables = extractEffectVariables(item);
  const payload: Record<string, unknown> = {
    effect_slug: effectSlug,
    assets,
    image_url: primaryAsset.url,
    is_public: isPublic,
  };
  if (variables) {
    payload.variables = variables;
  }

  const referenceImageUrls = Object.values(assets)
    .map(({ url }) => url)
    .filter((url) => typeof url === "string" && url.length > 0);

  const referenceInputs = Object.fromEntries(
    Object.keys(assets).map((slot) => [slot, true])
  );

  const referenceImageCount = referenceImageUrls.length;

  const metadataOverrides: Record<string, unknown> = {
    source: "video",
    modality_code: item.modalityCode ?? item.metadata?.modality_code ?? "i2v",
    reference_inputs: referenceInputs,
    reference_image_count: referenceImageCount,
    reference_image_urls: referenceImageUrls,
    primary_image_url: primaryAsset.url,
    is_public: isPublic,
  };
  const effectTitle = getString(item.metadata?.effect_title ?? item.inputParams?.effect_title);
  if (effectTitle) {
    metadataOverrides.effect_title = effectTitle;
  }
  metadataOverrides.effect_slug = effectSlug;

  const inputOverrides: Record<string, unknown> = {
    effect_slug: effectSlug,
    reference_image_urls: referenceImageUrls,
    image_url: primaryAsset.url,
    primary_image_url: primaryAsset.url,
    ...mapEffectAssetsToInputParams(assets),
    is_public: isPublic,
  };
  if (variables) {
    inputOverrides.variables = variables;
  }

  const optimistic = makeBaseOptimisticItem(item, {
    jobId: generateTempJobId(),
    modelSlug: item.modelSlug,
    providerCode: item.providerCode,
    costCredits: item.costCredits,
    metadata: metadataOverrides,
    inputParams: inputOverrides,
    modalityCode: item.modalityCode ?? "i2v",
    isImageToImage: (item.modalityCode ?? item.metadata?.modality_code) === "i2v",
    referenceImageCount,
  });

  return {
    endpoint: "/api/ai/effects/video",
    payload,
    optimisticItem: optimistic,
    buildPersistedItem: (result) =>
      buildPersistedFromOptimistic(optimistic, result, {
        metadata: {
          freepik_initial_status: optimistic.metadata.freepik_initial_status ?? "processing",
        },
      }),
  };
}

function buildImageEffectPlan(item: CreationItem, effectSlug: string): RegenerationPlan {
  const assets = buildEffectAssets(item);

  const primaryAsset = assets.primary;
  if (!primaryAsset) {
    throw new Error("原始图片特效任务缺少素材，无法重新生成");
  }

  const prompt = getString(item.metadata?.prompt ?? item.inputParams?.prompt);
  if (!prompt) {
    throw new Error("原始任务缺少提示词，无法重新生成");
  }

  const negativePrompt = getString(item.metadata?.negative_prompt ?? item.inputParams?.negative_prompt);
  const aspectRatio = getString(item.metadata?.aspect_ratio ?? item.inputParams?.aspect_ratio);
  const translatePrompt = getBoolean(item.metadata?.translate_prompt ?? item.inputParams?.translate_prompt);
  const isPublic = getBoolean(item.metadata?.is_public, true);
  const variables = extractEffectVariables(item);

  const referenceImageUrls = Object.values(assets)
    .map(({ url }) => url)
    .filter((url) => typeof url === "string" && url.length > 0);

  const referenceInputs = Object.fromEntries(
    Object.keys(assets).map((slot) => [slot, true])
  );
  const referenceImageCount = referenceImageUrls.length;

  const metadataOverrides: Record<string, unknown> = {
    source: "image-effect",
    modality_code: "i2i",
    effect_slug: effectSlug,
    effect_title: item.metadata?.effect_title ?? item.inputParams?.effect_title ?? null,
    prompt,
    negative_prompt: negativePrompt ?? null,
    aspect_ratio: aspectRatio ?? null,
    translate_prompt: translatePrompt,
    reference_inputs: referenceInputs,
    reference_image_count: referenceImageCount,
    reference_image_urls: referenceImageUrls,
    primary_image_url: primaryAsset.url,
    is_public: isPublic,
  };

  if (variables) {
    metadataOverrides.variables = variables;
  }

  const inputOverrides: Record<string, unknown> = {
    effect_slug: effectSlug,
    prompt,
    negative_prompt: negativePrompt ?? null,
    aspect_ratio: aspectRatio ?? null,
    translate_prompt: translatePrompt,
    reference_image_urls: referenceImageUrls,
    primary_image_url: primaryAsset.url,
    ...mapEffectAssetsToInputParams(assets),
    is_public: isPublic,
  };

  if (variables) {
    inputOverrides.variables = variables;
  }

  const optimistic = makeBaseOptimisticItem(item, {
    jobId: generateTempJobId(),
    modelSlug: item.modelSlug,
    providerCode: item.providerCode,
    costCredits: item.costCredits,
    metadata: metadataOverrides,
    inputParams: inputOverrides,
    modalityCode: "i2i",
    isImageToImage: true,
    referenceImageCount,
  });

  const payload: Record<string, unknown> = {
    effect_slug: effectSlug,
    assets,
    prompt,
    negative_prompt: negativePrompt ?? undefined,
    aspect_ratio: aspectRatio ?? undefined,
    translate_prompt: translatePrompt,
    is_public: isPublic,
  };
  if (variables) {
    payload.variables = variables;
  }

  return {
    endpoint: "/api/ai/effects/image",
    payload: removeUndefined(payload),
    optimisticItem: optimistic,
    buildPersistedItem: (result) =>
      buildPersistedFromOptimistic(optimistic, result, {
        metadata: {
          freepik_initial_status: optimistic.metadata.freepik_initial_status ?? "processing",
        },
      }),
  };
}

function makeBaseOptimisticItem(
  original: CreationItem,
  overrides: {
    jobId: string;
    modelSlug: string | null;
    providerCode?: string | null;
    costCredits?: number;
    metadata: Record<string, unknown>;
    inputParams: Record<string, unknown>;
    modalityCode: string | null;
    isImageToImage: boolean;
    referenceImageCount: number;
  }
): CreationItem {
  const metadata: Record<string, any> = {
    ...cloneRecord(original.metadata ?? {}),
    ...overrides.metadata,
    credits_cost: overrides.costCredits ?? original.costCredits ?? overrides.metadata?.["credits_cost"] ?? 0,
    freepik_initial_status: "processing",
    freepik_latest_status: "processing",
    freepik_task_id: null,
    error_message: null,
    retry_source: original.jobId,
  };

  const inputParams = {
    ...cloneRecord(original.inputParams ?? {}),
    ...overrides.inputParams,
  };

  return {
    jobId: overrides.jobId,
    providerCode: overrides.providerCode ?? original.providerCode ?? null,
    providerJobId: null,
    status: "processing",
    latestStatus: "processing",
    createdAt: new Date().toISOString(),
    costCredits: overrides.costCredits ?? original.costCredits ?? 0,
    outputs: [] as CreationOutput[],
    metadata,
    inputParams,
    modalityCode: overrides.modalityCode,
    modelSlug: overrides.modelSlug,
    errorMessage: null,
    seed: original.seed ?? null,
    isImageToImage: overrides.isImageToImage,
    referenceImageCount: overrides.referenceImageCount,
    shareSlug: null,
    shareVisitCount: 0,
    shareConversionCount: 0,
    publicTitle: null,
    publicSummary: null,
  };
}

function buildPersistedFromOptimistic(
  optimistic: CreationItem,
  result: RegenerationResultPayload,
  extras?: { metadata?: Record<string, unknown> }
): CreationItem {
  const normalizedStatus = getString(result.status) ?? "processing";
  const normalizedLatest = getString(result.freepikStatus ?? result.status) ?? normalizedStatus;
  const creditsCost = typeof result.creditsCost === "number" ? result.creditsCost : optimistic.costCredits;

  const metadata: Record<string, any> = {
    ...cloneRecord(optimistic.metadata),
    ...cloneRecord(extras?.metadata ?? {}),
    freepik_latest_status: normalizedLatest,
    freepik_task_id: result.providerJobId ?? null,
    credits_cost: creditsCost,
  };

  if (normalizedStatus !== "failed") {
    delete metadata.error_message;
  }

  return {
    ...optimistic,
    jobId: result.jobId ?? optimistic.jobId,
    providerJobId: result.providerJobId ?? null,
    status: normalizedStatus,
    latestStatus: normalizedLatest,
    costCredits: creditsCost,
    metadata,
  };
}

function buildEffectAssets(item: CreationItem): EffectAssets {
  const assets: EffectAssets = {};
  const addAsset = (slot: string, value: unknown) => {
    const url = getString(value);
    if (url) {
      assets[slot] = { url };
    }
  };

  const referenceUrls = extractReferenceImageUrls(item);

  addAsset(
    "primary",
    getString(item.metadata?.primary_image_url) ??
    getString(item.inputParams?.primary_image_url) ??
    getString(item.inputParams?.image_url) ??
    referenceUrls[0]
  );
  addAsset(
    "intro",
    getString(item.inputParams?.intro_image_url) ?? getString(item.metadata?.intro_image_url)
  );
  addAsset(
    "outro",
    getString(item.inputParams?.outro_image_url) ?? getString(item.metadata?.outro_image_url)
  );
  addAsset(
    "tail",
    getString(item.inputParams?.tail_image_url) ??
    getString(item.inputParams?.last_frame_image_url) ??
    getString(item.metadata?.tail_image_url)
  );

  const additionalAssetEntries = extractAdditionalEffectAssets(item);
  for (const [slot, url] of additionalAssetEntries) {
    if (!assets[slot] && typeof url === "string" && url.length > 0) {
      assets[slot] = { url };
    }
  }

  return assets;
}

function extractAdditionalEffectAssets(item: CreationItem): Array<[string, string]> {
  const entries: Array<[string, string]> = [];

  const referenceInputs = item.metadata?.reference_inputs;
  const referenceUrls = extractReferenceImageUrls(item);
  if (referenceInputs && typeof referenceInputs === "object") {
    const remaining = referenceUrls.slice();
    for (const [slot, active] of Object.entries(referenceInputs)) {
      if (!active || slot === "primary" || slot === "intro" || slot === "outro" || slot === "tail") {
        continue;
      }
      const url = getString((item.inputParams as Record<string, unknown> | undefined)?.[`${slot}_image_url`]) ??
        remaining.shift();
      if (url) {
        entries.push([slot, url]);
      }
    }
    return entries;
  }

  // Fallback: inspect input params for keys ending with `_image_url` or `_asset_url`.
  if (item.inputParams && typeof item.inputParams === "object") {
    for (const [key, value] of Object.entries(item.inputParams)) {
      const url = getString(value);
      if (!url) {
        continue;
      }
      if (/_image_url$/.test(key) || /_asset_url$/.test(key)) {
        const slot = key.replace(/(_image_url|_asset_url)$/, "");
        if (!["primary", "intro", "outro", "tail", "first_frame", "last_frame"].includes(slot)) {
          entries.push([slot, url]);
        }
      }
    }
  }

  return entries;
}

function mapEffectAssetsToInputParams(assets: EffectAssets) {
  const params: Record<string, string> = {};
  for (const [slot, { url }] of Object.entries(assets)) {
    if (slot === "primary") {
      params.primary_image_url = url;
      params.image_url = url;
      params.first_frame_image_url = params.first_frame_image_url ?? url;
      continue;
    }
    params[`${slot}_image_url`] = url;
    if (slot === "tail") {
      params.last_frame_image_url = url;
    }
  }
  return params;
}

function extractEffectVariables(item: CreationItem) {
  const variables = item.inputParams?.variables ?? item.metadata?.variables;
  if (isPlainObject(variables)) {
    return variables;
  }
  return undefined;
}

function resolveTextToImageUiModel(model: string, item: CreationItem): string {
  const displayName = getString(item.metadata?.model_display_name);
  if (displayName) {
    return displayName;
  }
  const config = safeGetTextToImageConfig(model);
  return config?.displayName ?? model;
}

function resolveVideoUiModel(model: string, item: CreationItem): string {
  const displayName = getString(item.metadata?.model_display_name);
  if (displayName) {
    return displayName;
  }
  const config = safeGetVideoConfig(model);
  return config?.displayName ?? model;
}

function pickAdditionalAssets(assets: EffectAssets): Record<string, string> {
  const additional: Record<string, string> = {};
  for (const [slot, { url }] of Object.entries(assets)) {
    if (!url) {
      continue;
    }
    if (slot === "primary" || slot === "intro" || slot === "outro" || slot === "tail") {
      continue;
    }
    additional[slot] = url;
  }
  return additional;
}

function resolveTextToImageModel(item: CreationItem): string {
  const model =
    getString(item.inputParams?.model) ??
    getString(item.modelSlug) ??
    getString(item.metadata?.model_slug) ??
    null;
  if (!model) {
    throw new Error("原始任务缺少模型配置，无法重新生成");
  }
  return model;
}

function resolveVideoModel(item: CreationItem): string {
  const model =
    getString(item.inputParams?.model) ??
    getString(item.modelSlug) ??
    getString(item.metadata?.model_slug) ??
    null;
  if (!model) {
    throw new Error("原始任务缺少模型配置，无法重新生成");
  }
  return model;
}

function extractReferenceImageUrls(item: CreationItem): string[] {
  const urls = Array.isArray(item.metadata?.reference_image_urls)
    ? item.metadata.reference_image_urls
    : Array.isArray(item.inputParams?.reference_image_urls)
      ? item.inputParams.reference_image_urls
      : [];
  return urls
    .map((url) => getString(url))
    .filter((url): url is string => Boolean(url));
}

function getFirstReferenceImage(item: CreationItem): string | null {
  const urls = extractReferenceImageUrls(item);
  if (urls.length > 0) {
    return urls[0];
  }
  return null;
}

function hasVideoReferenceImages(item: CreationItem): boolean {
  const inputs = item.metadata?.reference_inputs;
  if (inputs && typeof inputs === "object") {
    return Object.values(inputs).some(Boolean);
  }
  const urls = extractReferenceImageUrls(item);
  return urls.length > 0;
}

function buildReferenceList(
  flags: Record<string, boolean>,
  urls: Record<string, string | null | undefined>
): string[] {
  const orderedKeys: Array<keyof typeof flags> = ["primary", "intro", "outro", "tail"];
  const list: string[] = [];
  for (const key of orderedKeys) {
    if (flags[key]) {
      const url = urls[key];
      if (typeof url === "string" && url.length > 0) {
        list.push(url);
      }
    }
  }
  return list;
}

function removeUndefined<T extends Record<string, unknown>>(payload: T): T {
  const entries = Object.entries(payload).filter(([, value]) => value !== undefined && value !== null);
  return Object.fromEntries(entries) as T;
}

function safeGetTextToImageConfig(model: string) {
  try {
    return getTextToImageModelConfig(model);
  } catch (error) {
    console.warn("[creation-retry] failed to resolve text-to-image config", model, error);
    return null;
  }
}

function safeGetVideoConfig(model: string) {
  try {
    return getVideoModelConfig(model);
  } catch (error) {
    console.warn("[creation-retry] failed to resolve video config", model, error);
    return null;
  }
}

function safeGetSoundConfig(model: string) {
  try {
    return getSoundEffectModelConfig(model);
  } catch (error) {
    console.warn("[creation-retry] failed to resolve sound config", model, error);
    return getSoundEffectModelConfig(DEFAULT_SOUND_EFFECT_MODEL);
  }
}

function generateTempJobId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `temp-${crypto.randomUUID()}`;
  }
  return `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
}

function getString(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  return null;
}

function getBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  return fallback;
}

function cloneRecord<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

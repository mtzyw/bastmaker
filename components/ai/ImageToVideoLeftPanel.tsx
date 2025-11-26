"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Coins, Sparkles, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ImageCropperDialog from "@/components/ai/ImageCropperDialog";
import { cn } from "@/lib/utils";
import { AIModelDropdown } from "@/components/ai/AIModelDropdown";
import { PromptEnhancer } from "@/components/ai/PromptEnhancer";
import {
  DEFAULT_VIDEO_LENGTH,
  DEFAULT_VIDEO_MODEL,
  DEFAULT_VIDEO_RESOLUTION,
  VideoLengthValue,
  VideoResolutionValue,
  VIDEO_MODEL_SELECT_OPTIONS,
  VIDEO_RESOLUTION_PRESETS,
  getAllowedVideoLengths,
  getModelOption,
} from "@/components/ai/video-models";
import { CreationItem } from "@/lib/ai/creations";
import { useCreationHistoryStore } from "@/stores/creationHistoryStore";
import { useRepromptStore } from "@/stores/repromptStore";
import { getVideoModelConfig } from "@/lib/ai/video-config";
import { Switch } from "@/components/ui/switch";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/providers/AuthProvider";
import { useAuthDialog } from "@/components/providers/AuthDialogProvider";

type UploadKind = "primary" | "intro" | "outro" | "tail";

type UploadedAsset = {
  id: string;
  file: File | null;
  previewUrl: string;
  remoteUrl: string | null;
  source: "local" | "remote";
};

const FALLBACK_RESOLUTION: VideoResolutionValue = "720p";
const TRANSITION_MODEL = "PixVerse V5 Transition";

const generateAssetId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createRemoteAsset = (url: string): UploadedAsset => ({
  id: generateAssetId(),
  file: null,
  previewUrl: url,
  remoteUrl: url,
  source: "remote",
});

export default function ImageToVideoLeftPanel() {
  const upsertHistoryItem = useCreationHistoryStore((state) => state.upsertItem);
  const removeHistoryItem = useCreationHistoryStore((state) => state.removeItem);
  const repromptDraft = useRepromptStore((state) => state.draft);
  const clearRepromptDraft = useRepromptStore((state) => state.clearDraft);
  const [prompt, setPrompt] = useState("");
  const [translatePrompt, setTranslatePrompt] = useState(false);
  const [model, setModel] = useState(DEFAULT_VIDEO_MODEL);
  const [videoLength, setVideoLength] = useState<VideoLengthValue>(DEFAULT_VIDEO_LENGTH);
  const [resolution, setResolution] = useState<VideoResolutionValue>(DEFAULT_VIDEO_RESOLUTION);
  const [imageName, setImageName] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<UploadedAsset | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [cropSource, setCropSource] = useState<{ src: string; fileName: string; fileType: string } | null>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const uploadedBlobUrlRef = useRef<string | null>(null);

  const introImageInputRef = useRef<HTMLInputElement | null>(null);
  const outroImageInputRef = useRef<HTMLInputElement | null>(null);
  const [introImage, setIntroImage] = useState<UploadedAsset | null>(null);
  const [outroImage, setOutroImage] = useState<UploadedAsset | null>(null);
  const [isUploadingPrimary, setIsUploadingPrimary] = useState(false);
  const [isUploadingIntro, setIsUploadingIntro] = useState(false);
  const [isUploadingOutro, setIsUploadingOutro] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const t = useTranslations("CreationTools.ImageToVideo");
  const commonT = useTranslations("CreationTools.Common");
  const { user } = useAuth();
  const { openAuthDialog } = useAuthDialog();

  const isTransitionModel = model === TRANSITION_MODEL;
  const videoModelConfig = useMemo(() => getVideoModelConfig(model), [model]);

  const uploadImageToR2 = useCallback(async (file: File, kind: UploadKind): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", kind);

    const response = await fetch("/api/uploads/image-to-video", {
      method: "POST",
      body: formData,
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result?.success) {
      const message =
        typeof result?.error === "string" ? result.error : commonT("errors.uploadFailed");
      throw new Error(message);
    }

    const remoteUrl = result?.data?.url;
    if (typeof remoteUrl !== "string" || remoteUrl.length === 0) {
      throw new Error(commonT("errors.uploadResultInvalid"));
    }

    return remoteUrl;
  }, [commonT]);

  const resolveImageSource = useCallback(async (image: UploadedAsset | null | undefined) => {
    if (!image?.remoteUrl) {
      throw new Error(commonT("errors.uploadPending"));
    }
    return image.remoteUrl;
  }, [commonT]);

  const resetImageSelection = useCallback(() => {
    if (uploadedBlobUrlRef.current) {
      URL.revokeObjectURL(uploadedBlobUrlRef.current);
      uploadedBlobUrlRef.current = null;
    }
    if (uploadedImage?.source === "local" && uploadedImage.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(uploadedImage.previewUrl);
    }
    setUploadedImage(null);
    setImageName(null);
    setOriginalFile(null);
    setIsUploadingPrimary(false);
  }, [uploadedImage]);

  useEffect(() => {
    if (!resolution) {
      return;
    }

    const allowed = getAllowedVideoLengths(model, resolution);

    if (!allowed.includes(videoLength)) {
      setVideoLength(allowed[0]);
    }
  }, [model, resolution, videoLength]);

  useEffect(() => {
    const allowedResolutions = VIDEO_RESOLUTION_PRESETS[model] ?? [FALLBACK_RESOLUTION];
    if (!allowedResolutions.includes(resolution)) {
      setResolution(allowedResolutions[0]);
    }
  }, [model, resolution]);

  useEffect(() => {
    if (!repromptDraft || repromptDraft.kind !== "image-to-video") {
      return;
    }

    setPrompt(repromptDraft.prompt ?? "");
    setTranslatePrompt(Boolean(repromptDraft.translatePrompt));
    if (typeof repromptDraft.isPublic === "boolean") {
      setIsPublic(repromptDraft.isPublic);
    }

    const optionValues = VIDEO_MODEL_SELECT_OPTIONS.map((option) => option.value);
    const matchedModel =
      repromptDraft.model && optionValues.includes(repromptDraft.model)
        ? repromptDraft.model
        : VIDEO_MODEL_SELECT_OPTIONS.find((option) => option.label === repromptDraft.model)?.value ??
          optionValues[0] ??
          DEFAULT_VIDEO_MODEL;
    setModel(matchedModel);

    const resolutionChoices = VIDEO_RESOLUTION_PRESETS[matchedModel] ?? [FALLBACK_RESOLUTION];
    const preferredResolution =
      repromptDraft.resolution && resolutionChoices.includes(repromptDraft.resolution as VideoResolutionValue)
        ? (repromptDraft.resolution as VideoResolutionValue)
        : resolutionChoices[0] ?? FALLBACK_RESOLUTION;
    setResolution(preferredResolution);

    const allowedLengths = getAllowedVideoLengths(matchedModel, preferredResolution);
    const normalizedDuration =
      repromptDraft.duration != null ? String(Math.trunc(repromptDraft.duration)) : undefined;
    let nextVideoLength = allowedLengths[0] ?? DEFAULT_VIDEO_LENGTH;
    if (
      repromptDraft.videoLength &&
      allowedLengths.includes(repromptDraft.videoLength as VideoLengthValue)
    ) {
      nextVideoLength = repromptDraft.videoLength as VideoLengthValue;
    } else if (
      normalizedDuration &&
      allowedLengths.includes(normalizedDuration as VideoLengthValue)
    ) {
      nextVideoLength = normalizedDuration as VideoLengthValue;
    }
    setVideoLength(nextVideoLength);

    resetImageSelection();

    if (repromptDraft.primaryImageUrl) {
      setUploadedImage(createRemoteAsset(repromptDraft.primaryImageUrl));
    }

    clearTransitionImage("intro");
    clearTransitionImage("outro");

    if (repromptDraft.mode === "transition") {
      setIntroImage(
        repromptDraft.introImageUrl ? createRemoteAsset(repromptDraft.introImageUrl) : null
      );
      setOutroImage(
        repromptDraft.outroImageUrl ? createRemoteAsset(repromptDraft.outroImageUrl) : null
      );
    }

    clearRepromptDraft();
  }, [repromptDraft, clearRepromptDraft, resetImageSelection]);

  const allowedVideoLengths = getAllowedVideoLengths(model, resolution);
  const isSingleVideoLength = allowedVideoLengths.length === 1;
  const resolutionOptions = VIDEO_RESOLUTION_PRESETS[model] ?? [FALLBACK_RESOLUTION];
  const selectedModel = getModelOption(model);
  const creditsCost = videoModelConfig.creditsCost ?? selectedModel?.credits ?? 0;
  const hasPrompt = prompt.trim().length > 0;
  const isImageMode = !isTransitionModel;
  const hasImage = Boolean(uploadedImage?.remoteUrl);
  const hasTransitionImages = Boolean(introImage?.remoteUrl && outroImage?.remoteUrl);
  const mode: "image" | "transition" = isTransitionModel ? "transition" : "image";
  const canSubmit = hasPrompt && (isTransitionModel ? hasTransitionImages : hasImage);
  const disableSubmit =
    !canSubmit ||
    isSubmitting ||
    (isImageMode ? isUploadingPrimary : isUploadingIntro || isUploadingOutro);

  const handleCreate = useCallback(async () => {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt || disableSubmit) {
      return;
    }

    if (!user) {
      openAuthDialog("signin");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    const optimisticCreatedAt = new Date().toISOString();
    let tempJobId: string | null = null;

    try {
      let primaryImageUrl: string | null = null;
      let introImageUrl: string | null = null;
      let outroImageUrl: string | null = null;

      if (isImageMode) {
        if (!uploadedImage) {
          throw new Error(commonT("errors.primaryImageRequired"));
        }
        primaryImageUrl = await resolveImageSource(uploadedImage);
      } else {
        if (!introImage || !outroImage) {
          throw new Error(commonT("errors.transitionImagesRequired"));
        }
        introImageUrl = await resolveImageSource(introImage);
        outroImageUrl = await resolveImageSource(outroImage);
      }

      const referenceFlags = {
        primary: Boolean(primaryImageUrl),
        tail: false,
        intro: Boolean(introImageUrl),
        outro: Boolean(outroImageUrl),
      };
      const referenceCount = Object.values(referenceFlags).reduce(
        (total, flag) => total + (flag ? 1 : 0),
        0
      );

      const buildHistoryItem = ({
        jobId,
        status,
        latestStatus,
        providerJobId,
        createdAt,
        costCredits,
      }: {
        jobId: string;
        status: string;
        latestStatus?: string | null;
        providerJobId?: string | null;
        createdAt?: string;
        costCredits?: number;
      }): CreationItem => {
        const effectiveStatus = status || "processing";
        const effectiveLatest = latestStatus ?? effectiveStatus;
        const effectiveCredits =
          typeof costCredits === "number" ? costCredits : videoModelConfig.creditsCost;

        return {
          jobId,
          providerCode: videoModelConfig.providerCode,
          providerJobId: providerJobId ?? null,
          status: effectiveStatus,
          latestStatus: effectiveLatest,
          createdAt: createdAt ?? optimisticCreatedAt,
          costCredits: effectiveCredits,
          outputs: [],
          metadata: {
            source: "video",
            mode,
            translate_prompt: translatePrompt,
            resolution,
            duration: Number(videoLength),
            credits_cost: effectiveCredits,
            freepik_latest_status: effectiveLatest,
            freepik_initial_status: effectiveStatus,
            freepik_task_id: providerJobId ?? null,
            modality_code: "i2v",
            prompt: trimmedPrompt,
            original_prompt: trimmedPrompt,
            reference_inputs: referenceFlags,
            reference_image_count: referenceCount,
            reference_image_urls: [
              primaryImageUrl,
              introImageUrl,
              outroImageUrl,
            ].filter((url): url is string => Boolean(url)),
            primary_image_url: primaryImageUrl ?? null,
            is_public: isPublic,
          },
          inputParams: {
            mode,
            model,
            prompt: trimmedPrompt,
            translate_prompt: translatePrompt,
            resolution,
            video_length: videoLength,
            duration: Number(videoLength),
            image_url: primaryImageUrl,
            first_frame_image_url: primaryImageUrl,
            intro_image_url: introImageUrl,
            outro_image_url: outroImageUrl,
            reference_image_urls: [
              primaryImageUrl,
              introImageUrl,
              outroImageUrl,
            ].filter((url): url is string => Boolean(url)),
            primary_image_url: primaryImageUrl ?? null,
            is_public: isPublic,
          },
          modalityCode: "i2v",
          modelSlug: model,
          errorMessage: null,
          seed: null,
          isImageToImage: true,
          referenceImageCount: referenceCount,
          shareSlug: null,
          shareVisitCount: 0,
          shareConversionCount: 0,
          publicTitle: null,
          publicSummary: null,
        };
      };

      tempJobId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? `temp-${crypto.randomUUID()}`
          : `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;

      upsertHistoryItem(
        buildHistoryItem({ jobId: tempJobId, status: "processing", latestStatus: "processing" })
      );

      const payload: Record<string, unknown> = {
        mode,
        model,
        prompt: trimmedPrompt,
        translate_prompt: translatePrompt,
        resolution,
        video_length: videoLength,
        duration: Number(videoLength),
        is_public: isPublic,
      };

      if (primaryImageUrl) {
        payload.image_url = primaryImageUrl;
        payload.first_frame_image_url = primaryImageUrl;
      }
      if (introImageUrl) {
        payload.intro_image_url = introImageUrl;
      }
      if (outroImageUrl) {
        payload.outro_image_url = outroImageUrl;
      }

      const response = await fetch("/api/ai/freepik/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result?.success) {
        const message = result?.error ?? response.statusText ?? commonT("errors.submitFailed");
        throw new Error(message);
      }

      const taskInfo = result.data as {
        jobId?: string;
        providerJobId?: string;
        status?: string;
        freepikStatus?: string;
        creditsCost?: number;
        updatedBenefits?: { totalAvailableCredits?: number };
      };

      removeHistoryItem(tempJobId);

      if (taskInfo?.jobId) {
        const optimisticStatus = taskInfo.status ?? "processing";
        const latestStatus = taskInfo.freepikStatus ?? optimisticStatus;
        const credits =
          typeof taskInfo.creditsCost === "number"
            ? taskInfo.creditsCost
            : videoModelConfig.creditsCost;

        upsertHistoryItem(
          buildHistoryItem({
            jobId: taskInfo.jobId,
            status: optimisticStatus,
            latestStatus,
            providerJobId: taskInfo.providerJobId ?? null,
            createdAt: optimisticCreatedAt,
            costCredits: credits,
          })
        );
      }

      setStatusMessage(null);

    } catch (error) {
      if (tempJobId) {
        removeHistoryItem(tempJobId);
      }
      const message = error instanceof Error ? error.message : commonT("errors.submitFailedRetry");
      toast.error(message, { duration: 7000, position: "top-center" });
      console.error("[image-to-video] submit error", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    disableSubmit,
    introImage,
    isImageMode,
    mode,
    model,
    openAuthDialog,
    outroImage,
    prompt,
    removeHistoryItem,
    resolveImageSource,
    translatePrompt,
    resolution,
    upsertHistoryItem,
    user,
    videoLength,
    videoModelConfig,
    uploadedImage,
    isPublic,
  ]);

  useEffect(() => {
    return () => {
      if (cropSource?.src) URL.revokeObjectURL(cropSource.src);
    };
  }, [cropSource?.src]);

  useEffect(() => {
    return () => {
      if (uploadedBlobUrlRef.current) {
        URL.revokeObjectURL(uploadedBlobUrlRef.current);
      }
    };
  }, []);

  const openCropperWithFile = (file: File) => {
    const nextUrl = URL.createObjectURL(file);
    if (cropSource?.src) URL.revokeObjectURL(cropSource.src);
    setCropSource({ src: nextUrl, fileName: file.name, fileType: file.type || "image/png" });
    setCropperOpen(true);
  };

  const handleNewUpload = (file: File) => {
    setOriginalFile(file);
    openCropperWithFile(file);
  };

  const handleCropCancel = () => {
    setCropperOpen(false);
    if (cropSource?.src) URL.revokeObjectURL(cropSource.src);
    setCropSource(null);
    if (!uploadedImage) {
      setImageName(null);
      setOriginalFile(null);
    }
  };

  const handleCropConfirm = async ({
    blob,
    dataUrl,
    width,
    height,
  }: {
    blob: Blob;
    dataUrl: string;
    width: number;
    height: number;
  }) => {
    const shortestSide = Math.min(width, height);
    if (!Number.isFinite(shortestSide) || shortestSide <= 360) {
      const message = t("cropRequirement");
      toast.error(message, { duration: 7000, position: "top-center" });
      setCropperOpen(false);
      if (cropSource?.src) URL.revokeObjectURL(cropSource.src);
      setCropSource(null);
      return;
    }

    const fileName = cropSource?.fileName ?? `cropped-${Date.now()}.png`;
    const fileType = cropSource?.fileType ?? blob.type ?? "image/png";
    const croppedFile = new File([blob], fileName, { type: fileType });

    if (uploadedBlobUrlRef.current) {
      URL.revokeObjectURL(uploadedBlobUrlRef.current);
      uploadedBlobUrlRef.current = null;
    }

    const assetId = generateAssetId();
    const previewUrl = dataUrl || URL.createObjectURL(blob);
    uploadedBlobUrlRef.current = previewUrl.startsWith("blob:") ? previewUrl : null;
    setUploadedImage({
      id: assetId,
      file: croppedFile,
      previewUrl,
      remoteUrl: null,
      source: "local",
    });
    setOriginalFile(croppedFile);
    setImageName(fileName);
    setCropperOpen(false);
    if (cropSource?.src) URL.revokeObjectURL(cropSource.src);
    setCropSource(null);

    setIsUploadingPrimary(true);
    try {
      const remoteUrl = await uploadImageToR2(croppedFile, "primary");
      setUploadedImage((prev) =>
        !prev || prev.id !== assetId ? prev : { ...prev, remoteUrl }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : commonT("errors.uploadRetry");
      toast.error(message, { duration: 7000, position: "top-center" });
      setUploadedImage((prev) =>
        !prev || prev.id !== assetId ? prev : { ...prev, remoteUrl: null }
      );
    } finally {
      setIsUploadingPrimary(false);
    }
  };

  const handleTransitionUpload = async (slot: "intro" | "outro", file: File | null) => {
    if (!file) {
      return;
    }

    const assetId = generateAssetId();
    const previewUrl = URL.createObjectURL(file);
    const setAsset = slot === "intro" ? setIntroImage : setOutroImage;
    const currentAsset = slot === "intro" ? introImage : outroImage;
    const setUploading = slot === "intro" ? setIsUploadingIntro : setIsUploadingOutro;

    if (currentAsset?.source === "local" && currentAsset.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(currentAsset.previewUrl);
    }
    setAsset({ id: assetId, file, previewUrl, remoteUrl: null, source: "local" });
    setUploading(true);

    try {
      const remoteUrl = await uploadImageToR2(file, slot);
      setAsset((prev) => (!prev || prev.id !== assetId ? prev : { ...prev, remoteUrl }));
    } catch (error) {
      const message = error instanceof Error ? error.message : commonT("errors.uploadRetry");
      toast.error(message, { duration: 7000, position: "top-center" });
      setAsset((prev) => (!prev || prev.id !== assetId ? prev : { ...prev, remoteUrl: null }));
    } finally {
      setUploading(false);
    }
  };

  const clearTransitionImage = (slot: "intro" | "outro") => {
    if (slot === "intro") {
      if (introImage?.previewUrl && introImage.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(introImage.previewUrl);
      }
      setIntroImage(null);
      setIsUploadingIntro(false);
    } else {
      if (outroImage?.previewUrl && outroImage.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(outroImage.previewUrl);
      }
      setOutroImage(null);
      setIsUploadingOutro(false);
    }
  };

  useEffect(() => {
    if (model === TRANSITION_MODEL && uploadedImage) {
      resetImageSelection();
    }
    if (model !== TRANSITION_MODEL) {
      clearTransitionImage("intro");
      clearTransitionImage("outro");
    }
  }, [model]);

  useEffect(() => {
    return () => {
      if (introImage?.previewUrl && introImage.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(introImage.previewUrl);
      }
    };
  }, [introImage?.previewUrl]);

  useEffect(() => {
    return () => {
      if (outroImage?.previewUrl && outroImage.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(outroImage.previewUrl);
      }
    };
  }, [outroImage?.previewUrl]);

  return (
    <div className="w-full h-full text-white flex flex-col">
      <ScrollArea className="flex-1 min-h-0 md:mr-[-1.5rem]">
        <div className="pr-1 pt-3 pb-6 md:pr-7">
          <h1 className="text-2xl font-semibold mb-4 h-11 flex items-center">{t("title")}</h1>

          {/* Model label + select */}
          <div className="mb-2 text-sm">Model</div>
          <div className="mb-4">
            <AIModelDropdown
              options={VIDEO_MODEL_SELECT_OPTIONS}
              value={model}
              onChange={setModel}
            />
          </div>

          {/* Image upload */}
          <div className="mb-4">
            <div className="text-sm mb-2">{t("referencesLabel")}</div>
            {isTransitionModel ? (
              <div className="grid gap-3 md:grid-cols-2">
                {(
                  [
                    { key: "intro", label: t("introLabel"), description: t("introDescription") },
                    { key: "outro", label: t("outroLabel"), description: t("outroDescription") },
                  ] as const
                ).map(({ key, label, description }) => {
                  const selected = key === "intro" ? introImage : outroImage;
                  const inputRef = key === "intro" ? introImageInputRef : outroImageInputRef;
                  const isUploading = key === "intro" ? isUploadingIntro : isUploadingOutro;
                  return (
                    <div key={key}>
                      <div className="mb-2 flex items-center justify-between text-xs text-white/70">
                        <span>{label}</span>
                        {selected ? (
                          <button
                            type="button"
                            className="text-white/60 hover:text-white"
                            onClick={() => clearTransitionImage(key)}
                          >
                            {t("remove")}
                          </button>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="group relative flex h-32 w-full items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/8 transition-colors hover:bg-white/10"
                      >
                        {selected ? (
                          <img
                            src={selected.previewUrl}
                            alt={label}
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <div className="px-4 py-6 text-center text-xs text-white/60">
                            {t("uploadPrompt", { label })}
                          </div>
                        )}
                        {isUploading ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs text-white/80">
                            {t("uploading")}
                          </div>
                        ) : null}
                      </button>
                      <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0] ?? null;
                          void handleTransitionUpload(key, file);
                          event.target.value = "";
                        }}
                      />
                      <p className="mt-2 text-[11px] text-white/50">{description}</p>
                      {isUploading ? (
                        <p className="mt-1 text-[11px] text-white/60">{t("uploadingShort")}</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="group relative flex h-36 w-full items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/8 transition-colors hover:bg-white/10"
                  >
                    {uploadedImage ? (
                      <img
                        src={uploadedImage.previewUrl}
                        alt={t("referencesLabel")}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="px-4 py-8 text-center text-xs text-white/60">
                        {t("uploadPrompt", { label: t("referencesLabel") })}
                      </div>
                    )}

                    {uploadedImage ? (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-b from-black/35 via-black/15 to-black/0 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="pointer-events-auto m-2 h-8 w-8 rounded-full bg-black/45 text-white shadow-lg hover:bg-black/60"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            resetImageSelection();
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : null}
                    {isUploadingPrimary ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs text-white/80">
                        {t("uploading")}
                      </div>
                    ) : null}
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/60">
                  <button type="button" onClick={() => imageInputRef.current?.click()} className="hover:text-white">
                    {uploadedImage ? t("reupload") : t("selectImage")}
                  </button>
                  {uploadedImage?.file ? (
                    <button
                      type="button"
                      onClick={() => {
                        const fileToUse = originalFile ?? uploadedImage.file;
                        if (fileToUse) {
                          openCropperWithFile(fileToUse);
                        }
                      }}
                      className="hover:text-white"
                    >
                      {t("recrop")}
                    </button>
                  ) : null}
                  {imageName ? <span className="text-white/40">{t("fileLabel", { name: imageName })}</span> : null}
                </div>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    if (file) {
                      handleNewUpload(file);
                    }
                    event.target.value = "";
                  }}
                />
                {isUploadingPrimary ? (
                  <p className="mt-2 text-xs text-white/60">{t("uploadingPrimary")}</p>
                ) : null}
              </>
            )}
          </div>

          {/* Prompt */}
          <div className="text-sm mt-3 mb-2">{commonT("promptLabel")}</div>
          <div className="rounded-xl bg-white/8 border border-white/10">
            <div className="px-3 pt-3">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t("placeholder")}
                className="min-h-[140px] max-h-[320px] resize-y overflow-auto textarea-scrollbar bg-transparent text-white placeholder:text-white/60 border-0 focus-visible:ring-0 focus-visible:outline-none"
                maxLength={1000}
              />
            </div>
            <div className="h-px bg-white/10 mx-3 mt-2" />
            <div className="flex items-center justify-between px-3 py-3">
              <PromptEnhancer
                prompt={prompt}
                onApply={(value) => setPrompt(value)}
              />
              <div className="flex items-center gap-3 text-[11px] text-white/60">
                <span>{commonT("promptCounter", { count: prompt.length, max: 1000 })}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-white/70 hover:text-white" onClick={() => setPrompt("")}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {resolutionOptions && resolutionOptions.length > 0 ? (
            <div className="mt-4">
              <div className="text-sm mb-2">{t("resolutionLabel")}</div>
              <div role="radiogroup" aria-label={t("resolutionLabel")} className="flex gap-2">
                {resolutionOptions.map((item) => {
                  const isActive = resolution === item;
                  return (
                    <button
                      key={item}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      onClick={() => setResolution(item)}
                      className={cn(
                        "flex-1 basis-0 rounded-lg border border-white/10 px-3 py-2 text-sm text-center transition-all",
                        isActive
                          ? "bg-[#dc2e5a] text-white shadow-[0_0_12px_rgba(220,46,90,0.35)] border-[#dc2e5a]"
                          : "bg-white/8 text-white/70 hover:bg-white/12"
                      )}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="mt-4">
            <div className="text-sm mb-2">{t("lengthLabel")}</div>
            <div
              role="radiogroup"
              aria-label={t("lengthLabel")}
              className={cn("flex gap-2", isSingleVideoLength && "justify-start")}
            >
              {allowedVideoLengths.map((length) => {
                const isActive = videoLength === length;
                return (
                  <div key={length} className="flex-1 basis-0 flex">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      onClick={() => setVideoLength(length)}
                      className={cn(
                        "w-full rounded-lg border border-white/10 px-3 py-2 text-sm text-center transition-all",
                        isActive
                          ? "bg-[#dc2e5a] text-white shadow-[0_0_12px_rgba(220,46,90,0.35)] border-[#dc2e5a]"
                          : "bg-white/8 text-white/70 hover:bg-white/12"
                      )}
                    >
                      {t("lengthOption", { value: length })}
                    </button>
                  </div>
                );
              })}
              {isSingleVideoLength ? (
                <div className="flex-1 basis-0 invisible pointer-events-none" aria-hidden="true" />
              ) : null}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Fixed bottom: Output + Create */}
      <div className="pt-2 pb-0 shrink-0 border-t border-white/10 -mx-4 md:-mx-6">
        <div className="px-4 md:px-6">
          <div className="mb-4 flex items-center justify-between gap-3 text-sm text-white/80">
            <div className="flex flex-col">
              <span>{commonT("publishLabel")}</span>
              <span className="text-xs text-white/50">{commonT("publishDescription")}</span>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
          <div className="mb-3">
            <div className="flex items-center justify-between text-sm text-white/80">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-pink-400" />
                {commonT("creditsLabel")}:
              </div>
              <div>{creditsCost ? commonT("creditsValue", { count: creditsCost }) : "--"}</div>
            </div>
          </div>
          <Button
            className={cn(
              "w-full h-12 text-white transition-colors bg-gray-900 disabled:bg-gray-900 disabled:text-white/50 disabled:opacity-100",
              canSubmit &&
                "bg-[#dc2e5a] hover:bg-[#dc2e5a]/90 shadow-[0_0_12px_rgba(220,46,90,0.25)]",
              isSubmitting && "cursor-wait"
            )}
            disabled={disableSubmit}
            onClick={() => void handleCreate()}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isSubmitting ? commonT("buttons.creating") : commonT("buttons.create")}
          </Button>
          {statusMessage ? null : null}
        </div>
        <div className="mt-6 border-t border-white/10" />
      </div>
      <ImageCropperDialog
        open={cropperOpen}
        imageSrc={cropSource?.src ?? null}
        onCancel={handleCropCancel}
        onConfirm={handleCropConfirm}
      />
    </div>
  );
}

"use client";

import { AspectRatioInlineSelector } from "@/components/ai/AspectRatioInlineSelector";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/routing";
import type { CreationItem } from "@/lib/ai/creations";
import type { ImageEffectTemplate } from "@/lib/image-effects/templates";
import { cn } from "@/lib/utils";
import { useCreationHistoryStore } from "@/stores/creationHistoryStore";
import { ChevronLeft, Coins, Trash2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const DEFAULT_PREVIEW_IMAGE =
  "https://cdn.bestmaker.ai/static/placeholders/image-effect-preview.jpg";

const ASPECT_RATIO_OPTIONS: string[] = ["1:1", "16:9", "9:16", "3:4", "4:3"];

type LocalAsset = {
  file: File;
  remoteUrl: string | null;
  previewUrl: string;
};

export function ImageEffectsEditorLeftPanel({ effect }: { effect: ImageEffectTemplate }) {
  const defaultPrompt = useMemo(() => {
    const params = (effect.metadata?.freepik_params ?? {}) as Record<string, any>;
    return typeof params.prompt === "string" && params.prompt.length > 0
      ? params.prompt
      : "高质量人像精修摄影";
  }, [effect.metadata]);

  const defaultAspectRatio = useMemo(() => {
    const params = (effect.metadata?.freepik_params ?? {}) as Record<string, any>;
    return typeof params.aspect_ratio === "string" && params.aspect_ratio.length > 0
      ? params.aspect_ratio
      : "1:1";
  }, [effect.metadata]);

  const upsertHistoryItem = useCreationHistoryStore((state) => state.upsertItem);
  const removeHistoryItem = useCreationHistoryStore((state) => state.removeItem);

  const [prompt, setPrompt] = useState(defaultPrompt);
  const [aspectRatio, setAspectRatio] = useState(defaultAspectRatio);
  const [localAsset, setLocalAsset] = useState<LocalAsset | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const HIDDEN_PROMPT_SLUGS = new Set([
    "jojo-ai-filter",
    "3d-figurine-image-generation",
  ]);
  const HIDDEN_ASPECT_RATIO_SLUGS = new Set<string>([
  ]);
  const isPromptHidden = HIDDEN_PROMPT_SLUGS.has(effect.slug);
  const isAspectRatioHidden = HIDDEN_ASPECT_RATIO_SLUGS.has(effect.slug);

  const resolvedPrompt = useMemo(
    () => (isPromptHidden ? defaultPrompt : prompt),
    [isPromptHidden, defaultPrompt, prompt]
  );

  const resolvedAspectRatio = useMemo(() => {
    if (isAspectRatioHidden) {
      return defaultAspectRatio && defaultAspectRatio.length > 0
        ? defaultAspectRatio
        : undefined;
    }
    return aspectRatio;
  }, [isAspectRatioHidden, defaultAspectRatio, aspectRatio]);

  const promptForSubmit = resolvedPrompt.trim();

  useEffect(() => {
    setPrompt(defaultPrompt);
  }, [defaultPrompt]);

  useEffect(() => {
    setAspectRatio(defaultAspectRatio);
  }, [defaultAspectRatio]);

  useEffect(() => {
    setLocalAsset(null);
    setStatusMessage(null);
    setErrorMessage(null);
    setIsPublic(true);
  }, [effect.id]);

  useEffect(() => {
    return () => {
      if (localAsset?.previewUrl && localAsset.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(localAsset.previewUrl);
      }
    };
  }, [localAsset?.previewUrl]);

  const t = useTranslations("ImageEffectsEditor");

  const imageUploaderLabels = useMemo(() => ({
    title: t("uploadLabel"),
    uploading: t("uploading"),
    addLabel: t("uploadLabel"),
    addAriaLabel: t("uploadLabel"),
    imageAlt: t("previewAlt"),
    previewAlt: t("previewAlt"),
    closePreview: "Close Preview", // Not in JSON yet, keeping hardcoded or need to add? It wasn't in the original hardcoded strings I saw.
  }), [t]);

  const handleSelectFile = useCallback(
    async (file: File | null) => {
      if (!file) {
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.error(t("errors.invalidFileType"));
        return;
      }

      if (localAsset?.previewUrl && localAsset.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(localAsset.previewUrl);
      }

      const previewUrl = URL.createObjectURL(file);
      setLocalAsset({ file, previewUrl, remoteUrl: null });
      setStatusMessage(null);
      setErrorMessage(null);
      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/uploads/image-to-image", {
          method: "POST",
          body: formData,
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok || !result?.success) {
          const message =
            typeof result?.error === "string" ? result.error : t("errors.uploadFailed");
          throw new Error(message);
        }

        setLocalAsset((current) => {
          if (!current || current.file !== file) {
            return current;
          }
          return { ...current, remoteUrl: result.data?.url ?? null };
        });
      } catch (error: any) {
        const message =
          error instanceof Error ? error.message : t("errors.uploadFailed");
        toast.error(message);
        setLocalAsset(null);
      } finally {
        setIsUploading(false);
      }
    },
    [localAsset?.previewUrl, t]
  );

  const creditsCost = effect.pricingCreditsOverride ?? 6;
  const providerReady = Boolean(effect.providerModel);

  const buildHistoryItem = useCallback(
    ({
      jobId,
      status,
      latestStatus,
      providerJobId,
      createdAt,
    }: {
      jobId: string;
      status: string;
      latestStatus?: string | null;
      providerJobId?: string | null;
      createdAt: string;
    }): CreationItem => {
      const primaryImageUrl = localAsset?.remoteUrl ?? localAsset?.previewUrl ?? null;
      const effectiveStatus = status || "processing";
      const effectiveLatest = latestStatus ?? effectiveStatus;

      return {
        jobId,
        providerCode: effect.providerCode,
        providerJobId: providerJobId ?? null,
        status: effectiveStatus,
        latestStatus: effectiveLatest,
        createdAt,
        costCredits: creditsCost,
        outputs: [],
        metadata: {
          source: "image-effect",
          effect_slug: effect.slug,
          effect_title: effect.title,
          credits_cost: creditsCost,
          prompt: resolvedPrompt,
          aspect_ratio: resolvedAspectRatio ?? null,
          reference_inputs: { primary: true },
          reference_image_urls: primaryImageUrl ? [primaryImageUrl] : [],
          reference_image_count: primaryImageUrl ? 1 : 0,
          primary_image_url: primaryImageUrl,
          freepik_initial_status: effectiveStatus,
          freepik_latest_status: effectiveLatest,
          is_public: isPublic,
        },
        inputParams: {
          effect_slug: effect.slug,
          prompt: resolvedPrompt,
          aspect_ratio: resolvedAspectRatio,
          translate_prompt: false,
          reference_image_urls: primaryImageUrl ? [primaryImageUrl] : [],
          primary_image_url: primaryImageUrl,
          provider_model: effect.providerModel,
          is_public: isPublic,
        },
        modalityCode: "i2i",
        modelSlug: effect.providerModel,
        errorMessage: null,
        seed: null,
        isImageToImage: true,
        referenceImageCount: primaryImageUrl ? 1 : 0,
        shareSlug: null,
        shareVisitCount: 0,
        shareConversionCount: 0,
        publicTitle: null,
        publicSummary: null,
      };
    },
    [
      creditsCost,
      effect.providerCode,
      effect.providerModel,
      effect.slug,
      effect.title,
      isPublic,
      localAsset?.previewUrl,
      localAsset?.remoteUrl,
      resolvedAspectRatio,
      resolvedPrompt,
    ]
  );

  const handleCreate = useCallback(async () => {
    if (!providerReady) {
      toast.error(t("errors.providerMissing"));
      return;
    }

    if (!localAsset?.remoteUrl) {
      toast.error(t("errors.referenceMissing"));
      return;
    }

    if (!promptForSubmit) {
      toast.error(t("errors.promptMissing"));
      return;
    }

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setStatusMessage(null);

    const optimisticCreatedAt = new Date().toISOString();
    const tempJobId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? `temp-${crypto.randomUUID()}`
        : `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const optimisticItem = buildHistoryItem({
      jobId: tempJobId,
      status: "processing",
      latestStatus: "processing",
      createdAt: optimisticCreatedAt,
    });

    upsertHistoryItem(optimisticItem);

    try {
      const payload = {
        effect_slug: effect.slug,
        assets: {
          primary: {
            url: localAsset.remoteUrl,
          },
        },
        prompt: promptForSubmit,
        aspect_ratio: resolvedAspectRatio,
        is_public: isPublic,
      };

      const response = await fetch("/api/ai/effects/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result?.success) {
        const message =
          result?.error ?? response.statusText ?? t("errors.submitFailed");
        throw new Error(message);
      }

      const data = result.data as {
        jobId?: string;
        providerJobId?: string | null;
        status?: string;
        freepikStatus?: string | null;
        creditsCost?: number;
        updatedBenefits?: { totalAvailableCredits?: number };
      };

      removeHistoryItem(tempJobId);

      if (data?.jobId) {
        const latest = data.freepikStatus ?? data.status ?? "processing";
        const persistedItem = buildHistoryItem({
          jobId: data.jobId,
          status: data.status ?? "processing",
          latestStatus: latest,
          providerJobId: data.providerJobId ?? null,
          createdAt: optimisticCreatedAt,
        });
        upsertHistoryItem(persistedItem);
      }

      setStatusMessage(null);
    } catch (error: any) {
      removeHistoryItem(tempJobId);
      const message = error instanceof Error ? error.message : t("errors.submitFailed");
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    buildHistoryItem,
    effect.slug,
    isPublic,
    isSubmitting,
    localAsset?.remoteUrl,
    promptForSubmit,
    removeHistoryItem,
    resolvedAspectRatio,
    upsertHistoryItem,
    providerReady,
    t
  ]);

  const previewImage = effect.previewImageUrl ?? DEFAULT_PREVIEW_IMAGE;

  return (
    <div id="editor" className="flex h-full min-h-0 flex-col text-white">
      <ScrollArea className="flex-1 min-h-0 md:mr-[-1.5rem]">
        <div className="pr-1 md:pr-7">
          <Link
            href="/image-effects"
            className="flex items-center gap-2 text-sm uppercase tracking-[0.1em] text-white/40 transition-colors hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            {t("backToEffects")}
          </Link>
          <h1 className="mt-2 text-2xl font-semibold md:text-3xl">
            {effect.title}
          </h1>
          {effect.description ? (
            <p className="mt-2 text-sm text-white/60">{effect.description}</p>
          ) : null}

          <section className="mt-8 space-y-4">
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-white/80">{t("uploadLabel")}</h2>
              <p className="text-xs text-white/50">
                {t("uploadHint")}
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "group relative flex h-48 w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-colors hover:bg-white/10"
                )}
              >
                {localAsset?.previewUrl ? (
                  <Image
                    src={localAsset.previewUrl}
                    alt={t("previewAlt")}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <>
                    <Image
                      src={previewImage}
                      alt={t("templateAlt")}
                      fill
                      className="object-cover opacity-30"
                    />
                    <div className="relative flex flex-col items-center gap-2 text-xs text-white/70">
                      <Upload className="h-6 w-6 text-white/60" />
                      <span>{t("uploadPlaceholder")}</span>
                    </div>
                  </>
                )}
                <div className="pointer-events-none absolute inset-0 border border-white/10" />
                {isUploading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs text-white/80">
                    {t("uploading")}
                  </div>
                ) : null}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  void handleSelectFile(file);
                  event.target.value = "";
                }}
              />
              {localAsset ? (
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span className="truncate">{localAsset.file.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-white/70 hover:text-white"
                    onClick={() => {
                      if (localAsset.previewUrl.startsWith("blob:")) {
                        URL.revokeObjectURL(localAsset.previewUrl);
                      }
                      setLocalAsset(null);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : null}
            </div>

            {!isPromptHidden ? (
              <div className="space-y-2">
                <h2 className="text-sm font-medium text-white/80">{t("promptLabel")}</h2>
                <Textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  className="min-h-[160px] resize-y bg-white/5 text-white placeholder:text-white/60"
                  maxLength={1000}
                />
                <p className="text-xs text-white/50 text-right">
                  {prompt.length} / 1000
                </p>
              </div>
            ) : null}

            {!isAspectRatioHidden ? (
              <AspectRatioInlineSelector
                value={aspectRatio}
                options={ASPECT_RATIO_OPTIONS}
                onChange={setAspectRatio}
                label={t("aspectRatioLabel")}
                description={t("aspectRatioDescription")}
                className="w-full"
              />
            ) : null}
          </section>
        </div>
      </ScrollArea>

      <div className="shrink-0 border-t border-white/10 pb-0 pt-2 -mx-4 md:-mx-6">
        <div className="space-y-3 px-4 md:px-6">
          <div className="flex items-center justify-between gap-3 text-sm text-white/80">
            <div className="flex flex-col">
              <span>{t("publicLabel")}</span>
              <span className="text-xs text-white/50">{t("publicHint")}</span>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
          <div className="flex items-center justify-between text-sm text-white/80">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-pink-400" />
              {t("creditsLabel")}
            </div>
            <div>{creditsCost} Credits</div>
          </div>
          <Button
            className={cn(
              "h-12 w-full bg-gray-900 text-white transition-colors disabled:bg-gray-900 disabled:text-white/50 disabled:opacity-100",
              promptForSubmit &&
              localAsset?.remoteUrl &&
              "bg-[#dc2e5a] hover:bg-[#dc2e5a]/90 shadow-[0_0_12px_rgba(220,46,90,0.25)]",
              (isSubmitting || isUploading) && "cursor-wait"
            )}
            disabled={
              !providerReady ||
              !promptForSubmit ||
              !localAsset?.remoteUrl ||
              isSubmitting ||
              isUploading
            }
            onClick={() => void handleCreate()}
          >
            {providerReady ? (isSubmitting ? t("generating") : t("create")) : t("templateNotConfigured")}
          </Button>
          {errorMessage ? (
            <p className="text-xs text-red-400">{errorMessage}</p>
          ) : null}
        </div>
        <div className="mt-6 border-t border-white/10" />
      </div>
    </div>
  );
}

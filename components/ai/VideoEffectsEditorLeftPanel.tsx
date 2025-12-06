"use client";

import ImageCropperDialog from "@/components/ai/ImageCropperDialog";
import { useSubscriptionPopup } from "@/components/providers/SubscriptionPopupProvider";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Link } from "@/i18n/routing";
import type { CreationItem } from "@/lib/ai/creations";
import type { VideoEffectTemplate } from "@/lib/video-effects/templates";
import { useCreationHistoryStore } from "@/stores/creationHistoryStore";
import { ChevronRight, Coins, Crown, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type ToggleOption = {
  id: string;
  label: string;
  description: string;
  defaultChecked?: boolean;
  premium?: boolean;
};

const DEFAULT_PREVIEW_VIDEO =
  "https://cdn.bestmaker.ai/tasks/10a81006-480e-4ccf-ba60-c9887e2be6f8/0.mp4";

type LocalAsset = {
  file: File;
  remoteUrl: string | null;
  previewUrl: string;
};

export function VideoEffectsEditorLeftPanel({ effect }: { effect: VideoEffectTemplate }) {
  const previewSrc = effect.previewVideoUrl ?? DEFAULT_PREVIEW_VIDEO;
  const pricing = effect.pricingCreditsOverride ?? 10;
  const shouldUseCropper = effect.slug === "ai-kissing";
  const upsertHistoryItem = useCreationHistoryStore((state) => state.upsertItem);
  const removeHistoryItem = useCreationHistoryStore((state) => state.removeItem);
  const [localAsset, setLocalAsset] = useState<LocalAsset | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const uploadedBlobUrlRef = useRef<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [cropSource, setCropSource] = useState<{ src: string; fileName: string; fileType: string } | null>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const { openSubscriptionPopup } = useSubscriptionPopup();

  useEffect(() => {
    return () => {
      if (localAsset?.previewUrl && localAsset.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(localAsset.previewUrl);
      }
    };
  }, [localAsset?.previewUrl]);

  useEffect(() => {
    return () => {
      const current = cropSource?.src;
      if (current) {
        URL.revokeObjectURL(current);
      }
    };
  }, [cropSource?.src]);

  useEffect(() => {
    return () => {
      if (uploadedBlobUrlRef.current) {
        URL.revokeObjectURL(uploadedBlobUrlRef.current);
      }
    };
  }, []);

  const openCropperWithFile = useCallback((file: File) => {
    const nextUrl = URL.createObjectURL(file);
    setCropSource((current) => {
      if (current?.src) {
        URL.revokeObjectURL(current.src);
      }
      return { src: nextUrl, fileName: file.name, fileType: file.type || "image/png" };
    });
    setCropperOpen(true);
  }, []);

  const t = useTranslations("VideoEffectsEditor");

  const toggleOptions = useMemo<ToggleOption[]>(() => [
    {
      id: "protect",
      label: t("toggleOptions.protect.label"),
      description: t("toggleOptions.protect.description"),
      premium: true,
    },
  ], [t]);

  const handleCropCancel = useCallback(() => {
    setCropperOpen(false);
    setCropSource((current) => {
      if (current?.src) {
        URL.revokeObjectURL(current.src);
      }
      return null;
    });
    if (!localAsset) {
      setOriginalFile(null);
    }
  }, [localAsset]);

  const uploadImageToR2 = useCallback(async (file: File, kind: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", kind);

    const response = await fetch("/api/uploads/image-to-video", {
      method: "POST",
      body: formData,
    });
    const json = await response.json();
    if (!response.ok || !json?.success) {
      const message = typeof json?.error === "string" ? json.error : t("errors.uploadFailed");
      throw new Error(message);
    }
    const url = json?.data?.url;
    if (typeof url !== "string" || url.length === 0) {
      throw new Error(t("errors.uploadAbnormal"));
    }
    return url;
  }, [t]);

  const handleCropConfirm = useCallback(
    async ({
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
        toast.error(t("errors.imageTooSmall"), { duration: 6000 });
        handleCropCancel();
        return;
      }

      const currentSource = cropSource;
      const fileName = currentSource?.fileName ?? `cropped-${Date.now()}.png`;
      const fileType = currentSource?.fileType ?? blob.type ?? "image/png";
      const croppedFile = new File([blob], fileName, { type: fileType });

      if (localAsset?.previewUrl && localAsset.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(localAsset.previewUrl);
      }
      if (uploadedBlobUrlRef.current) {
        URL.revokeObjectURL(uploadedBlobUrlRef.current);
        uploadedBlobUrlRef.current = null;
      }

      const previewUrl = dataUrl || URL.createObjectURL(blob);
      uploadedBlobUrlRef.current = previewUrl.startsWith("blob:") ? previewUrl : null;

      setLocalAsset({ file: croppedFile, remoteUrl: null, previewUrl });
      setOriginalFile(croppedFile);
      setCropperOpen(false);
      setCropSource(null);

      if (currentSource?.src) {
        URL.revokeObjectURL(currentSource.src);
      }

      setIsUploading(true);
      try {
        const remoteUrl = await uploadImageToR2(croppedFile, "primary");
        setLocalAsset((current) => {
          if (!current || current.file !== croppedFile) {
            return current;
          }
          return { ...current, remoteUrl };
        });
      } catch (error: any) {
        const message = error instanceof Error ? error.message : t("errors.uploadFailed");
        toast.error(message, { duration: 6000 });
      } finally {
        setIsUploading(false);
      }
    },
    [cropSource, handleCropCancel, localAsset?.previewUrl, uploadImageToR2, t]
  );

  const handleSelectFile = useCallback(
    async (file: File | null) => {
      if (!file) {
        return;
      }

      if (shouldUseCropper) {
        if (!file.type.startsWith("image/")) {
          toast.error(t("errors.invalidFileType"), { duration: 6000 });
          return;
        }
        setOriginalFile(file);
        openCropperWithFile(file);
        return;
      }

      if (localAsset?.previewUrl && localAsset.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(localAsset.previewUrl);
      }
      if (uploadedBlobUrlRef.current) {
        URL.revokeObjectURL(uploadedBlobUrlRef.current);
        uploadedBlobUrlRef.current = null;
      }

      const previewUrl = URL.createObjectURL(file);
      uploadedBlobUrlRef.current = previewUrl.startsWith("blob:") ? previewUrl : null;

      setLocalAsset({ file, remoteUrl: null, previewUrl });
      setOriginalFile(null);
      setIsUploading(true);
      try {
        const remoteUrl = await uploadImageToR2(file, "primary");
        setLocalAsset((current) => {
          if (!current || current.file !== file) {
            return current;
          }
          return { ...current, remoteUrl };
        });
      } catch (error: any) {
        const message = error instanceof Error ? error.message : t("errors.uploadFailed");
        toast.error(message, { duration: 6000 });
        setLocalAsset(null);
      } finally {
        setIsUploading(false);
      }
    },
    [localAsset?.previewUrl, openCropperWithFile, shouldUseCropper, uploadImageToR2, t]
  );

  const handleCreate = useCallback(async () => {
    if (isSubmitting) {
      return;
    }
    if (!localAsset?.remoteUrl) {
      toast.warning(t("errors.referenceMissing"));
      return;
    }

    const payload: Record<string, unknown> = {
      effect_slug: effect.slug,
      assets: {
        primary: {
          url: localAsset.remoteUrl,
        },
      },
      is_public: isPublic,
    };

    setIsSubmitting(true);
    setStatusMessage(null);

    const optimisticCreatedAt = new Date().toISOString();
    const tempJobId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? `temp-${crypto.randomUUID()}`
        : `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const modality = effect.modalityCode ?? "i2v";
    const source = modality === "i2v" || modality === "t2v" ? "video" : "image";

    const optimisticItem: CreationItem = {
      jobId: tempJobId,
      providerCode: effect.providerCode,
      providerJobId: null,
      status: "processing",
      latestStatus: "processing",
      createdAt: optimisticCreatedAt,
      costCredits: pricing,
      outputs: [],
      metadata: {
        source,
        effect_slug: effect.slug,
        effect_title: effect.title,
        modality_code: modality,
        reference_inputs: { primary: true },
        reference_image_count: 1,
        reference_image_urls: [localAsset.remoteUrl],
        credits_cost: pricing,
        freepik_initial_status: "processing",
        freepik_latest_status: "processing",
        primary_image_url: localAsset.remoteUrl,
        is_public: isPublic,
      },
      inputParams: {
        effect_slug: effect.slug,
        reference_image_urls: [localAsset.remoteUrl],
        image_url: localAsset.remoteUrl,
        primary_image_url: localAsset.remoteUrl,
        is_public: isPublic,
      },
      modalityCode: modality,
      modelSlug: effect.providerModel,
      errorMessage: null,
      seed: effect.seed ? String(effect.seed) : null,
      isImageToImage: modality === "i2i",
      referenceImageCount: 1,
      shareSlug: null,
      shareVisitCount: 0,
      shareConversionCount: 0,
      publicTitle: null,
      publicSummary: null,
    };

    upsertHistoryItem(optimisticItem);

    try {
      const response = await fetch("/api/ai/effects/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || !json?.success) {
        if (response.status === 429) {
          openSubscriptionPopup();
        }
        const message = json?.error ?? response.statusText ?? t("errors.submitFailed");
        throw new Error(message);
      }

      const taskInfo = json.data as {
        jobId?: string;
        status?: string;
        freepikStatus?: string;
        providerJobId?: string;
        creditsCost?: number;
      };

      // Always remove the temporary item first.
      removeHistoryItem(tempJobId);

      // Then, check if the real item has already been added by the real-time channel.
      const store = useCreationHistoryStore.getState();
      const realItemAlreadyExists = store.items.some(item => item.jobId === taskInfo?.jobId);

      // Only add the item from the API response if it's not already in the store.
      if (taskInfo?.jobId && !realItemAlreadyExists) {
        upsertHistoryItem({
          ...optimisticItem,
          jobId: taskInfo.jobId,
          status: taskInfo.status ?? "processing",
          latestStatus: taskInfo.freepikStatus ?? taskInfo.status ?? "processing",
          providerJobId: taskInfo.providerJobId ?? null,
          createdAt: optimisticCreatedAt,
          costCredits:
            typeof taskInfo.creditsCost === "number" ? taskInfo.creditsCost : pricing,
        });
      }


    } catch (error: any) {
      // If anything fails, ensure the temporary item is removed.
      removeHistoryItem(tempJobId);
      const message = error instanceof Error ? error.message : t("errors.submitFailed");
      toast.error(message, { duration: 6000 });
    } finally {
      setIsSubmitting(false);
    }
  }, [effect, isSubmitting, localAsset, pricing, removeHistoryItem, upsertHistoryItem, isPublic, t, openSubscriptionPopup]);

  return (
    <div className="flex h-full w-full flex-col text-white">
      <ScrollArea className="flex-1 min-h-0 md:mr-[-1.5rem]" scrollbarClassName="!right-0">
        <div className="flex flex-col gap-6 pt-3 pb-16 pr-2 md:pr-7">
          <div className="space-y-3">
            <Link
              href="/video-effects"
              className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.3em] text-white/50 transition hover:text-white"
            >
              {t("backToList")}
            </Link>
            <div>
              {effect.category ? <p className="text-sm text-white/60">{effect.category}</p> : null}
              <h1 className="mt-1 text-3xl font-semibold text-white md:text-4xl">
                {effect.title}
              </h1>
              {effect.description ? (
                <p className="mt-3 text-sm leading-relaxed text-white/70">{effect.description}</p>
              ) : null}
            </div>
          </div>

          <section className="space-y-3">
            <header className="flex items-center justify-between">
              <span className="text-sm font-medium text-white/90">{t("templateLabel")}</span>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs text-blue-300 transition hover:text-blue-200"
              >
                {t("changeTemplate")}
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </header>
            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/40">
              <video
                className="aspect-video w-full object-cover"
                src={previewSrc}
                muted
                loop
                playsInline
                autoPlay
              />
              <div className="pointer-events-none absolute inset-0 border border-white/10" />
            </div>
          </section>

          <section className="space-y-3">
            <div className="text-sm">{t("referenceLabel")}</div>
            <div
              className="relative"
              onDragOver={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onDrop={(event) => {
                event.preventDefault();
                const file = event.dataTransfer.files?.[0] ?? null;
                if (file) {
                  void handleSelectFile(file);
                }
              }}
            >
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="group relative flex h-40 w-full items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/8 transition-colors hover:bg-white/12"
              >
                {localAsset ? (
                  <>
                    {localAsset.previewUrl.endsWith(".mp4") ? (
                      <video
                        src={localAsset.previewUrl}
                        className="max-h-full max-w-full object-contain"
                        muted
                        loop
                        autoPlay
                      />
                    ) : (
                      <Image
                        src={localAsset.previewUrl}
                        alt={t("referenceLabel")}
                        width={640}
                        height={640}
                        className="max-h-full max-w-full object-contain"
                      />
                    )}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-b from-black/35 via-black/15 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="pointer-events-auto bg-black/50 text-white hover:bg-black/60"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          if (localAsset.previewUrl && localAsset.previewUrl.startsWith("blob:")) {
                            URL.revokeObjectURL(localAsset.previewUrl);
                          }
                          if (uploadedBlobUrlRef.current) {
                            URL.revokeObjectURL(uploadedBlobUrlRef.current);
                            uploadedBlobUrlRef.current = null;
                          }
                          setLocalAsset(null);
                          setOriginalFile(null);
                        }}
                      >
                        {t("remove")}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-xs text-white/60">
                    <Upload className="h-6 w-6 text-white/40" />
                    <p>{t("uploadPlaceholder")}</p>
                    <p className="text-white/35">
                      {shouldUseCropper
                        ? t("uploadHintCropper")
                        : t("uploadHint")}
                    </p>
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
                accept={shouldUseCropper ? "image/*" : "image/*,video/*"}
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  if (file) {
                    void handleSelectFile(file);
                  }
                  event.target.value = "";
                }}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="hover:text-white"
              >
                {localAsset ? t("reselect") : t("selectImage")}
              </button>
              {shouldUseCropper && localAsset ? (
                <button
                  type="button"
                  onClick={() => {
                    const fileToUse = originalFile ?? localAsset.file;
                    openCropperWithFile(fileToUse);
                  }}
                  className="hover:text-white"
                >
                  {t("recrop")}
                </button>
              ) : null}
              {localAsset ? <span className="text-white/40">{t("fileLabel")} {localAsset.file.name}</span> : null}
            </div>
          </section>

          <section className="space-y-4">
            <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
              {toggleOptions.map((toggle) => (
                <div
                  key={toggle.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-white/5 bg-black/30 px-4 py-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">{toggle.label}</p>
                      {toggle.premium && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-[11px] font-semibold text-purple-200">
                          <Crown className="h-3 w-3" />
                          VIP
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/45">{toggle.description}</p>
                  </div>
                  <Switch defaultChecked={toggle.defaultChecked} aria-label={toggle.label} />
                </div>
              ))}
            </div>
          </section>
        </div>
      </ScrollArea>

      <div className="shrink-0 border-t border-white/10 pb-0 pt-2 -mx-4 md:-mx-6">
        <div className="px-4 md:px-6">
          <div className="mb-4 flex items-center justify-between gap-3 text-sm text-white/80">
            <div className="flex flex-col">
              <span>{t("publicLabel")}</span>
              <span className="text-xs text-white/50">{t("publicHint")}</span>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
          <div className="mb-3">
            <div className="mb-2 text-sm text-white/80">{t("creditsLabel")}</div>
            <div className="flex items-center justify-between text-sm text-white/80">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-pink-400" />
                {t("creditsLabel")}
              </div>
              <div>{pricing} Credits</div>
            </div>
          </div>
          <Button
            className="h-12 w-full bg-[#dc2e5a] text-white transition-colors hover:bg-[#dc2e5a]/90 shadow-[0_0_12px_rgba(220,46,90,0.25)]"
            onClick={handleCreate}
            disabled={isSubmitting || isUploading || !localAsset?.remoteUrl}
          >
            {t("create")}
          </Button>
          {statusMessage ? <p className="mt-2 text-xs text-white/60">{statusMessage}</p> : null}
        </div>
        <div className="mt-6 border-t border-white/10" />
      </div>
      <ImageCropperDialog
        open={shouldUseCropper ? cropperOpen : false}
        imageSrc={shouldUseCropper ? cropSource?.src ?? null : null}
        onCancel={handleCropCancel}
        onConfirm={handleCropConfirm}
      />
    </div>
  );
}

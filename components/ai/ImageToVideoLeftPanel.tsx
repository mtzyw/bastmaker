"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Coins, Sparkles, Trash2, Wand2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ImageCropperDialog from "@/components/ai/ImageCropperDialog";
import { cn } from "@/lib/utils";
import { AIModelDropdown } from "@/components/ai/AIModelDropdown";
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

const FALLBACK_RESOLUTION: VideoResolutionValue = "720p";
const TRANSITION_MODEL = "PixVerse V5 Transition";

export default function ImageToVideoLeftPanel() {
  const [prompt, setPrompt] = useState("");
  const [translatePrompt, setTranslatePrompt] = useState(false);
  const [model, setModel] = useState(DEFAULT_VIDEO_MODEL);
  const [videoLength, setVideoLength] = useState<VideoLengthValue>(DEFAULT_VIDEO_LENGTH);
  const [resolution, setResolution] = useState<VideoResolutionValue>(DEFAULT_VIDEO_RESOLUTION);
  const [imageName, setImageName] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<{ file: File; url: string } | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [cropSource, setCropSource] = useState<{ src: string; fileName: string; fileType: string } | null>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const uploadedBlobUrlRef = useRef<string | null>(null);

  const introImageInputRef = useRef<HTMLInputElement | null>(null);
  const outroImageInputRef = useRef<HTMLInputElement | null>(null);
  const [introImage, setIntroImage] = useState<{ file: File; url: string } | null>(null);
  const [outroImage, setOutroImage] = useState<{ file: File; url: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const isTransitionModel = model === TRANSITION_MODEL;

  const fileToDataUrl = useCallback(async (file: File) => {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error ?? new Error("读取文件失败"));
      reader.readAsDataURL(file);
    });
  }, []);

  const resolveImageSource = useCallback(
    async (image: { file: File; url: string } | null | undefined) => {
      if (!image) {
        return undefined;
      }
      if (image.url.startsWith("data:")) {
        return image.url;
      }
      try {
        return await fileToDataUrl(image.file);
      } catch (error) {
        console.error("[image-to-video] convert file to data URL failed", error);
        throw new Error("图片读取失败，请重新上传");
      }
    },
    [fileToDataUrl]
  );

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

  const allowedVideoLengths = getAllowedVideoLengths(model, resolution);
  const isSingleVideoLength = allowedVideoLengths.length === 1;
  const resolutionOptions = VIDEO_RESOLUTION_PRESETS[model] ?? [FALLBACK_RESOLUTION];
  const selectedModel = getModelOption(model);
  const creditsCost = selectedModel?.credits ?? 0;
  const hasPrompt = prompt.trim().length > 0;
  const isImageMode = !isTransitionModel;
  const hasImage = Boolean(uploadedImage);
  const hasTransitionImages = Boolean(introImage && outroImage);
  const mode: "image" | "transition" = isTransitionModel ? "transition" : "image";
  const canSubmit = hasPrompt && (isTransitionModel ? hasTransitionImages : hasImage);
  const disableSubmit = !canSubmit || isSubmitting;

  const handleCreate = useCallback(async () => {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt || disableSubmit) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const payload: Record<string, unknown> = {
        mode,
        model,
        prompt: trimmedPrompt,
        translate_prompt: translatePrompt,
        resolution,
        video_length: videoLength,
        duration: Number(videoLength),
      };

      if (isImageMode) {
        if (!uploadedImage) {
          throw new Error("请上传参考图片");
        }
        const imageSource = await resolveImageSource(uploadedImage);
        payload.image_url = imageSource;
        payload.first_frame_image_url = imageSource;
      } else {
        if (!introImage || !outroImage) {
          throw new Error("请上传首尾图片");
        }
        payload.intro_image_url = await resolveImageSource(introImage);
        payload.outro_image_url = await resolveImageSource(outroImage);
      }

      const response = await fetch("/api/ai/freepik/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result?.success) {
        const message = result?.error ?? response.statusText ?? "提交失败";
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

      const parts: string[] = ["视频任务已提交，请稍后在生成记录页查看进度。"];

      if (typeof taskInfo?.creditsCost === "number" && taskInfo.creditsCost > 0) {
        parts.push(`本次扣除 ${taskInfo.creditsCost} Credits`);
      }

      const remainingCredits = taskInfo?.updatedBenefits?.totalAvailableCredits;
      if (typeof remainingCredits === "number") {
        parts.push(`当前余额 ${remainingCredits} Credits`);
      }

      setStatusMessage(parts.join("，"));

      console.debug("[image-to-video] submit payload", payload, result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "提交失败，请稍后重试";
      setErrorMessage(message);
      console.error("[image-to-video] submit error", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [disableSubmit, isImageMode, mode, prompt, resolveImageSource, translatePrompt, resolution, videoLength, uploadedImage, introImage, outroImage]);

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

  const handleCropConfirm = ({ blob, dataUrl }: { blob: Blob; dataUrl: string }) => {
    const fileName = cropSource?.fileName ?? `cropped-${Date.now()}.png`;
    const fileType = cropSource?.fileType ?? blob.type ?? "image/png";
    const croppedFile = new File([blob], fileName, { type: fileType });

    if (uploadedBlobUrlRef.current) {
      URL.revokeObjectURL(uploadedBlobUrlRef.current);
      uploadedBlobUrlRef.current = null;
    }

    const previewUrl = dataUrl || URL.createObjectURL(blob);
    uploadedBlobUrlRef.current = previewUrl.startsWith("blob:") ? previewUrl : null;
    setUploadedImage({ file: croppedFile, url: previewUrl });
    setOriginalFile(croppedFile);
    setImageName(fileName);
    setCropperOpen(false);
    if (cropSource?.src) URL.revokeObjectURL(cropSource.src);
    setCropSource(null);
  };

  const resetImageSelection = () => {
    if (uploadedBlobUrlRef.current) {
      URL.revokeObjectURL(uploadedBlobUrlRef.current);
      uploadedBlobUrlRef.current = null;
    }
    setUploadedImage(null);
    setImageName(null);
    setOriginalFile(null);
  };

  const handleTransitionUpload = (slot: "intro" | "outro", file: File | null) => {
    if (!file) {
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    if (slot === "intro") {
      if (introImage?.url) URL.revokeObjectURL(introImage.url);
      setIntroImage({ file, url: previewUrl });
    } else {
      if (outroImage?.url) URL.revokeObjectURL(outroImage.url);
      setOutroImage({ file, url: previewUrl });
    }
  };

  const clearTransitionImage = (slot: "intro" | "outro") => {
    if (slot === "intro") {
      if (introImage?.url) URL.revokeObjectURL(introImage.url);
      setIntroImage(null);
    } else {
      if (outroImage?.url) URL.revokeObjectURL(outroImage.url);
      setOutroImage(null);
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
      if (introImage?.url) URL.revokeObjectURL(introImage.url);
    };
  }, [introImage?.url]);

  useEffect(() => {
    return () => {
      if (outroImage?.url) URL.revokeObjectURL(outroImage.url);
    };
  }, [outroImage?.url]);

  return (
    <div className="w-full h-full text-white flex flex-col">
      <ScrollArea className="flex-1 min-h-0 md:mr-[-1.5rem]">
        <div className="pr-1 pt-3 pb-6 md:pr-7">
          <h1 className="text-2xl font-semibold mb-4 h-11 flex items-center">图转视频</h1>

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
            <div className="text-sm mb-2">参考图片</div>
            {isTransitionModel ? (
              <div className="grid gap-3 md:grid-cols-2">
                {(
                  [
                    { key: "intro", label: "首图", description: "用于视频开场" },
                    { key: "outro", label: "尾图", description: "用于视频结尾" },
                  ] as const
                ).map(({ key, label, description }) => {
                  const selected = key === "intro" ? introImage : outroImage;
                  const inputRef = key === "intro" ? introImageInputRef : outroImageInputRef;
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
                            移除
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
                            src={selected.url}
                            alt={label}
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <div className="px-4 py-6 text-center text-xs text-white/60">点击上传{label}</div>
                        )}
                      </button>
                      <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0] ?? null;
                          handleTransitionUpload(key, file);
                          event.target.value = "";
                        }}
                      />
                      <p className="mt-2 text-[11px] text-white/50">{description}</p>
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
                        src={uploadedImage.url}
                        alt="已选择的参考图"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="px-4 py-8 text-center text-xs text-white/60">Click to upload an image</div>
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
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/60">
                  <button type="button" onClick={() => imageInputRef.current?.click()} className="hover:text-white">
                    {uploadedImage ? "重新选择" : "选择图片"}
                  </button>
                  {uploadedImage ? (
                    <button
                      type="button"
                      onClick={() => {
                        const fileToUse = originalFile ?? uploadedImage.file;
                        openCropperWithFile(fileToUse);
                      }}
                      className="hover:text-white"
                    >
                      重新裁剪
                    </button>
                  ) : null}
                  {imageName ? <span className="text-white/40">文件：{imageName}</span> : null}
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
              </>
            )}
          </div>

          {/* Prompt */}
          <div className="flex items-center justify-between mt-3 mb-2">
            <div className="text-sm">提示词</div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <span>翻译提示词</span>
              <Switch checked={translatePrompt} onCheckedChange={setTranslatePrompt} />
            </div>
          </div>
          <div className="rounded-xl bg-white/8 border border-white/10">
            <div className="px-3 pt-3">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="你想要创建什么？"
                className="min-h-[140px] max-h-[320px] resize-y overflow-auto textarea-scrollbar bg-transparent text-white placeholder:text-white/60 border-0 focus-visible:ring-0 focus-visible:outline-none"
                maxLength={1000}
              />
            </div>
            <div className="h-px bg-white/10 mx-3 mt-2" />
            <div className="flex items-center justify-between px-3 py-3">
              <Button variant="secondary" onClick={() => {}} className="h-8 bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs">
                <Wand2 className="w-3.5 h-3.5 mr-2" />
                AI提示词
              </Button>
              <div className="flex items-center gap-3 text-[11px] text-white/60">
                <span>{prompt.length} / 1000</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-white/70 hover:text-white" onClick={() => setPrompt("")}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {resolutionOptions && resolutionOptions.length > 0 ? (
            <div className="mt-4">
              <div className="text-sm mb-2">Video Resolution</div>
              <div role="radiogroup" aria-label="Video Resolution" className="flex gap-2">
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
            <div className="text-sm mb-2">Video Length</div>
            <div
              role="radiogroup"
              aria-label="Video Length"
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
                      {length} 秒
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
          <div className="mb-3">
            <div className="mb-2 text-sm">Output Image Number</div>
            <div className="flex items-center justify-between text-sm text-white/80">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-pink-400" />
                Credits required:
              </div>
              <div>{creditsCost ? `${creditsCost} Credits` : "--"}</div>
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
            {isSubmitting ? "创建中..." : "创建"}
          </Button>
          {errorMessage ? (
            <p className="mt-3 text-sm text-red-400">{errorMessage}</p>
          ) : null}
          {statusMessage ? (
            <p className="mt-3 text-sm text-emerald-400">{statusMessage}</p>
          ) : null}
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

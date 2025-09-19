"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Coins, Sparkles, Trash2, Wand2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ImageCropperDialog from "@/components/ai/ImageCropperDialog";
import { cn } from "@/lib/utils";

type VideoLengthValue = "5" | "6" | "8" | "10";
type VideoResolutionValue = "360p" | "480p" | "540p" | "580p" | "720p" | "768p" | "1080p";

const lengthPresetsByModel: Record<string, VideoLengthValue[]> = {
  "PixVerse V5": ["5", "8"],
  "Seedance 1.0 Lite": ["5", "10"],
  "Seedance 1.0 Pro": ["5", "10"],
  "wan2.2 Plus": ["5", "10"],
};

const resolutionPresetsByModel: Record<string, VideoResolutionValue[]> = {
  "Minimax Hailuo 2.0": ["768p", "1080p"],
  "Kling v2.1 Master": ["720p", "1080p"],
  "Seedance 1.0 Lite": ["480p", "720p", "1080p"],
  "Seedance 1.0 Pro": ["480p", "720p", "1080p"],
  "wan2.2 Plus": ["480p", "580p", "720p"],
  "PixVerse V5": ["360p", "540p", "720p", "1080p"],
};

const getAllowedVideoLengths = (
  model: string,
  resolution: VideoResolutionValue
): VideoLengthValue[] => {
  if (model === "Minimax Hailuo 2.0") {
    if (resolution === "1080p") {
      return ["6"];
    }

    if (resolution === "768p") {
      return ["6", "10"];
    }

    return ["6"];
  }

  return lengthPresetsByModel[model] ?? ["5", "10"];
};

const defaultModel = "Minimax Hailuo 2.0";
const defaultResolution = (resolutionPresetsByModel[defaultModel] ?? ["720p"])[0];
const defaultVideoLength = getAllowedVideoLengths(defaultModel, defaultResolution)[0];

export default function ImageToVideoLeftPanel() {
  const [prompt, setPrompt] = useState("");
  const [translatePrompt, setTranslatePrompt] = useState(false);
  const [model, setModel] = useState(defaultModel);
  const [videoLength, setVideoLength] = useState<VideoLengthValue>(defaultVideoLength);
  const [resolution, setResolution] = useState<VideoResolutionValue>(defaultResolution);
  const [imageName, setImageName] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<{ file: File; url: string } | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [cropSource, setCropSource] = useState<{ src: string; fileName: string; fileType: string } | null>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const uploadedBlobUrlRef = useRef<string | null>(null);

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
    const allowedResolutions = resolutionPresetsByModel[model] ?? ["720p"];
    if (!allowedResolutions.includes(resolution)) {
      setResolution(allowedResolutions[0]);
    }
  }, [model, resolution]);

  const allowedVideoLengths = getAllowedVideoLengths(model, resolution);
  const isSingleVideoLength = allowedVideoLengths.length === 1;
  const resolutionOptions = resolutionPresetsByModel[model] ?? ["720p"];

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

  return (
    <div className="w-full h-full text-white flex flex-col">
      <ScrollArea className="flex-1 min-h-0 -mr-4 md:-mr-6">
        <div className="px-4 md:px-6 pt-3 pb-6">
          <h1 className="text-2xl font-semibold mb-4 h-11 flex items-center">图转视频</h1>

          {/* Model label + select */}
          <div className="mb-2 text-sm">Model</div>
          <div className="mb-4">
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="h-11 bg-white/5 border-white/10 text-white">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white text-[10px] leading-none font-bold">G</span>
                  </div>
                  <SelectValue placeholder="选择模型" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Minimax Hailuo 2.0">Minimax Hailuo 2.0</SelectItem>
                <SelectItem value="Kling v2.1 Master">Kling v2.1 Master</SelectItem>
                <SelectItem value="Seedance 1.0 Lite">Seedance 1.0 Lite</SelectItem>
                <SelectItem value="Seedance 1.0 Pro">Seedance 1.0 Pro</SelectItem>
                <SelectItem value="wan2.2 Plus">wan2.2 Plus</SelectItem>
                <SelectItem value="PixVerse V5">PixVerse V5</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Image upload */}
          <div className="mb-4">
            <div className="text-sm mb-2">参考图片</div>
            <div className="relative">
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="group relative flex h-48 w-full items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/8 transition-colors hover:bg-white/10"
              >
                {uploadedImage ? (
                  <img
                    src={uploadedImage.url}
                    alt="已选择的参考图"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="px-4 py-12 text-center text-xs text-white/60">Click to upload an image</div>
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
      <div className="pt-2 pb-6 px-4 md:px-6 shrink-0">
        <div className="mb-3 border-t border-white/10" />
        <div className="mb-3">
          <div className="mb-2 text-sm">Output Image Number</div>
          <div className="flex items-center justify-between text-sm text-white/80">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-pink-400" />
              Credits required:
            </div>
            <div>4 Credits</div>
          </div>
        </div>
        <Button
          className={cn(
            "w-full h-12 text-white transition-colors bg-gray-900 disabled:bg-gray-900 disabled:text-white/50 disabled:opacity-100",
            prompt.trim() &&
              "bg-[#dc2e5a] hover:bg-[#dc2e5a]/90 shadow-[0_0_12px_rgba(220,46,90,0.25)]"
          )}
          disabled={!prompt.trim()}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          创建
        </Button>
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

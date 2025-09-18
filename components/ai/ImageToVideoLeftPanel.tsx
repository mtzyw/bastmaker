"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Coins, Sparkles, Trash2, Wand2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ImageCropperDialog from "@/components/ai/ImageCropperDialog";

type VideoLengthValue = "5" | "6" | "10";
type VideoResolutionValue = "360p" | "480p" | "540p" | "580p" | "720p" | "768p" | "1080p";

const resolutionPresetsByModel: Record<string, VideoResolutionValue[]> = {
  "Minimax Hailuo 2.0": ["480p", "720p", "768p", "1080p"],
  "Kling v2.1 Master": ["720p", "1080p"],
  Seedance: ["480p", "720p", "1080p"],
  "PixVerse V5": ["360p", "540p", "720p", "1080p"],
};

export default function ImageToVideoLeftPanel() {
  const [prompt, setPrompt] = useState("");
  const [translatePrompt, setTranslatePrompt] = useState(false);
  const [model, setModel] = useState("Minimax Hailuo 2.0");
  const [videoLength, setVideoLength] = useState<VideoLengthValue>("6");
  const [resolution, setResolution] = useState<VideoResolutionValue>(
    (resolutionPresetsByModel["Minimax Hailuo 2.0"] ?? ["720p"])[0]
  );
  const [imageName, setImageName] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<{ file: File; url: string } | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [cropSource, setCropSource] = useState<{ src: string; fileName: string; fileType: string } | null>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const nextAllowed: VideoLengthValue[] =
      model === "Minimax Hailuo 2.0" ? ["6"] : ["5", "10"];

    if (!nextAllowed.includes(videoLength)) {
      setVideoLength(nextAllowed[0]);
    }
  }, [model, videoLength]);

  useEffect(() => {
    const allowedResolutions = resolutionPresetsByModel[model] ?? ["720p"];
    if (!allowedResolutions.includes(resolution)) {
      setResolution(allowedResolutions.includes("720p") ? "720p" : allowedResolutions[0]);
    }
  }, [model, resolution]);

  useEffect(() => {
    return () => {
      if (uploadedImage?.url) URL.revokeObjectURL(uploadedImage.url);
    };
  }, [uploadedImage?.url]);

  useEffect(() => {
    return () => {
      if (cropSource?.src) URL.revokeObjectURL(cropSource.src);
    };
  }, [cropSource?.src]);

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

    if (uploadedImage?.url) URL.revokeObjectURL(uploadedImage.url);

    const previewUrl = dataUrl || URL.createObjectURL(blob);
    setUploadedImage({ file: croppedFile, url: previewUrl });
    setImageName(fileName);
    setCropperOpen(false);
    if (cropSource?.src) URL.revokeObjectURL(cropSource.src);
    setCropSource(null);
  };

  return (
    <div className="w-full h-full min-h-0 text-white flex flex-col">
      <ScrollArea className="flex-1 min-h-0 -mr-4 md:-mr-6">
        <div className="pr-4 md:pr-6">
          <div className="pr-1">
            <h1 className="text-2xl font-semibold mt-2 mb-4 h-11 flex items-center">图转视频</h1>

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
                  <SelectItem value="Seedance">Seedance</SelectItem>
                  <SelectItem value="PixVerse V5">PixVerse V5</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Image upload */}
            <div className="mb-4">
              <div className="text-sm mb-2">参考图片</div>
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-white/8 transition-colors hover:bg-white/10"
              >
                {uploadedImage ? (
                  <img
                    src={uploadedImage.url}
                    alt="已选择的参考图"
                    className="h-48 w-full object-cover"
                  />
                ) : (
                  <div className="px-4 py-12 text-center text-xs text-white/60">Click to upload an image</div>
                )}
              </button>
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

            <div className="mt-4">
              <div className="text-sm mb-2">Video Length</div>
              <RadioGroup
                value={videoLength}
                onValueChange={(value) => setVideoLength(value as VideoLengthValue)}
                className="flex gap-2"
              >
                {(model === "Minimax Hailuo 2.0" ? ["6"] : ["5", "10"]).map((length) => {
                  const id = `image-video-length-${length}`;
                  const isActive = videoLength === length;
                  return (
                    <div key={length} className="flex-1 basis-0">
                      <RadioGroupItem value={length} id={id} className="sr-only" />
                      <Label
                        htmlFor={id}
                        className={`flex h-full w-full cursor-pointer select-none rounded-lg border border-white/10 px-3 py-2 text-sm text-center transition-all ${
                          isActive
                            ? "bg-pink-500/30 text-white shadow-[0_0_12px_rgba(236,72,153,0.25)] border-white/30"
                            : "bg-white/8 text-white/70 hover:bg-white/12"
                        }`}
                      >
                        {length} 秒{model === "Minimax Hailuo 2.0" && length === "6" ? "（固定）" : ""}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>

            <div className="mt-4">
              <div className="text-sm mb-2">Video Resolution</div>
              <RadioGroup
                value={resolution}
                onValueChange={(value) => setResolution(value as VideoResolutionValue)}
                className="flex gap-2"
              >
                {(resolutionPresetsByModel[model] ?? ["720p"]).map((item) => {
                  const id = `image-video-resolution-${item}`;
                  const isActive = resolution === item;
                  return (
                    <div key={item} className="flex-1 basis-0">
                      <RadioGroupItem value={item} id={id} className="sr-only" />
                      <Label
                        htmlFor={id}
                        className={`flex h-full w-full cursor-pointer select-none rounded-lg border border-white/10 px-3 py-2 text-sm text-center transition-all ${
                          isActive
                            ? "bg-pink-500/30 text-white shadow-[0_0_12px_rgba(236,72,153,0.25)] border-white/30"
                            : "bg-white/8 text-white/70 hover:bg-white/12"
                        }`}
                      >
                        {item}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>

          </div>
        </div>
      </ScrollArea>

      {/* Fixed bottom: Output + Create */}
      <div className="pt-2 pb-0 shrink-0">
        <div className="mb-3 border-t border-white/10 -mx-4 md:-mx-6" />
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
        <Button className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-600/90 hover:to-blue-600/90" disabled={!prompt.trim()}>
          <Sparkles className="w-4 h-4 mr-2" />
          创建
        </Button>
        <div className="mt-6 border-t border-white/10 -mx-4 md:-mx-6" />
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

"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { getCroppedImageBlob } from "@/lib/image/crop-image";
import { cn } from "@/lib/utils";
import { CSSProperties, useCallback, useEffect, useMemo, useState } from "react";
import Cropper, { type Area, type MediaSize } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";

const ZOOM_MIN = 1;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.1;
const DEFAULT_ASPECT = 1;

const ASPECT_OPTIONS = [
  { label: "原尺寸", value: "original" as const },
  { label: "1:1", value: 1 / 1 },
  { label: "16:9", value: 16 / 9 },
  { label: "9:16", value: 9 / 16 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:4", value: 3 / 4 },
];

type AspectSelectValue = (typeof ASPECT_OPTIONS)[number]["value"];

type ImageCropperDialogProps = {
  open: boolean;
  imageSrc: string | null;
  fileType?: string;
  onConfirm: (payload: { blob: Blob; dataUrl: string; width: number; height: number }) => void;
  onCancel: () => void;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export default function ImageCropperDialog({ open, imageSrc, fileType, onConfirm, onCancel }: ImageCropperDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(ZOOM_MIN);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageAspect, setImageAspect] = useState<number | null>(null);
  const [aspectSelectValue, setAspectSelectValue] = useState<AspectSelectValue>("original");

  useEffect(() => {
    if (!open) return;
    setCrop({ x: 0, y: 0 });
    setZoom(ZOOM_MIN);
    setCroppedAreaPixels(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setAspectSelectValue("original");
    setCrop({ x: 0, y: 0 });
    setZoom(ZOOM_MIN);
    setCroppedAreaPixels(null);
  }, [imageSrc, open]);

  useEffect(() => {
    if (!open) return;
    setCrop({ x: 0, y: 0 });
    setZoom(ZOOM_MIN);
  }, [open, aspectSelectValue, imageAspect]);

  const handleMediaLoaded = useCallback(({ naturalWidth, naturalHeight }: MediaSize) => {
    if (naturalWidth && naturalHeight) {
      setImageAspect(naturalWidth / naturalHeight);
    }
  }, []);

  const handleAspectSelect = useCallback((value: AspectSelectValue) => {
    setAspectSelectValue(value);
  }, []);

  const handleCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const effectiveAspect = useMemo(() => {
    if (aspectSelectValue === "original") {
      return imageAspect ?? DEFAULT_ASPECT;
    }
    return aspectSelectValue;
  }, [aspectSelectValue, imageAspect]);

  const handleZoomSliderChange = useCallback((values: number[]) => {
    const value = values[0];
    if (typeof value !== "number") return;
    setZoom(clamp(value, ZOOM_MIN, ZOOM_MAX));
  }, []);

  const handleWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    if (!imageSrc) return;
    event.preventDefault();
    const delta = event.deltaY;
    if (delta === 0) return;
    setZoom((prev) => {
      const next = prev + (delta > 0 ? -ZOOM_STEP : ZOOM_STEP);
      return clamp(Number.parseFloat(next.toFixed(2)), ZOOM_MIN, ZOOM_MAX);
    });
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      setIsProcessing(true);
      const mimeType = fileType || "image/png";
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels, mimeType);
      const { width, height } = croppedAreaPixels;
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const dataUrl = typeof reader.result === "string" ? reader.result : "";
        onConfirm({ blob, dataUrl, width, height });
        setIsProcessing(false);
      };
      reader.onerror = () => {
        setIsProcessing(false);
      };
    } catch (error) {
      console.error("Failed to crop image", error);
      setIsProcessing(false);
    }
  }, [croppedAreaPixels, imageSrc, onConfirm]);

  const zoomLabel = useMemo(() => `${zoom.toFixed(2)}x`, [zoom]);
  const confirmDisabled = isProcessing || !imageSrc || !croppedAreaPixels;
  const containerStyle: CSSProperties = useMemo(() => {
    const aspect = imageAspect ?? effectiveAspect ?? DEFAULT_ASPECT;
    return { aspectRatio: aspect, width: "100%", maxHeight: 360 };
  }, [effectiveAspect, imageAspect]);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="w-full max-w-[480px] bg-[#0f0f12] text-white border border-white/10 p-4">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">编辑上传的图片</DialogTitle>
        </DialogHeader>

        <div className="mt-2 space-y-3" onWheel={handleWheel}>
          <div className="relative w-full overflow-hidden rounded-xl bg-white/10 select-none" style={containerStyle}>
            {imageSrc ? (
              <Cropper
                key={String(effectiveAspect)}
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={effectiveAspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
                onMediaLoaded={handleMediaLoaded}
                objectFit="contain"
                restrictPosition
              />
            ) : (
              <div className="flex h-full items-center justify-center text-white/60 text-sm">暂无图片</div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-white/70">
              <span>缩放</span>
              <span>{zoomLabel}</span>
            </div>
            <Slider
              value={[zoom]}
              min={ZOOM_MIN}
              max={ZOOM_MAX}
              step={ZOOM_STEP}
              onValueChange={handleZoomSliderChange}
              disabled={!imageSrc}
            />
          </div>

          <div className="space-y-1.5">
            <div className="text-xs text-white/70">长宽比</div>
            <div className="grid grid-cols-3 gap-1.5">
              {ASPECT_OPTIONS.map((option) => {
                const isActive = aspectSelectValue === option.value;
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => handleAspectSelect(option.value)}
                    className={cn(
                      "rounded-lg border px-2 py-1.5 text-[11px] transition-all",
                      isActive
                        ? "border-white/0 bg-pink-500/30 text-white shadow-[0_0_12px_rgba(236,72,153,0.25)]"
                        : "border-white/15 bg-white/5 text-white/70 hover:bg-white/10"
                    )}
                    disabled={!imageSrc}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                className="text-[11px] px-3 text-white/70 hover:text-white"
                onClick={() => {
                  setAspectSelectValue("original");
                  setCrop({ x: 0, y: 0 });
                  setZoom(ZOOM_MIN);
                }}
                disabled={isProcessing}
              >
                重置
              </Button>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                className="text-[11px] px-3 text-white/70 hover:text-white"
                onClick={onCancel}
                disabled={isProcessing}
              >
                取消
              </Button>
              <Button className="text-[12px] px-3" onClick={handleConfirm} disabled={confirmDisabled}>
                {isProcessing ? "处理中..." : "好的"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

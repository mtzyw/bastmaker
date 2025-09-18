"use client";

import { useEffect, useMemo, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCroppedImageBlob, getImageAspect } from "@/lib/image/crop-image";

const ASPECT_OPTIONS = [
  { label: "原来的", value: "original" as const },
  { label: "1:1", value: "1:1", aspect: 1 },
  { label: "16:9", value: "16:9", aspect: 16 / 9 },
  { label: "9:16", value: "9:16", aspect: 9 / 16 },
  { label: "4:3", value: "4:3", aspect: 4 / 3 },
  { label: "3:4", value: "3:4", aspect: 3 / 4 },
];

type AspectOptionValue = (typeof ASPECT_OPTIONS)[number]["value"];

type ImageCropperDialogProps = {
  open: boolean;
  imageSrc: string | null;
  onConfirm: (payload: { blob: Blob; dataUrl: string }) => void;
  onCancel: () => void;
};

export default function ImageCropperDialog({ open, imageSrc, onConfirm, onCancel }: ImageCropperDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [selectedAspect, setSelectedAspect] = useState<AspectOptionValue>("original");
  const [originalAspect, setOriginalAspect] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!open) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setSelectedAspect("original");
      setCroppedAreaPixels(null);
    }
  }, [open]);

  useEffect(() => {
    if (!imageSrc || !open) return;
    let active = true;
    getImageAspect(imageSrc)
      .then((aspect) => {
        if (!active) return;
        setOriginalAspect(aspect);
      })
      .catch(() => setOriginalAspect(null));
    return () => {
      active = false;
    };
  }, [imageSrc, open]);

  const aspectValue = useMemo(() => {
    if (selectedAspect === "original") {
      return originalAspect ?? 1;
    }
    const option = ASPECT_OPTIONS.find((item) => item.value === selectedAspect);
    return option?.aspect ?? originalAspect ?? 1;
  }, [selectedAspect, originalAspect]);

  const handleCropComplete = (_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  };

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      setIsProcessing(true);
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels);
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const dataUrl = typeof reader.result === "string" ? reader.result : "";
        onConfirm({ blob, dataUrl });
        setIsProcessing(false);
      };
      reader.onerror = () => {
        setIsProcessing(false);
      };
    } catch (error) {
      console.error("Failed to crop image", error);
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setSelectedAspect("original");
    setCroppedAreaPixels(null);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="w-[min(85vw,460px)] max-w-full bg-[#0f0f12] text-white border border-white/10 p-4">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">编辑上传的图片</DialogTitle>
        </DialogHeader>

        <div className="mt-3 space-y-4">
          <div
            className="relative w-full overflow-hidden rounded-xl bg-black/80 max-h-[60vh]"
            style={{ aspectRatio: Math.max(aspectValue, 0.1) }}
          >
            {imageSrc ? (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspectValue}
                onCropChange={setCrop}
                onZoomChange={(value) => setZoom(value)}
                onCropComplete={handleCropComplete}
                objectFit="contain"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-white/60 text-sm">暂无图片</div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/80">缩放</span>
              <span className="text-xs text-white/50">{zoom.toFixed(2)}x</span>
            </div>
            <Slider value={[zoom]} min={1} max={3} step={0.01} onValueChange={(values) => setZoom(values[0] ?? 1)} />
          </div>

          <div className="space-y-2">
            <div className="text-sm text-white/80">长宽比</div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {ASPECT_OPTIONS.map((option) => {
                const isActive = selectedAspect === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedAspect(option.value)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-xs transition-all",
                      isActive
                        ? "border-white/0 bg-pink-500/30 text-white shadow-[0_0_12px_rgba(236,72,153,0.25)]"
                        : "border-white/15 bg-white/5 text-white/70 hover:bg-white/10"
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className="text-white/70 hover:text-white"
                onClick={handleReset}
                disabled={isProcessing}
              >
                重置
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" className="text-white/70 hover:text-white" onClick={onCancel} disabled={isProcessing}>
                取消
              </Button>
              <Button onClick={handleConfirm} disabled={isProcessing || !imageSrc}>
                {isProcessing ? "处理中..." : "好的"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

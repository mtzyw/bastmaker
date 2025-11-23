"use client";

import { CSSProperties, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { EyeIcon, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export type ImageGridItem = {
  id: string;
  url: string;
  source: "local" | "remote";
  uploading?: boolean;
  error?: string | null;
};

type ImageGridUploaderLabels = {
  title: string;
  uploading: string;
  addLabel: string;
  addAriaLabel: string;
  imageAlt: string;
  previewAlt: string;
  closePreview: string;
};

type ImageGridUploaderProps = {
  items: ImageGridItem[];
  onAdd?: (files: File[]) => void;
  onRemove?: (id: string) => void;
  tileSize?: number;
  className?: string;
  maxCount?: number;
  labels?: ImageGridUploaderLabels;
};

const DEFAULT_LABELS: ImageGridUploaderLabels = {
  title: "Reference image uploads",
  uploading: "Uploading...",
  addLabel: "+ Add",
  addAriaLabel: "Add images",
  imageAlt: "Uploaded image",
  previewAlt: "Preview",
  closePreview: "Close preview",
};

export default function ImageGridUploader({
  items,
  onAdd,
  onRemove,
  tileSize = 120,
  className,
  maxCount = 8,
  labels,
}: ImageGridUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<{ url: string; id: string } | null>(null);
  const tileStyle = {
    width: "100%",
    maxWidth: `${tileSize}px`,
  } satisfies CSSProperties;
  const mergedLabels = useMemo(() => ({ ...DEFAULT_LABELS, ...labels }), [labels]);

  const remainingCapacity = Math.max(0, maxCount - items.length);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }
    const limited = Array.from(files).slice(0, remainingCapacity);
    if (limited.length > 0) {
      onAdd?.(limited);
    }
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleRemove = (id: string) => {
    onRemove?.(id);
  };

  return (
    <div className={className}>
      <div className="mb-2 text-sm text-white/80">{mergedLabels.title}</div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="group relative aspect-square w-full rounded-lg overflow-hidden border border-white/15 bg-black/20"
            style={tileStyle}
          >
            <Image
              src={item.url}
              alt={mergedLabels.imageAlt}
              fill
              sizes="(max-width: 768px) 25vw, 120px"
              className="object-cover"
            />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute top-1 left-1 flex gap-1">
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-7 w-7 bg-black/50 hover:bg-black/60 border-white/20 text-white"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setPreview({ url: item.url, id: item.id });
                  }}
                >
                  <EyeIcon className="w-4 h-4" />
                </Button>
              </div>
              <div className="absolute top-1 right-1">
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-7 w-7 bg-black/50 hover:bg-black/60 border-white/20 text-white"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    handleRemove(item.id);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {item.uploading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-xs text-white/80">
                {mergedLabels.uploading}
              </div>
            ) : null}
            {item.error ? (
              <div className="absolute inset-x-0 bottom-0 bg-red-600/80 text-[11px] text-white px-2 py-1">
                {item.error}
              </div>
            ) : null}
          </div>
        ))}

        {remainingCapacity > 0 ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="group relative aspect-square w-full rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center"
            aria-label={mergedLabels.addAriaLabel}
            style={tileStyle}
          >
            <span className="text-white/70 group-hover:text-white text-sm">{mergedLabels.addLabel}</span>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(event) => handleFiles(event.target.files)}
            />
          </button>
        ) : null}
      </div>

      <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent hideClose className="w-auto max-w-none p-0 bg-transparent border-0 shadow-none">
          {preview ? (
            <div className="relative inline-block p-4 bg-black/90 rounded-xl">
              <img
                src={preview.url}
                alt={mergedLabels.previewAlt}
                className="block w-auto h-auto max-w-[85vw] max-h-[85vh] rounded-lg"
              />
              <button
                aria-label={mergedLabels.closePreview}
                onClick={() => setPreview(null)}
                className="absolute top-2 right-2 rounded-full bg-white/90 text-black hover:bg-white p-1.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

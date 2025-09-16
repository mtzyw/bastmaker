"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { EyeIcon, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
} from "@/components/ui/dialog";

type ImageItem = {
  id: string;
  file: File;
  url: string;
};

export default function ImageGridUploader({
  onChange,
  tileSize = 120,
  className,
}: {
  onChange?: (files: File[]) => void;
  tileSize?: number;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newItems: ImageItem[] = Array.from(files).map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
      file,
      url: URL.createObjectURL(file),
    }));
    setImages((prev) => {
      const next = [...prev, ...newItems];
      onChange?.(next.map((i) => i.file));
      return next;
    });
    // Clear value so selecting the same file again still triggers change
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const next = prev.filter((i) => i.id !== id);
      onChange?.(next.map((i) => i.file));
      return next;
    });
  };

  return (
    <div className={className}>
      <div className="mb-2 text-sm text-white/80">参考图上传</div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {/* Upload tile */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="group relative aspect-square rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center"
          aria-label="Add images"
        >
          <span className="text-white/70 group-hover:text-white text-sm">+Add</span>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </button>

        {/* Image tiles */}
        {images.map((img) => (
          <div
            key={img.id}
            className="group relative aspect-square rounded-lg overflow-hidden border border-white/15 bg-black/20"
          >
            <Image
              src={img.url}
              alt="uploaded"
              fill
              sizes="(max-width: 768px) 25vw, 120px"
              className="object-cover"
            />
            {/* Hover controls */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute top-1 left-1 flex gap-1">
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-7 w-7 bg-black/50 hover:bg-black/60 border-white/20 text-white"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setPreviewUrl(img.url);
                    setOpen(true);
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
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeImage(img.id);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogPortal>
          <DialogOverlay />
          <DialogContent className="w-auto max-w-none p-0 bg-black/95 rounded-lg">
            {previewUrl && (
              <img
                src={previewUrl}
                alt="preview"
                className="block w-auto h-auto max-w-[85vw] max-h-[85vh]"
              />
            )}
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </div>
  );
}

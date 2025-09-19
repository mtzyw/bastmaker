"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ImageCropperDialog from "@/components/ai/ImageCropperDialog";
import { Trash2 } from "lucide-react";

export type ImageReferenceValue = {
  file: File;
  previewUrl: string;
  fileName: string;
};

type ImageReferenceUploaderProps = {
  label?: string;
  className?: string;
  onChange?: (value: ImageReferenceValue | null) => void;
  previewHeightClass?: string;
};

export default function ImageReferenceUploader({
  label = "参考图片",
  className,
  onChange,
  previewHeightClass = "h-36",
}: ImageReferenceUploaderProps) {
  const [imageName, setImageName] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<{ file: File; url: string } | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [cropSource, setCropSource] = useState<{ src: string; fileName: string; fileType: string } | null>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const uploadedBlobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (cropSource?.src) {
        URL.revokeObjectURL(cropSource.src);
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

  const notifyChange = (value: ImageReferenceValue | null) => {
    onChange?.(value);
  };

  const openCropperWithFile = (file: File) => {
    const nextUrl = URL.createObjectURL(file);
    if (cropSource?.src) {
      URL.revokeObjectURL(cropSource.src);
    }
    setCropSource({ src: nextUrl, fileName: file.name, fileType: file.type || "image/png" });
    setCropperOpen(true);
  };

  const handleNewUpload = (file: File) => {
    setOriginalFile(file);
    openCropperWithFile(file);
  };

  const handleCropCancel = () => {
    setCropperOpen(false);
    if (cropSource?.src) {
      URL.revokeObjectURL(cropSource.src);
    }
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
    if (cropSource?.src) {
      URL.revokeObjectURL(cropSource.src);
    }
    setCropSource(null);
    notifyChange({ file: croppedFile, previewUrl, fileName });
  };

  const resetImageSelection = () => {
    if (uploadedBlobUrlRef.current) {
      URL.revokeObjectURL(uploadedBlobUrlRef.current);
      uploadedBlobUrlRef.current = null;
    }
    setUploadedImage(null);
    setImageName(null);
    setOriginalFile(null);
    notifyChange(null);
  };

  return (
    <div className={cn("mb-4", className)}>
      <div className="text-sm mb-2">{label}</div>
      <div className="relative">
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          className={cn(
            "group relative flex w-full items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/8 transition-colors hover:bg-white/10",
            previewHeightClass
          )}
        >
          {uploadedImage ? (
            <img
              src={uploadedImage.url}
              alt="已选择的参考图"
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <div className="px-4 py-8 text-center text-xs text-white/60">点击上传参考图片</div>
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
                <span className="sr-only">移除图片</span>
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

      <ImageCropperDialog
        open={cropperOpen}
        imageSrc={cropSource?.src ?? null}
        onCancel={handleCropCancel}
        onConfirm={handleCropConfirm}
      />
    </div>
  );
}

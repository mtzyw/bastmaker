"use client";

import { useState } from "react";
import { Share2, Link as LinkIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type ShareMode = "native" | "copy";

type ShareButtonProps = {
  shareUrl: string;
  label: string;
  copySuccessLabel: string;
  className?: string;
  onShared?: (mode: ShareMode) => void;
};

export function ShareButton({
  shareUrl,
  label,
  copySuccessLabel,
  className,
  onShared,
}: ShareButtonProps) {
  const [isCopying, setIsCopying] = useState(false);
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const handleShare = async () => {
    if (canShare) {
      try {
        await navigator.share({ url: shareUrl });
        onShared?.("native");
        return;
      } catch (error) {
        console.warn("[viewer-share] native share cancelled", error);
      }
    }

    try {
      setIsCopying(true);
      if (!navigator.clipboard) {
        throw new Error("clipboard unavailable");
      }
      await navigator.clipboard.writeText(shareUrl);
      toast.success(copySuccessLabel);
      onShared?.("copy");
    } catch (error) {
      console.error("[viewer-share] failed to copy link", error);
      toast.error(copySuccessLabel);
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <Button
      variant="secondary"
      className={cn("gap-2", className)}
      onClick={handleShare}
      disabled={isCopying}
    >
      {canShare ? <Share2 className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
      {label}
    </Button>
  );
}

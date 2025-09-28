"use client";

import { useCallback, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ViewerModalProps = {
  children: ReactNode;
  className?: string;
};

export function ViewerModal({ children, className }: ViewerModalProps) {
  const router = useRouter();

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        router.back();
      }
    },
    [router]
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "max-w-[calc(100vw-2rem)] border-0 bg-transparent p-0 shadow-none sm:max-w-[64rem]",
          "sm:max-h-[90vh] sm:overflow-visible",
          className
        )}
      >
        <div className="relative">
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 z-10 rounded-full bg-black/60 text-white/80 hover:bg-black/80 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </DialogClose>
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// "use client" ensures this component runs on the client side
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";

interface CancelSubscriptionDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback to change the open state */
  onOpenChange: (open: boolean) => void;
  /** Called when the user confirms the cancellation */
  onConfirm: () => void;
}

/**
 * A premium‑styled confirmation dialog for cancelling a subscription.
 *
 * Design notes:
 * - Uses the project's existing Radix‑based Dialog component to keep the UI consistent.
 * - Background is a dark glass‑morphism overlay (`bg-[#0a0a0b]`) matching the rest of the app.
 * - Primary action button uses the same gradient‑border style as other CTA buttons.
 * - A close (X) icon is placed at the top‑right for quick dismissal.
 */
export function CancelSubscriptionDialog({
  open,
  onOpenChange,
  onConfirm,
}: CancelSubscriptionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        className="max-w-md rounded-[16px] border border-white/10 bg-[#0a0a0b] p-6 shadow-2xl"
      >
        {/* Close icon */}
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-90 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          <X className="h-5 w-5 text-white" />
          <span className="sr-only">Close</span>
        </DialogClose>

        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-white">
            Cancel Subscription
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="mt-2 text-sm text-white/70">
          Are you sure you want to cancel your subscription? It will remain active until the end of the current period.
        </DialogDescription>

        <DialogFooter className="mt-6 space-x-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-white/20 text-white hover:bg-white/10"
          >
            Keep Subscription
          </Button>
          <Button
            variant="default"
            onClick={() => {
              onConfirm();
            }}
            className="bg-[#dc2e5a] text-white hover:bg-[#e04e78]"
          >
            Cancel Subscription
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

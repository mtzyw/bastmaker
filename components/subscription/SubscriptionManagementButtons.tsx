"use client";

import { cancelSubscription, resumeSubscription } from "@/actions/subscription/manage";
import { CancelSubscriptionDialog } from "@/components/subscription/CancelSubscriptionDialog";
import { Button } from "@/components/ui/button";
import { Loader2, PlayCircle, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";

interface SubscriptionManagementButtonsProps {
  subscriptionId: string;
  cancelAtPeriodEnd: boolean;
}

export function SubscriptionManagementButtons({
  subscriptionId,
  cancelAtPeriodEnd,
}: SubscriptionManagementButtonsProps) {
  const t = useTranslations("Subscription");
  // Local state mirrors the prop but can be updated after a successful cancel
  const [localCancelAtPeriodEnd, setLocalCancelAtPeriodEnd] = useState(cancelAtPeriodEnd);
  // Keep local state in sync if parent updates the prop
  useEffect(() => {
    setLocalCancelAtPeriodEnd(cancelAtPeriodEnd);
  }, [cancelAtPeriodEnd]);
  const [isPending, startTransition] = useTransition();
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  const handleCancel = () => {
    // Open confirmation dialog instead of native confirm
    setIsCancelDialogOpen(true);
  };

  const handleConfirmCancel = () => {
    startTransition(async () => {
      const res = await cancelSubscription(subscriptionId);
      if (!res.success) {
        alert(res.error || "Failed to cancel subscription");
        setIsCancelDialogOpen(false);
        return;
      }
      // Mark as cancelled locally so UI shows "Resume Subscription"
      setLocalCancelAtPeriodEnd(true);
      setIsCancelDialogOpen(false);
    });
  };

  const handleResume = () => {
    startTransition(async () => {
      const res = await resumeSubscription(subscriptionId);
      if (!res.success) {
        alert(res.error || "Failed to resume subscription");
        return;
      }
      // After successful resume, show Cancel button again
      setLocalCancelAtPeriodEnd(false);
    });
  };

  return (
    <>
      <div className="flex flex-wrap gap-4 items-center">
        {localCancelAtPeriodEnd ? (
          <Button
            variant="outline"
            onClick={handleResume}
            disabled={isPending}
            className="h-11 px-6 gap-2 font-medium text-white hover:text-black"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
            <span>{t("management.resumeButton")}</span>
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isPending}
            className="h-11 px-6 gap-2 font-medium text-white hover:text-black"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            <span>{t("management.cancelButton")}</span>
          </Button>
        )}
      </div>

      {/* Confirmation Dialog */}
      <CancelSubscriptionDialog
        open={isCancelDialogOpen}
        onOpenChange={setIsCancelDialogOpen}
        onConfirm={handleConfirmCancel}
      />
    </>
  );
}

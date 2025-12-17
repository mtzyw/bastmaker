"use client";

import type { UserBenefits } from "@/actions/usage/benefits";
import { useSubscriptionPopup } from "@/components/providers/SubscriptionPopupProvider";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useCallback } from "react";

type DownloadAccessOptions = {
  benefits?: UserBenefits | null;
  isLoading?: boolean;
};

export function useDownloadAccess(options?: DownloadAccessOptions) {
  const { openSubscriptionPopup } = useSubscriptionPopup();
  const t = useTranslations("Viewer");
  const { benefits, isLoading } = options ?? {};

  const ensureDownloadAllowed = useCallback(() => {
    if (isLoading) {
      toast.error(
        t("downloadCheckingSubscription", {
          default: "Checking subscription status. Please try again in a moment.",
        })
      );
      return false;
    }

    const isPaidUser =
      benefits?.subscriptionStatus === "active" ||
      benefits?.subscriptionStatus === "trialing";

    if (isPaidUser) {
      return true;
    }

    toast.error(
      t("downloadRequiresSubscription", {
        default: "Upgrade your plan to download this output.",
      })
    );
    openSubscriptionPopup();
    return false;
  }, [benefits?.subscriptionStatus, isLoading, openSubscriptionPopup, t]);

  return { ensureDownloadAllowed };
}

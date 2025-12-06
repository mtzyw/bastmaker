"use client";

import { SubscriptionPopup } from "@/components/pricing/SubscriptionPopup";
import { useUserBenefits } from "@/hooks/useUserBenefits";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type SubscriptionPopupContextValue = {
  openSubscriptionPopup: () => void;
  closeSubscriptionPopup: () => void;
};

const SubscriptionPopupContext =
  createContext<SubscriptionPopupContextValue | null>(null);

export function SubscriptionPopupProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingOpen, setPendingOpen] = useState(false);
  const { benefits, isLoading } = useUserBenefits();
  const isPaidUser =
    benefits?.subscriptionStatus === "active" ||
    benefits?.subscriptionStatus === "trialing";

  const openSubscriptionPopup = useCallback(() => {
    if (!isLoading && isPaidUser) {
      return;
    }

    if (!isLoading && !isPaidUser) {
      setIsOpen(true);
      return;
    }

    setPendingOpen(true);
  }, [isLoading, isPaidUser]);

  const closeSubscriptionPopup = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!pendingOpen || isLoading) {
      return;
    }

    if (isPaidUser) {
      setPendingOpen(false);
      setIsOpen(false);
      return;
    }

    setIsOpen(true);
    setPendingOpen(false);
  }, [pendingOpen, isLoading, isPaidUser]);

  const value = useMemo<SubscriptionPopupContextValue>(
    () => ({
      openSubscriptionPopup,
      closeSubscriptionPopup,
    }),
    [closeSubscriptionPopup, openSubscriptionPopup]
  );

  return (
    <SubscriptionPopupContext.Provider value={value}>
      {children}
      <SubscriptionPopup open={isOpen} onOpenChange={setIsOpen} />
    </SubscriptionPopupContext.Provider>
  );
}

export function useSubscriptionPopup() {
  const context = useContext(SubscriptionPopupContext);
  if (!context) {
    throw new Error(
      "useSubscriptionPopup must be used within a SubscriptionPopupProvider"
    );
  }
  return context;
}

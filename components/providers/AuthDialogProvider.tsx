"use client";

import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { AuthDialog, type AuthDialogTab } from "@/components/auth/AuthDialog";

type AuthDialogContextValue = {
  openAuthDialog: (tab?: AuthDialogTab) => void;
  closeAuthDialog: () => void;
  isAuthDialogOpen: boolean;
};

const AuthDialogContext = createContext<AuthDialogContextValue | null>(null);

export function AuthDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [initialTab, setInitialTab] = useState<AuthDialogTab>("signin");

  const openAuthDialog = useCallback((tab: AuthDialogTab = "signin") => {
    setInitialTab(tab);
    setOpen(true);
  }, []);

  const closeAuthDialog = useCallback(() => setOpen(false), []);

  const value = useMemo<AuthDialogContextValue>(
    () => ({
      openAuthDialog,
      closeAuthDialog,
      isAuthDialogOpen: open,
    }),
    [open, openAuthDialog, closeAuthDialog]
  );

  return (
    <AuthDialogContext.Provider value={value}>
      {children}
      <AuthDialog open={open} onOpenChange={setOpen} initialTab={initialTab} />
    </AuthDialogContext.Provider>
  );
}

export function useAuthDialog() {
  const context = useContext(AuthDialogContext);
  if (!context) {
    throw new Error("useAuthDialog must be used within an AuthDialogProvider");
  }
  return context;
}

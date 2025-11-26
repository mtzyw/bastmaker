"use client";

import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { AuthDialog, type AuthDialogTab } from "@/components/auth/AuthDialog";

type AuthDialogContextValue = {
  openAuthDialog: (tab?: AuthDialogTab, redirectPath?: string) => void;
  closeAuthDialog: () => void;
  isAuthDialogOpen: boolean;
};

const AuthDialogContext = createContext<AuthDialogContextValue | null>(null);

export function AuthDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [initialTab, setInitialTab] = useState<AuthDialogTab>("signin");
  const [redirectPath, setRedirectPath] = useState<string | undefined>(undefined);

  const openAuthDialog = useCallback(
    (tab: AuthDialogTab = "signin", newRedirectPath?: string) => {
      setInitialTab(tab);
      if (newRedirectPath) {
        setRedirectPath(newRedirectPath);
      } else if (typeof window !== "undefined") {
        const path = window.location.pathname + window.location.search;
        setRedirectPath(path);
      } else {
        setRedirectPath(undefined);
      }
      setOpen(true);
    },
    []
  );

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
      <AuthDialog
        open={open}
        onOpenChange={setOpen}
        initialTab={initialTab}
        redirectPath={redirectPath}
      />
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

"use client";

import LoginPage from "@/app/[locale]/(basic-layout)/login/LoginPage";
import SignInPage from "@/app/[locale]/(basic-layout)/sign-in/SignInPage";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import { ReactNode, useEffect, useMemo, useState } from "react";

export type AuthDialogTab = "signin" | "signup";

type AuthDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: AuthDialogTab;
  footerSlot?: ReactNode;
  redirectPath?: string;
};

export function AuthDialog({
  open,
  onOpenChange,
  initialTab = "signin",
  footerSlot,
  redirectPath,
}: AuthDialogProps) {
  const t = useTranslations("Auth");
  const [activeTab, setActiveTab] = useState<AuthDialogTab>(initialTab);

  useEffect(() => {
    if (!open) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);

  const tabLabels = useMemo(
    () => ({
      signin: t("actions.login"),
      signup: t("actions.signUp"),
    }),
    [t]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-none bg-transparent p-0 text-white shadow-none md:max-h-[90vh]">
        <DialogTitle className="sr-only">Authentication Dialog</DialogTitle>
        <div className="rounded-[28px] border border-white/10 bg-[#050505]/95 p-4 sm:p-4.5 md:p-5">
          <div className="space-y-1 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/50">
              Bestmaker
            </p>
            <h2 className="text-lg font-semibold tracking-tight text-white md:text-xl">
              {tabLabels.signin} / {tabLabels.signup}
            </h2>
            <p className="text-xs text-white/65">
              {t("dialogDescription")}
            </p>
          </div>
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as AuthDialogTab)}
            className="mt-5 w-full text-white"
          >
            <div className="flex w-full justify-center">
              <TabsList className="flex w-full max-w-[380px] items-center justify-center gap-2 rounded-2xl bg-white/5 p-1 text-white">
                <TabsTrigger
                  value="signin"
                  className="flex-1 rounded-xl px-4 py-1.5 text-xs font-semibold text-white/80 transition data-[state=active]:bg-[linear-gradient(to_right,rgb(18,194,233),rgb(196,113,237),rgb(246,79,89))] data-[state=active]:text-white data-[state=active]:shadow-lg md:text-sm"
                >
                  {tabLabels.signin}
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="flex-1 rounded-xl px-4 py-1.5 text-xs font-semibold text-white/80 transition data-[state=active]:bg-[linear-gradient(to_right,rgb(18,194,233),rgb(196,113,237),rgb(246,79,89))] data-[state=active]:text-white data-[state=active]:shadow-lg md:text-sm"
                >
                  {tabLabels.signup}
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="signin" className="mt-6 focus-visible:outline-none">
              <div className="max-h-[70vh] overflow-y-auto pr-1">
                <SignInPage
                  variant="dialog"
                  onRequestSwitchMode={() => setActiveTab("signup")}
                  redirectPath={redirectPath}
                />
              </div>
            </TabsContent>
            <TabsContent value="signup" className="mt-6 focus-visible:outline-none">
              <div className="max-h-[70vh] overflow-y-auto pr-1">
                <LoginPage
                  variant="dialog"
                  onRequestSwitchMode={() => setActiveTab("signin")}
                  redirectPath={redirectPath}
                />
              </div>
            </TabsContent>
          </Tabs>
          {footerSlot}
        </div>
      </DialogContent>
    </Dialog>
  );
}

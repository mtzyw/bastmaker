"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { GoogleIcon } from "@/components/icons";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type SignInPageVariant = "page" | "dialog";
type SwitchHandler = (mode: "signin" | "signup") => void;

type SignInPageProps = {
  variant?: SignInPageVariant;
  onRequestSwitchMode?: SwitchHandler;
  redirectPath?: string;
};

export default function SignInPage({
  variant = "page",
  onRequestSwitchMode,
  redirectPath,
}: SignInPageProps = {}) {
  const router = useRouter();
  const { user, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | undefined>();
  const [showTurnstile, setShowTurnstile] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const t = useTranslations("Auth");
  const searchParams = useSearchParams();
  const next = redirectPath ?? searchParams?.get("next") ?? undefined;

  useEffect(() => {
    if (user) {
      router.replace(next || "/");
    }
  }, [user, router, next]);

  const handlePasswordLogin = async () => {
    if (!email || !password) {
      toast.error(t("messages.enterEmailAndPassword"));
      return;
    }
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !captchaToken) {
      toast.error(t("messages.completeCaptcha"));
      return;
    }
    setIsLoggingIn(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: captchaToken ? { captchaToken } : undefined,
      });
      if (error) throw error;
      toast.success(t("messages.loginSuccess"));
      router.replace(next || "/");
    } catch (e: any) {
      toast.error(t("messages.loginFailed"), { description: e?.message });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await signInWithGoogle(next || "");
      if (error) throw error;
    } catch (error) {
      toast.error(t("Toast.Google.errorTitle"), {
        description: t("Toast.Google.errorDescription"),
      });
    }
  };

  const controlHeight = variant === "dialog" ? "h-11" : "h-12";
  const inputClass = `${controlHeight} w-full rounded-xl border border-white/15 bg-white/[0.08] px-4 text-sm text-white placeholder:text-white/40 focus:border-white focus:bg-white/10 focus:outline-none`;
  const wrapperClass =
    variant === "dialog"
      ? "flex w-full justify-center px-2 py-2 text-white"
      : "flex min-h-screen w-full items-center justify-center bg-[#1c1c1a] px-4 py-16 text-white";
  const shellWidth = variant === "dialog" ? "max-w-md" : "max-w-3xl";
  const gradientWidth = variant === "dialog" ? "max-w-sm -mb-2" : "max-w-lg -mb-8";
  const cardPadding = variant === "dialog" ? "px-4 pb-4 pt-10" : "px-8 pb-12 pt-24";
  const headingSize = variant === "dialog" ? "text-base md:text-lg" : "text-3xl md:text-4xl";
  const subTextSize = variant === "dialog" ? "text-xs" : "text-sm md:text-base";
  const badgeSize = variant === "dialog" ? "text-[9px]" : "text-sm";
  const subBadgeSize = variant === "dialog" ? "text-[9px]" : "text-xs";
  const innerMaxWidth = variant === "dialog" ? "max-w-xs" : "max-w-lg";
  const sectionGap = variant === "dialog" ? "gap-3" : "gap-8";
  const titleSpacing = variant === "dialog" ? "space-y-1.5" : "space-y-3";
  const ctaPadding = variant === "dialog" ? "px-4 py-2" : "px-8 py-4";
  const contentStackSpacing = variant === "dialog" ? "space-y-4" : "space-y-8";

  const turnstile = useMemo(() => {
    if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || !showTurnstile) return null;
    return (
      <div className="flex justify-center">
        <Turnstile
          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
          onSuccess={(token) => setCaptchaToken(token)}
        />
      </div>
    );
  }, [showTurnstile]);

  if (user) {
    return (
      <div
        className={
          variant === "dialog"
            ? "flex w-full items-center justify-center py-8"
            : "flex min-h-screen items-center justify-center"
        }
      >
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  const content = (
    <div className="relative w-full">
      <div
        className={`relative rounded-[32px] border border-white/10 bg-[#161616] ${cardPadding} shadow-[0_30px_80px_rgba(15,23,42,0.45)] backdrop-blur`}
      >
        <div className={`flex flex-col items-center ${sectionGap} text-center`}>
          <div className={`${titleSpacing}`}>
            <h1 className={`${headingSize} font-semibold tracking-tight`}>{t("headlines.signin")}</h1>
            <p className={`${subTextSize} text-white/70`}>{t("subHeadlines.signin")}</p>
          </div>

          <div className={`w-full ${innerMaxWidth} ${contentStackSpacing} text-left text-white/85`}>
            <div className="flex justify-center">
              <Button
                onClick={handleGoogleLogin}
                className={`${controlHeight} w-full rounded-xl border border-white/15 bg-white/[0.08] font-semibold text-white hover:bg-white/15`}
              >
                <GoogleIcon className="mr-2 h-4 w-4" />
                {t("signInMethods.signInWithGoogle")}
              </Button>
            </div>

            <div className="flex items-center gap-4 text-xs text-white/40">
              <span className="h-px flex-1 bg-white/10" />
              <span>{t("signInMethods.or")}</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-white/40">
                  {t("labels.email")}
                </label>
                <Input
                  type="email"
                  placeholder={t("placeholders.email")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setShowTurnstile(true)}
                  className={`${inputClass} mt-1`}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-white/40">
                  {t("labels.password")}
                </label>
                <Input
                  type="password"
                  placeholder={t("placeholders.password")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} mt-1`}
                />
              </div>

              {turnstile}

              <Button
                onClick={handlePasswordLogin}
                disabled={isLoggingIn}
                className={`${controlHeight} w-full rounded-xl bg-white text-sm font-semibold text-[#232323] hover:bg-white/90`}
              >
                {t("actions.login")} {isLoggingIn && <Loader2 className="ml-2 h-4 w-4 animate-spin text-[#232323]" />}
              </Button>

              {onRequestSwitchMode ? (
                <div className="text-center text-xs text-white/50">
                  {t("messages.noAccount")}
                  <button
                    type="button"
                    onClick={() => onRequestSwitchMode("signup")}
                    className="ml-1 font-semibold text-[#dc2e5a] underline-offset-4 hover:underline"
                  >
                    {t("actions.signUp")}
                  </button>
                </div>
              ) : (
                <p className="text-center text-xs text-white/50">
                  {t("messages.noAccount")}
                  <Link href="/sign-up" className="ml-1 font-semibold text-[#dc2e5a]">
                    {t("actions.signUp")}
                  </Link>
                </p>
              )}
            </div>
          </div>

          <p className="text-center text-[11px] text-white/30">
            {t("messages.termsAgreement")}{" "}
            <Link className="text-white/50 underline underline-offset-4 hover:text-white" href="/terms-of-service">
              {t("links.terms")}
            </Link>{" "}
            {t("messages.and")}{" "}
            <Link className="text-white/50 underline underline-offset-4 hover:text-white" href="/privacy-policy">
              {t("links.privacy")}
            </Link>
            。
          </p>
        </div>
      </div>
    </div>
  );

  if (variant === "dialog") {
    return (
      <div className={wrapperClass}>
        <div className={`relative w-full ${shellWidth}`}>{content}</div>
      </div>
    );
  }

  return (
    <main className={wrapperClass}>
      <div className={`relative w-full ${shellWidth}`}>{content}</div>
    </main>
  );
}

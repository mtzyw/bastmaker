"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { Loader2, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { event as trackAnalyticsEvent } from "@/gtag";
import { GoogleIcon } from "@/components/icons";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type SignupStep = "email" | "verify" | "details";
type PendingAction = "send-code" | null;
type LoginPageVariant = "page" | "dialog";
type LoginPageMode = "signup" | "signin";
type SwitchHandler = (mode: "signin" | "signup") => void;

type LoginPageProps = {
  variant?: LoginPageVariant;
  mode?: LoginPageMode;
  onRequestSwitchMode?: SwitchHandler;
  redirectPath?: string;
};

export default function LoginPage({
  variant = "page",
  mode = "signup",
  onRequestSwitchMode,
  redirectPath,
}: LoginPageProps = {}) {
  const router = useRouter();
  const { user, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<SignupStep>("email");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showTurnstile, setShowTurnstile] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [captchaMountKey, setCaptchaMountKey] = useState(0);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

  const t = useTranslations("Auth");
  const searchParams = useSearchParams();
  const next = redirectPath ?? searchParams.get("next") ?? undefined;

  useEffect(() => {
    if (user) {
      router.replace(next || "/");
    }
  }, [user, router, next]);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const id = setInterval(() => {
      setResendSeconds((s) => (s > 1 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [resendSeconds]);

  const sendVerificationCode = async (captchaToken?: string) => {
    const response = await fetch("/api/auth/signup/send-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, captchaToken }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result?.error || t("messages.sendCodeFailed"));
    }

    setStep("verify");
    setVerificationToken(null);
    setCode("");
    setResendSeconds(30);
    toast.success(t("messages.codeSentTo") + " " + email);
    return true;
  };

  const handleTurnstileError = () => {
    setIsSending(false);
    setShowTurnstile(false);
    setPendingAction(null);
    toast.error(t("messages.captchaFailed"));
  };

  const handleTurnstileSuccess = async (token: string) => {
    if (pendingAction !== "send-code") return;
    try {
      await sendVerificationCode(token);
    } catch (error: any) {
      toast.error(t("messages.sendCodeFailed"), { description: error?.message });
    } finally {
      setIsSending(false);
      setShowTurnstile(false);
      setPendingAction(null);
    }
  };

  const handleSendCode = async () => {
    if (!email) {
      toast.error(t("messages.enterEmail"));
      return;
    }

    setIsSending(true);

    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
      setPendingAction("send-code");
      setShowTurnstile(true);
      setCaptchaMountKey((k) => k + 1);
      return;
    }

    try {
      await sendVerificationCode();
    } catch (error: any) {
      if (error?.message === "Registration with this email domain is not supported.") {
        toast.error("Failed to send verification code", {
          description: error.message,
          style: {
            background: "#ef4444", // red-500
            color: "white",
            border: "none",
          },
          descriptionClassName: "text-white",
        });
      } else {
        toast.error(t("messages.sendCodeFailed"), { description: error?.message });
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleVerify = async () => {
    if (!email || !code) {
      toast.error(t("messages.enterEmailAndPassword")); // Reusing this message or should add a new one? "Please enter email and code"
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch("/api/auth/signup/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || t("messages.verifyCodeFailed"));
      }

      setVerificationToken(result.token);
      toast.success(t("messages.verifyEmailSuccess"));
      setStep("details");
      setCode("");
    } catch (error: any) {
      toast.error("Verification failed", { description: error?.message });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCompleteSignup = async () => {
    if (!username || !password) {
      toast.error(t("messages.enterUsernameAndPassword"));
      return;
    }
    if (!verificationToken) {
      toast.error(t("messages.completeEmailVerification"));
      return;
    }

    setIsCompleting(true);
    try {
      const response = await fetch("/api/auth/signup/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: verificationToken,
          username,
          password,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || t("messages.signupFailed"));
      }

      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      toast.success(t("messages.signupSuccess"));
      trackAnalyticsEvent({
        action: "sign_up",
        category: "auth",
        label: "email_code",
        value: 1,
      });
      router.replace(next || "/");
    } catch (error: any) {
      toast.error(t("messages.signupFailed"), { description: error?.message });
    } finally {
      setIsCompleting(false);
    }
  };

  const handleUseDifferentEmail = () => {
    setStep("email");
    setCode("");
    setUsername("");
    setPassword("");
    setResendSeconds(0);
    setPendingAction(null);
    setShowTurnstile(false);
    setVerificationToken(null);
  };

  const handleResendCode = () => {
    if (isSending || resendSeconds > 0) return;
    void handleSendCode();
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

  const renderTurnstile = () => {
    if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || !showTurnstile) {
      return null;
    }

    return (
      <div className="flex justify-center">
        <Turnstile
          key={captchaMountKey}
          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
          onSuccess={handleTurnstileSuccess}
          onError={handleTurnstileError}
          onExpire={handleTurnstileError}
        />
      </div>
    );
  };

  if (user) {
    return (
      <div
        className={
          variant === "dialog"
            ? "flex w-full items-center justify-center py-10"
            : "flex min-h-screen items-center justify-center"
        }
      >
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  const isSignupMode = mode === "signup";
  const headline = (() => {
    if (isSignupMode) {
      return step === "details" ? t("headlines.signupDetails") : t("headlines.signup");
    }
    return t("headlines.signin");
  })();
  const subHeadline = (() => {
    if (isSignupMode) {
      return step === "details"
        ? t("subHeadlines.signupDetails")
        : t("subHeadlines.signup");
    }
    return t("subHeadlines.signin");
  })();
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
  const fieldStackSpacing = variant === "dialog" ? "space-y-2.5" : "space-y-4";
  const verifyCardPadding = variant === "dialog" ? "px-3 py-2" : "px-4 py-3";

  const content = (
    <div className="relative w-full">
      {isSignupMode && (
        <div
          className={`relative z-10 mx-auto ${gradientWidth} w-full rounded-3xl bg-[linear-gradient(to_right,_rgb(18,194,233),_rgb(196,113,237),_rgb(246,79,89))] ${ctaPadding} text-center text-white shadow-[0_20px_60px_rgba(123,97,255,0.35)]`}
        >
          <p className={`${badgeSize} font-semibold leading-relaxed`}>
            {t("banner.credits", { credits: process.env.NEXT_PUBLIC_WELCOME_CREDITS ?? "0" })}
          </p>
          <p className={`${subBadgeSize} font-medium text-white/85`}>{t("banner.subtitle")}</p>
        </div>
      )}

      <div
        className={`relative rounded-[32px] border border-white/10 bg-[#161616] ${cardPadding} shadow-[0_30px_80px_rgba(15,23,42,0.45)] backdrop-blur`}
      >
        <div className={`flex flex-col items-center ${sectionGap} text-center`}>
          <div className={`${titleSpacing}`}>
            <h1 className={`${headingSize} font-semibold tracking-tight`}>{headline}</h1>
            <p className={`${subTextSize} text-white/70`}>{subHeadline}</p>
          </div>

          <div className={`w-full ${innerMaxWidth} ${contentStackSpacing} text-left text-white/85`}>
            {step === "email" && (
              <>
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

                <div className={fieldStackSpacing}>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-white/40">
                      {t("labels.email")}
                    </label>
                    <Input
                      type="email"
                      placeholder={t("placeholders.email")}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  {renderTurnstile()}

                  <Button
                    onClick={handleSendCode}
                    disabled={isSending}
                    className={`${controlHeight} w-full rounded-xl bg-white text-sm font-semibold text-[#232323] hover:bg-white/90`}
                  >
                    {t("actions.sendCode")} {isSending && <Loader2 className="ml-2 h-4 w-4 animate-spin text-[#232323]" />}
                  </Button>

                  {isSignupMode ? (
                    onRequestSwitchMode ? (
                      <div className="text-center text-xs text-white/50">
                        {t("messages.hasAccount")}
                        <button
                          type="button"
                          onClick={() => onRequestSwitchMode("signin")}
                          className="ml-1 font-semibold text-[#dc2e5a] underline-offset-4 hover:underline"
                        >
                          {t("actions.directLogin")}
                        </button>
                      </div>
                    ) : (
                      <p className="text-center text-xs text-white/50">
                        {t("messages.hasAccount")}
                        <Link href="/sign-in" className="ml-1 font-semibold text-[#dc2e5a]">
                          {t("actions.directLogin")}
                        </Link>
                      </p>
                    )
                  ) : null}
                </div>
              </>
            )}

            {step === "verify" && (
              <div className={fieldStackSpacing}>
                <div className={`rounded-2xl border border-white/10 bg-white/5 ${verifyCardPadding} text-sm text-white/80`}>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{t("messages.codeSentTo")}</span>
                  </div>
                  <p className="mt-1 break-all font-semibold text-white">{email}</p>
                </div>

                <Input
                  placeholder={t("placeholders.code")}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className={inputClass}
                />

                <Button
                  onClick={handleVerify}
                  disabled={isVerifying}
                  className={`${controlHeight} w-full rounded-xl bg-white text-sm font-semibold text-[#232323] hover:bg-white/90`}
                >
                  {t("actions.verifyEmail")} {isVerifying && <Loader2 className="ml-2 h-4 w-4 animate-spin text-[#232323]" />}
                </Button>

                {renderTurnstile()}

                <div className="flex items-center justify-between text-xs text-white/60">
                  <button
                    className="underline underline-offset-4 hover:text-white"
                    onClick={handleUseDifferentEmail}
                  >
                    {t("actions.changeEmail")}
                  </button>
                  <button
                    className="font-semibold text-[#dc2e5a]"
                    onClick={handleResendCode}
                    disabled={isSending || resendSeconds > 0}
                    title={resendSeconds > 0 ? t("messages.waitSeconds", { seconds: resendSeconds }) : undefined}
                  >
                    {resendSeconds > 0 ? t("messages.resendWait", { seconds: resendSeconds }) : t("actions.resend")}
                  </button>
                </div>
              </div>
            )}

            {step === "details" && (
              <div className={fieldStackSpacing}>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-white/40">
                    {t("labels.username")}
                  </label>
                  <Input
                    placeholder={t("placeholders.username")}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`${inputClass} mt-1`}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-white/40">
                    {t("labels.password")}
                  </label>
                  <Input
                    type="password"
                    placeholder={t("placeholders.passwordMinLength")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputClass} mt-1`}
                  />
                </div>
                <Button
                  onClick={handleCompleteSignup}
                  disabled={isCompleting}
                  className={`${controlHeight} w-full rounded-xl bg-white text-sm font-semibold text-[#232323] hover:bg-white/90`}
                >
                  {t("actions.completeSignup")} {isCompleting && <Loader2 className="ml-2 h-4 w-4 animate-spin text-[#232323]" />}
                </Button>
              </div>
            )}
          </div>

          <p className="text-center text-[11px] text-white/30">
            {t("messages.signupTermsAgreement")}{" "}
            <Link
              className="text-white/50 underline underline-offset-4 hover:text-white"
              href="/terms-of-service"
            >
              {t("links.terms")}
            </Link>{" "}
            {t("messages.and")}{" "}
            <Link
              className="text-white/50 underline underline-offset-4 hover:text-white"
              href="/privacy-policy"
            >
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

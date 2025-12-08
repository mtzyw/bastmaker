"use client";

import { event as trackAnalyticsEvent } from "@/gtag";
import { InviteGoogleButton } from "@/components/invite/InviteGoogleButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const EMAIL_ALREADY_REGISTERED = "EMAIL_ALREADY_REGISTERED";

type RequestError = Error & { code?: string; status?: number };

type Step = "email" | "verify" | "details";

type Props = {
  inviteCode: string;
  nextPath: string;
  onStepChange?: (step: Step) => void;
  googleNextPath: string;
  loginUrl: string;
};

export function InviteEmailSignup({
  inviteCode,
  nextPath,
  onStepChange,
  googleNextPath,
  loginUrl,
}: Props) {
  const router = useRouter();
  const t = useTranslations("Auth");
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  const buildRequestError = (message: string, code?: string, status?: number): RequestError => {
    const error = new Error(message) as RequestError;
    error.code = code;
    error.status = status;
    return error;
  };

  const showEmailRegisteredToast = () => {
    toast.error(t("messages.emailAlreadyRegistered"), {
      style: { background: "#ef4444", color: "#ffffff", border: "none" },
      className: "text-white",
      descriptionClassName: "text-white",
    });
  };

  const handleAuthError = (error: unknown, fallbackMessage: string) => {
    const requestError = error as RequestError | undefined;
    if (requestError?.code === EMAIL_ALREADY_REGISTERED) {
      showEmailRegisteredToast();
      return;
    }

    toast.error(requestError?.message || fallbackMessage);
  };

  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

  const sendCode = async () => {
    setIsSending(true);
    try {
      const response = await fetch("/api/auth/signup/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw buildRequestError(
          typeof result?.error === "string" ? result.error : t("messages.sendCodeFailed"),
          result?.error,
          response.status
        );
      }
      setStep("verify");
      setVerificationToken(null);
      setCode("");
      setResendSeconds(30);
      toast.success("验证码已发送，请查收邮箱");
    } catch (error: any) {
      handleAuthError(error, t("messages.sendCodeFailed"));
    } finally {
      setIsSending(false);
    }
  };

  const verifyCode = async () => {
    if (!code) {
      toast.error("请输入验证码");
      return;
    }
    setIsVerifying(true);
    try {
      const response = await fetch("/api/auth/signup/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || "验证码验证失败");
      setVerificationToken(result.token);
      setStep("details");
      toast.success("邮箱验证成功，请设置密码");
    } catch (error: any) {
      toast.error(error?.message || "验证码验证失败");
    } finally {
      setIsVerifying(false);
    }
  };

  const completeSignup = async () => {
    if (!verificationToken) {
      toast.error("请先完成邮箱验证");
      return;
    }
    if (!username || !password) {
      toast.error("请输入用户名与密码");
      return;
    }

    setIsCompleting(true);
    try {
      const response = await fetch("/api/auth/signup/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: verificationToken,
          username,
          password,
          inviteCode,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw buildRequestError(
          typeof result?.error === "string" ? result.error : t("messages.signupFailed"),
          result?.error,
          response.status
        );
      }

      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      toast.success("注册成功");
      trackAnalyticsEvent({
        action: "sign_up",
        category: "auth",
        label: "email_code",
        value: 1,
      });
      router.replace(nextPath || "/");
    } catch (error: any) {
      handleAuthError(error, t("messages.signupFailed"));
    } finally {
      setIsCompleting(false);
    }
  };

  const handleResend = () => {
    if (isSending || resendSeconds > 0) return;
    sendCode();
  };

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = setInterval(() => {
      setResendSeconds((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendSeconds]);

  return (
    <div className="space-y-6 text-left text-white/85">
      {step === "email" && (
        <>
          <label className="text-xs font-semibold uppercase tracking-wide text-white/40">
            邮箱地址
          </label>
          <Input
            type="email"
            placeholder="输入你的邮箱"
            className="h-12 w-full rounded-xl border border-white/15 bg-white/[0.08] px-4 text-sm text-white placeholder:text-white/40 focus:border-white focus:bg-white/10"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button
            className="h-12 w-full rounded-xl bg-white text-sm font-semibold text-[#232323] hover:bg-white/90"
            disabled={!email || isSending}
            onClick={sendCode}
          >
            发送验证码{" "}
            {isSending && <Loader2 className="ml-2 h-4 w-4 animate-spin text-[#232323]" />}
          </Button>
          <div className="flex items-center gap-4 text-xs text-white/40">
            <span className="h-px flex-1 bg-white/10" />
            <span>或</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <div className="space-y-3">
            <InviteGoogleButton nextPath={googleNextPath} />
          </div>

          <p className="pt-4 text-center text-xs text-white/50">
            已有账号？
            <Link href={loginUrl} className="ml-1 font-semibold text-[#dc2e5a]">
              直接登录
            </Link>
          </p>
        </>
      )}

      {step === "verify" && (
        <>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>验证码已发送到</span>
            </div>
            <p className="mt-1 break-all font-semibold text-white">{email}</p>
          </div>
          <Input
            placeholder="输入 6 位验证码"
            className="h-12 w-full rounded-xl border border-white/15 bg-white/[0.08] px-4 text-sm text-white placeholder:text-white/40 focus:border-white focus:bg-white/10"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <Button
            className="h-12 w-full rounded-xl bg-white text-sm font-semibold text-[#232323] hover:bg-white/90"
            disabled={!code || isVerifying}
            onClick={verifyCode}
          >
            验证邮箱{" "}
            {isVerifying && <Loader2 className="ml-2 h-4 w-4 animate-spin text-[#232323]" />}
          </Button>
          <div className="text-center text-xs text-white/50">
            没收到？
            <button
              className="ml-1 text-pink-400 hover:text-pink-300 disabled:text-white/30"
              onClick={handleResend}
              disabled={isSending || resendSeconds > 0}
            >
              {resendSeconds > 0 ? `重新发送 (${resendSeconds}s)` : "重新发送"}
            </button>
          </div>
        </>
      )}

      {step === "details" && (
        <>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-white/40">
                用户名
              </label>
              <Input
                placeholder="给自己取一个名字"
                className="mt-1 h-12 rounded-xl border border-white/15 bg-white/[0.08] px-4 text-sm text-white placeholder:text-white/40 focus:border-white focus:bg-white/10"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-white/40">
                密码
              </label>
              <Input
                type="password"
                placeholder="设置登录密码（至少 8 位）"
                className="mt-1 h-12 rounded-xl border border-white/15 bg-white/[0.08] px-4 text-sm text-white placeholder:text-white/40 focus:border-white focus:bg-white/10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <Button
            className="h-12 w-full rounded-xl bg-white text-sm font-semibold text-[#232323] hover:bg-white/90"
            disabled={isCompleting}
            onClick={completeSignup}
          >
            完成注册 {isCompleting && <Loader2 className="ml-2 h-4 w-4 animate-spin text-[#232323]" />}
          </Button>
        </>
      )}
    </div>
  );
}

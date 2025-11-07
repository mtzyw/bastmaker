"use client";

import { GoogleIcon } from "@/components/icons";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { Turnstile } from "@marsidev/react-turnstile";
import { Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type SignupStep = "email" | "verify" | "details";
type PendingAction = "send-code" | null;

export default function LoginPage() {
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

  const t = useTranslations("Login");
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [user, router]);

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
      throw new Error(result?.error || "发送验证码失败");
    }

    setStep("verify");
    setVerificationToken(null);
    setCode("");
    setResendSeconds(30);
    toast.success("验证码已发送，请查收邮箱");
    return true;
  };

  const handleTurnstileError = () => {
    setIsSending(false);
    setShowTurnstile(false);
    setPendingAction(null);
    toast.error("验证码校验失败，请重试。");
  };

  const handleTurnstileSuccess = async (token: string) => {
    if (pendingAction !== "send-code") return;
    try {
      await sendVerificationCode(token);
    } catch (error: any) {
      toast.error("发送验证码失败", { description: error?.message });
    } finally {
      setIsSending(false);
      setShowTurnstile(false);
      setPendingAction(null);
    }
  };

  const handleSendCode = async () => {
    if (!email) {
      toast.error("请输入邮箱地址");
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
      toast.error("发送验证码失败", { description: error?.message });
    } finally {
      setIsSending(false);
    }
  };

  const handleVerify = async () => {
    if (!email || !code) {
      toast.error("请输入邮箱和验证码");
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
        throw new Error(result?.error || "验证码验证失败");
      }

      setVerificationToken(result.token);
      toast.success("邮箱验证成功，请设置用户名和密码");
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
      toast.error("请填写用户名和密码");
      return;
    }
    if (!verificationToken) {
      toast.error("请先完成邮箱验证");
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
        throw new Error(result?.error || "注册失败");
      }

      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      toast.success("注册成功");
      router.replace(next || "/");
    } catch (error: any) {
      toast.error("注册失败", { description: error?.message });
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
    handleSendCode();
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
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  const headline = step === "details" ? "设置账号信息" : "注册你的 Bestmaker 账号";
  const subHeadline =
    step === "details"
      ? "为通过验证的邮箱设置用户名与密码，完成最后一步。"
      : "使用邮箱或社交账号创建账户，解锁更多 AI 工具与积分奖励。";
  const inputClass =
    "h-12 w-full rounded-xl border border-white/15 bg-white/[0.08] px-4 text-sm text-white placeholder:text-white/40 focus:border-white focus:bg-white/10 focus:outline-none";

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#1c1c1a] px-4 py-16 text-white">
      <div className="relative w-full max-w-3xl">
        <div className="relative z-10 mx-auto -mb-8 w-full max-w-lg rounded-3xl bg-[linear-gradient(to_right,_rgb(18,194,233),_rgb(196,113,237),_rgb(246,79,89))] px-8 py-4 text-center text-white shadow-[0_20px_60px_rgba(123,97,255,0.35)]">
          <p className="text-sm font-semibold leading-relaxed">
            新手注册立享欢迎积分与好友奖励
          </p>
          <p className="text-xs font-medium text-white/85">
            输入邮箱即可获取验证码，5 分钟内完成注册。
          </p>
        </div>

        <div className="relative rounded-[32px] border border-white/10 bg-[#161616] px-8 pb-12 pt-24 shadow-[0_30px_80px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className="flex flex-col items-center gap-8 text-center">
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{headline}</h1>
              <p className="text-sm text-white/70 md:text-base">{subHeadline}</p>
            </div>

            <div className="w-full max-w-lg space-y-8 text-left text-white/85">
              {step === "email" && (
                <>
                  <div className="flex justify-center">
                    <Button
                      onClick={handleGoogleLogin}
                      className="h-12 w-full rounded-xl border border-white/15 bg-white/[0.08] font-semibold text-white hover:bg-white/15"
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

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-white/40">
                        邮箱地址
                      </label>
                      <Input
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={inputClass}
                      />
                    </div>

                    {renderTurnstile()}

                    <Button
                      onClick={handleSendCode}
                      disabled={isSending}
                      className="h-12 w-full rounded-xl bg-white text-sm font-semibold text-[#232323] hover:bg-white/90"
                    >
                      发送验证码{" "}
                      {isSending && <Loader2 className="ml-2 h-4 w-4 animate-spin text-[#232323]" />}
                    </Button>

                    <p className="text-center text-xs text-white/50">
                      已有账号？
                      <Link href="/sign-in" className="ml-1 font-semibold text-[#dc2e5a]">
                        直接登录
                      </Link>
                    </p>
                  </div>
                </>
              )}

              {step === "verify" && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>验证码已发送到</span>
                    </div>
                    <p className="mt-1 break-all font-semibold text-white">{email}</p>
                  </div>

                  <Input
                    placeholder="输入 6 位验证码"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className={inputClass}
                  />

                  <Button
                    onClick={handleVerify}
                    disabled={isVerifying}
                    className="h-12 w-full rounded-xl bg-white text-sm font-semibold text-[#232323] hover:bg-white/90"
                  >
                    验证邮箱{" "}
                    {isVerifying && <Loader2 className="ml-2 h-4 w-4 animate-spin text-[#232323]" />}
                  </Button>

                  {renderTurnstile()}

                  <div className="flex items-center justify-between text-xs text-white/60">
                    <button
                      className="underline underline-offset-4 hover:text-white"
                      onClick={handleUseDifferentEmail}
                    >
                      换一个邮箱
                    </button>
                    <button
                      className="font-semibold text-[#dc2e5a]"
                      onClick={handleResendCode}
                      disabled={isSending || resendSeconds > 0}
                      title={resendSeconds > 0 ? `请等待 ${resendSeconds}s` : undefined}
                    >
                      {resendSeconds > 0 ? `重新发送 (${resendSeconds}s)` : "重新发送"}
                    </button>
                  </div>
                </div>
              )}

              {step === "details" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-white/40">
                      用户名
                    </label>
                    <Input
                      placeholder="给自己取一个名字"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={`${inputClass} mt-1`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-white/40">
                      密码
                    </label>
                    <Input
                      type="password"
                      placeholder="设置登录密码（至少 8 位）"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${inputClass} mt-1`}
                    />
                  </div>
                  <Button
                    onClick={handleCompleteSignup}
                    disabled={isCompleting}
                    className="h-12 w-full rounded-xl bg-white text-sm font-semibold text-[#232323] hover:bg-white/90"
                  >
                    完成注册{" "}
                    {isCompleting && <Loader2 className="ml-2 h-4 w-4 animate-spin text-[#232323]" />}
                  </Button>
                </div>
              )}
            </div>

            <p className="text-center text-[11px] text-white/30">
              注册即表示同意我们的{" "}
              <Link
                className="text-white/50 underline underline-offset-4 hover:text-white"
                href="/terms-of-service"
              >
                使用条款
              </Link>{" "}
              与{" "}
              <Link
                className="text-white/50 underline underline-offset-4 hover:text-white"
                href="/privacy-policy"
              >
                隐私政策
              </Link>
              。
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

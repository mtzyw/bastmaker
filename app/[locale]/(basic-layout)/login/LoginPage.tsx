"use client";

import { GoogleIcon } from "@/components/icons";
import { useAuth } from "@/components/providers/AuthProvider";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { Turnstile } from "@marsidev/react-turnstile";
import { Github, Loader2, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type SignupStep = "email" | "verify" | "details";
type PendingAction = "send-code" | null;

export default function LoginPage() {
  const router = useRouter();
  const { user, signInWithGoogle, signInWithGithub } = useAuth();

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

  const handleGithubLogin = async () => {
    try {
      const { error } = await signInWithGithub(next || "");
      if (error) throw error;
    } catch (error) {
      toast.error(t("Toast.Github.errorTitle"), {
        description: t("Toast.Github.errorDescription"),
      });
    }
  };

  const renderTurnstile = () => {
    if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || !showTurnstile) {
      return null;
    }

    return (
      <div className="mt-2">
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

  return (
    <div className="flex flex-1 items-center justify-center py-12">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {step === "details" ? "设置账号信息" : t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {step === "details"
              ? "为验证后的邮箱设置一个用户名和密码。"
              : t("description")}
          </p>
        </div>

        {step === "email" && (
          <div className="grid gap-6">
            <div className="grid w-[300px] gap-4">
              <Button variant="outline" onClick={handleGoogleLogin}>
                <GoogleIcon className="mr-2 h-4 w-4" />
                {t("signInMethods.signInWithGoogle")}
              </Button>
              <Button variant="outline" onClick={handleGithubLogin}>
                <Github className="mr-2 h-4 w-4" />
                {t("signInMethods.signInWithGithub")}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  {t("signInMethods.or")}
                </span>
              </div>
            </div>

            <div className="grid w-[300px] gap-3">
              <Input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              {renderTurnstile()}

              <Button onClick={handleSendCode} disabled={isSending}>
                Continue {isSending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              </Button>

              <Button variant="ghost" onClick={() => router.push("/sign-in")}>
                Already have an account? Log in here
              </Button>
            </div>
          </div>
        )}

        {step === "verify" && (
          <div className="grid w-[300px] gap-3">
            <Alert className="bg-muted/40">
              <Mail className="h-4 w-4" />
              <div>
                <p className="text-sm">We sent a verification code to</p>
                <div className="mt-1">
                  <Badge variant="secondary" className="font-medium">
                    {email}
                  </Badge>
                </div>
              </div>
            </Alert>
            <Input
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <Button onClick={handleVerify} disabled={isVerifying}>
              Verify {isVerifying && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            </Button>

            {renderTurnstile()}

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <button
                className="underline underline-offset-2 hover:text-foreground"
                onClick={handleUseDifferentEmail}
              >
                Use a different email
              </button>
              <button
                className="underline underline-offset-2 hover:text-foreground disabled:no-underline disabled:opacity-50"
                onClick={handleResendCode}
                disabled={isSending || resendSeconds > 0}
                title={resendSeconds > 0 ? `Please wait ${resendSeconds}s` : undefined}
              >
                {resendSeconds > 0 ? `Resend in ${resendSeconds}s` : "Resend code"}
              </button>
            </div>
          </div>
        )}

        {step === "details" && (
          <div className="grid w-[300px] gap-3">
            <Input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button onClick={handleCompleteSignup} disabled={isCompleting}>
              Complete sign up{" "}
              {isCompleting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

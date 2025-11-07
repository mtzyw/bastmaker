"use client";

import { GoogleIcon } from "@/components/icons";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/routing";
import { Turnstile } from "@marsidev/react-turnstile";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function SignInPage() {
  const router = useRouter();
  const { user, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | undefined>();
  const [showTurnstile, setShowTurnstile] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const t = useTranslations("Login");

  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [user, router]);

  const handlePasswordLogin = async () => {
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    if (!captchaToken) {
      toast.error("Please complete verification");
      return;
    }
    setIsLoggingIn(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: { captchaToken },
      });
      if (error) throw error;
      toast.success("Logged in successfully");
      router.replace("/");
    } catch (e: any) {
      toast.error("Login failed", { description: e?.message });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await signInWithGoogle("");
      if (error) throw error;
    } catch (error) {
      toast.error(t("Toast.Google.errorTitle"), {
        description: t("Toast.Google.errorDescription"),
      });
    }
  };

  if (user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  const inputClass =
    "h-12 w-full rounded-xl border border-white/15 bg-white/[0.08] px-4 text-sm text-white placeholder:text-white/40 focus:border-white focus:bg-white/10 focus:outline-none";

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#1c1c1a] px-4 py-16 text-white">
      <div className="relative w-full max-w-3xl">
        <div className="relative z-10 mx-auto -mb-8 w-full max-w-lg rounded-3xl bg-[linear-gradient(to_right,_rgb(18,194,233),_rgb(196,113,237),_rgb(246,79,89))] px-8 py-4 text-center text-white shadow-[0_20px_60px_rgba(123,97,255,0.35)]">
          <p className="text-sm font-semibold leading-relaxed">欢迎回来</p>
          <p className="text-xs font-medium text-white/85">使用邮箱或社交账号登录，继续创作。</p>
        </div>

        <div className="relative rounded-[32px] border border-white/10 bg-[#161616] px-8 pb-12 pt-24 shadow-[0_30px_80px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className="flex flex-col items-center gap-8 text-center">
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">登录 Bestmaker</h1>
              <p className="text-sm text-white/70 md:text-base">
                与你的作品再会，继续探索最新的 AI 功能。
              </p>
            </div>

            <div className="w-full max-w-lg space-y-8 text-left text-white/85">
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
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-white/40">
                    邮箱地址
                  </label>
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setShowTurnstile(true)}
                    className={`${inputClass} mt-1`}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-white/40">
                    密码
                  </label>
                  <Input
                    type="password"
                    placeholder="请输入密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputClass} mt-1`}
                  />
                </div>

                {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && showTurnstile && (
                  <div className="flex justify-center">
                    <Turnstile
                      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                      onSuccess={(token) => setCaptchaToken(token)}
                    />
                  </div>
                )}

                <Button
                  onClick={handlePasswordLogin}
                  disabled={isLoggingIn}
                  className="h-12 w-full rounded-xl bg-white text-sm font-semibold text-[#232323] hover:bg-white/90"
                >
                  登录 {isLoggingIn && <Loader2 className="ml-2 h-4 w-4 animate-spin text-[#232323]" />}
                </Button>

                <p className="text-center text-xs text-white/50">
                  还没有账号？
                  <Link href="/sign-up" className="ml-1 font-semibold text-[#dc2e5a]">
                    立即注册
                  </Link>
                </p>
              </div>
            </div>

            <p className="text-center text-[11px] text-white/30">
              登录即表示同意我们的{" "}
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

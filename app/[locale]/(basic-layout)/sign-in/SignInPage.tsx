"use client";

import { GoogleIcon } from "@/components/icons";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/routing";
import { Turnstile } from "@marsidev/react-turnstile";
import { Github, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function SignInPage() {
  const router = useRouter();
  const { user, signInWithGoogle, signInWithGithub } = useAuth();
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

  const handleGithubLogin = async () => {
    try {
      const { error } = await signInWithGithub("");
      if (error) throw error;
    } catch (error) {
      toast.error(t("Toast.Github.errorTitle"), {
        description: t("Toast.Github.errorDescription"),
      });
    }
  };

  if (user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center flex-1 py-12">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Sign In</h1>
          <p className="text-sm text-muted-foreground">Welcome back</p>
        </div>

        <div className="grid gap-6">
          <div className="grid gap-4 w-[300px]">
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

          <div className="grid gap-3 w-[300px]">
            <Input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setShowTurnstile(true)}
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && showTurnstile && (
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                onSuccess={(token) => setCaptchaToken(token)}
              />
            )}

            <Button onClick={handlePasswordLogin} disabled={isLoggingIn}>
              Login {isLoggingIn && <Loader2 className="w-4 h-4 animate-spin" />}
            </Button>

            <Button variant="ghost" onClick={() => router.push('/sign-up')}>
              Need an account? Sign up
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


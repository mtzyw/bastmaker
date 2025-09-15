"use client";

import { GoogleIcon } from "@/components/icons";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/routing";
import { Turnstile } from "@marsidev/react-turnstile";
import { Github, Loader2, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
 

export default function LoginPage() {
  const router = useRouter();
  const { user, signInWithGoogle, signInWithGithub } = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | undefined>();
  const [showTurnstile, setShowTurnstile] = useState(false);
  const [pendingAction, setPendingAction] = useState<null | 'signup'>(null);
  const [captchaMountKey, setCaptchaMountKey] = useState(0);
  const [codeSent, setCodeSent] = useState(false);
  const [otpType, setOtpType] = useState<"signup" | "email" | null>(null);
  const [resendSeconds, setResendSeconds] = useState(0);
  

  const t = useTranslations("Login");
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [user, router]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendSeconds <= 0) return;
    const id = setInterval(() => {
      setResendSeconds((s) => (s > 1 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [resendSeconds]);

  const handleSendCode = async () => {
    if (!email || !username || !password) {
      toast.error("Please fill all fields");
      return;
    }
    // Defer captcha until click: mount widget and process on success
    setIsSending(true);
    setPendingAction('signup');
    setShowTurnstile(true);
    setCaptchaMountKey((k) => k + 1); // force remount to ensure fresh token
  };

  const handleVerify = async () => {
    if (!email || !code) {
      toast.error("Please enter code");
      return;
    }
    if (!otpType) {
      toast.error("Missing OTP type, please resend code");
      return;
    }
    setIsVerifying(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: otpType,
      } as any);
      if (error) throw error;
      toast.success("Signed in successfully");
      router.replace("/");
    } catch (e: any) {
      toast.error("Verification failed", { description: e?.message });
    } finally {
      setIsVerifying(false);
    }
  };

  // Password login moved to /sign-in page

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
        {!codeSent ? (
          <>
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
              <p className="text-sm text-muted-foreground">{t("description")}</p>
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
                  <span className="bg-background px-2 text-muted-foreground">{t("signInMethods.or")}</span>
                </div>
              </div>

              <div className="grid gap-3 w-[300px]">
                <Input type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
                <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />

                {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && showTurnstile && (
                  <div className="mt-2">
                    <Turnstile
                      key={captchaMountKey}
                      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                      onSuccess={async (token) => {
                        setCaptchaToken(token);
                        try {
                          if (pendingAction === 'signup') {
                            const supabase = createClient();
                            const { error } = await supabase.auth.signUp({
                              email,
                              password,
                              options: { data: { full_name: username }, captchaToken: token },
                            });
                            if (error) {
                              if ((error as any)?.status === 422 || String(error.message).toLowerCase().includes('registered')) {
                                const { error: loginErr } = await supabase.auth.signInWithOtp({ email, options: { captchaToken: token } });
                                if (loginErr) throw loginErr;
                                setOtpType('email');
                                setCodeSent(true);
                                setResendSeconds(30);
                                toast.success('Login code sent to your email');
                              } else {
                                throw error;
                              }
                            } else {
                              setOtpType('signup');
                              setCodeSent(true);
                              setResendSeconds(30);
                              toast.success('Sign-up code sent to your email');
                            }
                          }
                        } catch (e: any) {
                          toast.error('Failed to send code', { description: e?.message });
                        } finally {
                          setIsSending(false);
                          setShowTurnstile(false);
                          setPendingAction(null);
                        }
                      }}
                      onError={() => {
                        toast.error('Verification failed. Please try again.');
                        setIsSending(false);
                        setShowTurnstile(false);
                        setPendingAction(null);
                      }}
                      onExpire={() => {
                        setIsSending(false);
                        setShowTurnstile(false);
                        setPendingAction(null);
                      }}
                    />
                  </div>
                )}

                <Button onClick={handleSendCode} disabled={isSending}>
                  Continue {isSending && <Loader2 className="w-4 h-4 animate-spin" />}
                </Button>

                <Button variant="ghost" onClick={() => router.push('/sign-in')}>
                  Already have an account? Log in here
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="grid gap-3 w-[300px]">
            <Alert className="bg-muted/40">
              <Mail className="h-4 w-4" />
              <div>
                <p className="text-sm">We sent a verification code to</p>
                <div className="mt-1">
                  <Badge variant="secondary" className="font-medium">{email}</Badge>
                </div>
              </div>
            </Alert>
            <Input placeholder="Enter 6-digit code" value={code} onChange={(e) => setCode(e.target.value)} />
            <Button onClick={handleVerify} disabled={isVerifying}>
              Verify {isVerifying && <Loader2 className="w-4 h-4 animate-spin" />}
            </Button>

            {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && showTurnstile && (
              <div className="mt-2">
                <Turnstile
                  key={captchaMountKey}
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                  onSuccess={async (token) => {
                    setCaptchaToken(token);
                    try {
                      if (pendingAction === 'signup') {
                        const supabase = createClient();
                        const { error } = await supabase.auth.signUp({
                          email,
                          password,
                          options: { data: { full_name: username }, captchaToken: token },
                        });
                        if (error) {
                          if ((error as any)?.status === 422 || String(error.message).toLowerCase().includes('registered')) {
                            const { error: loginErr } = await supabase.auth.signInWithOtp({ email, options: { captchaToken: token } });
                            if (loginErr) throw loginErr;
                            setOtpType('email');
                            setCodeSent(true);
                            setResendSeconds(30);
                            toast.success('Login code sent to your email');
                          } else {
                            throw error;
                          }
                        } else {
                          setOtpType('signup');
                          setCodeSent(true);
                          setResendSeconds(30);
                          toast.success('Sign-up code sent to your email');
                        }
                      }
                    } catch (e: any) {
                      toast.error('Failed to send code', { description: e?.message });
                    } finally {
                      setIsSending(false);
                      setShowTurnstile(false);
                      setPendingAction(null);
                    }
                  }}
                  onError={() => {
                    toast.error('Verification failed. Please try again.');
                    setIsSending(false);
                    setShowTurnstile(false);
                    setPendingAction(null);
                  }}
                  onExpire={() => {
                    setIsSending(false);
                    setShowTurnstile(false);
                    setPendingAction(null);
                  }}
                />
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <button
                className="underline underline-offset-2 hover:text-foreground"
                onClick={() => {
                  setCode("");
                  setCodeSent(false);
                  setIsSending(false);
                  setShowTurnstile(false);
                  setPendingAction(null);
                  setCaptchaToken(undefined);
                  setResendSeconds(0);
                }}
              >
                Use a different email
              </button>
              <button
                className="underline underline-offset-2 hover:text-foreground disabled:opacity-50 disabled:no-underline"
                onClick={handleSendCode}
                disabled={isSending || resendSeconds > 0}
                title={resendSeconds > 0 ? `Please wait ${resendSeconds}s` : undefined}
              >
                {resendSeconds > 0 ? `Resend in ${resendSeconds}s` : 'Resend code'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

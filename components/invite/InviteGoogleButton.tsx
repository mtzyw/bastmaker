"use client";

import { GoogleIcon } from "@/components/icons";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type InviteGoogleButtonProps = {
  nextPath: string;
  label?: string;
  className?: string;
};

export function InviteGoogleButton({
  nextPath,
  label = "使用 Google 账号继续",
  className,
}: InviteGoogleButtonProps) {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithGoogle(nextPath);
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("[InviteGoogleButton] Google login failed", error);
      toast.error("Google 登录失败", {
        description: "请稍后再试，或使用邮箱注册。",
      });
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        "h-12 w-full justify-center gap-3 rounded-xl border border-white/15 bg-white/5 text-sm font-medium text-white hover:bg-white/10",
        loading && "opacity-80",
        className
      )}
      onClick={handleGoogleLogin}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <span className="inline-flex h-5 w-5 items-center justify-center" aria-hidden>
          <GoogleIcon className="h-5 w-5" />
        </span>
      )}
      <span>{label}</span>
    </Button>
  );
}

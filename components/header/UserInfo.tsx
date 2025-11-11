"use client";

import { DynamicIcon } from "@/components/DynamicIcon";
import CurrentUserBenefitsDisplay from "@/components/layout/CurrentUserBenefitsDisplay";
import { useAuth } from "@/components/providers/AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserBenefits } from "@/hooks/useUserBenefits";
import { useRouter } from "@/i18n/routing";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SignInPage from "@/app/[locale]/(basic-layout)/sign-in/SignInPage";
import LoginPage from "@/app/[locale]/(basic-layout)/login/LoginPage";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useMemo, useState } from "react";

type Menu = {
  name: string;
  href: string;
  target?: string;
  icon?: string;
};

interface UserInfoProps {
  mobile?: boolean;
  renderContainer?: (children: React.ReactNode) => React.ReactNode;
  openAuthDialog?: boolean;
}

export function UserInfo({ mobile = false, renderContainer, openAuthDialog = false }: UserInfoProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { isLoading: isBenefitsLoading } = useUserBenefits();
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  const t = useTranslations("Login");

  const userMenus: Menu[] = t.raw("UserMenus");

  const adminMenus: Menu[] = t.raw("AdminMenus");

  if (!user) {
    if (openAuthDialog) {
      return <AuthDialogTrigger mobile={mobile} />;
    }
    return (
      <Button
        onClick={() => router.push("/sign-up")}
        variant="outline"
        className={`gradient-bg border-main text-white hover:text-white rounded-lg font-medium text-center hover:opacity-90 shadow-lg ${
          mobile ? "w-full" : ""
        }`}
      >
        {t("Button.signIn")}
      </Button>
    );
  }

  const isStripeEnabled = process.env.NEXT_PUBLIC_ENABLE_STRIPE === "true";
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!user) {
      setInviteLink(null);
      return;
    }

    let active = true;
    supabase
      .from("users")
      .select("invite_code")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error("[invite-link] failed to fetch invite code", error);
          setInviteLink(null);
          return;
        }
        if (data?.invite_code) {
          const origin =
            typeof window !== "undefined"
              ? window.location.origin
              : process.env.NEXT_PUBLIC_SITE_URL ?? "";
          if (!origin) {
            setInviteLink(null);
            return;
          }
          setInviteLink(`${origin}/invitation-landing?invite_code=${data.invite_code}`);
        } else {
          setInviteLink(null);
        }
      })
      .catch((error) => {
        console.error("[invite-link] unexpected error", error);
        setInviteLink(null);
      });

    return () => {
      active = false;
    };
  }, [supabase, user]);

  useEffect(() => {
    if (copyState !== "copied") return;
    const id = window.setTimeout(() => {
      setCopyState("idle");
    }, 2000);
    return () => window.clearTimeout(id);
  }, [copyState]);

  const handleCopyInviteLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopyState("copied");
    } catch (error) {
      console.error("[invite-link] failed to copy", error);
      setCopyState("error");
    }
  };

  const BenefitsLoadingFallback = () => (
    <Skeleton className="h-6 w-20 rounded-md" />
  );

  const fallbackLetter = (user.email || "N")[0].toUpperCase();
  const userInfoContent = (
    <>
      <div>
        <div className="flex items-center space-x-2 pb-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback>{fallbackLetter}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col space-y-0.5">
            <p className="text-sm font-medium leading-none">
              {user.user_metadata?.full_name || "User"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>

        {isStripeEnabled && (
          <div className="pt-1 pb-2">
            {isBenefitsLoading ? (
              <BenefitsLoadingFallback />
            ) : (
              <CurrentUserBenefitsDisplay />
            )}
          </div>
        )}

        <Button
          variant="outline"
          className="mt-2 w-full justify-center rounded-2xl bg-[linear-gradient(to_right,rgb(18,194,233),rgb(196,113,237),rgb(246,79,89))] text-white shadow-lg shadow-[#f64f59]/30 hover:opacity-90"
          asChild
        >
          <Link href="/dashboard/subscription">
            升级会员
          </Link>
        </Button>
      </div>

      <DropdownMenuSeparator />

      {userMenus.map((menu) => (
        <DropdownMenuItem
          key={menu.name}
          onClick={() => {
            if (menu.target) {
              window.open(menu.href, "_blank");
            } else {
              router.push(menu.href);
            }
          }}
          className="cursor-pointer flex items-center gap-x-2"
        >
          {menu.icon ? (
            <DynamicIcon name={menu.icon} className="h-4 w-4" />
          ) : (
            <span>{menu.name.slice(0, 1)}</span>
          )}
          <span>{menu.name}</span>
          {menu.target && <ExternalLink className="w-4 h-4" />}
        </DropdownMenuItem>
      ))}
      {/* </>
      )} */}

      {user.role === "admin" && (
        <>
          <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
            Admin Menu
          </DropdownMenuLabel>
          {adminMenus.map((menu) => (
            <DropdownMenuItem
              key={menu.name}
              onClick={() => router.push(menu.href)}
              className="cursor-pointer flex items-center gap-x-2"
            >
              {menu.icon ? (
                <DynamicIcon name={menu.icon} className="h-4 w-4" />
              ) : (
                <span>{menu.name.slice(0, 1)}</span>
              )}
              <span>{menu.name}</span>
            </DropdownMenuItem>
          ))}
        </>
      )}

      <DropdownMenuItem
        onClick={() => signOut()}
        className="cursor-pointer text-red-600 dark:text-red-400"
      >
        {t("Button.signOut")}
      </DropdownMenuItem>
    </>
  );

  if (renderContainer) {
    return renderContainer(userInfoContent);
  }

  return userInfoContent;
}
function AuthDialogTrigger({ mobile }: { mobile: boolean }) {
  const t = useTranslations("Login");
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={`gradient-bg border-main text-white hover:text-white rounded-lg font-medium text-center hover:opacity-90 shadow-lg ${
            mobile ? "w-full" : ""
          }`}
        >
          {t("Button.signIn")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl border-none bg-transparent p-0 text-white shadow-none">
        <div className="rounded-[40px] border border-white/10 bg-[#050505]/95 p-4 sm:p-6 md:p-8">
          <div className="space-y-2 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">Bestmaker</p>
            <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
              {t("Button.signIn")} / {t("Button.signUp")}
            </h2>
            <p className="text-sm text-white/70">登录查看创作记录，注册即可领取新人积分。</p>
          </div>
          <Tabs defaultValue="signin" className="mt-6 w-full text-white">
            <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-white/5 p-1">
              <TabsTrigger
                value="signin"
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white/60 transition data-[state=active]:bg-[#151515] data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                {t("Button.signIn")}
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white/60 transition data-[state=active]:bg-[#151515] data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                {t("Button.signUp")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="mt-6 focus-visible:outline-none">
              <div className="max-h-[70vh] overflow-y-auto pr-1">
                <SignInPage variant="dialog" />
              </div>
            </TabsContent>
            <TabsContent value="signup" className="mt-6 focus-visible:outline-none">
              <div className="max-h-[70vh] overflow-y-auto pr-1">
                <LoginPage variant="dialog" />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

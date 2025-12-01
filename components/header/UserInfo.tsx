"use client";

import { DynamicIcon } from "@/components/DynamicIcon";
import CurrentUserBenefitsDisplay from "@/components/layout/CurrentUserBenefitsDisplay";
import { useAuthDialog } from "@/components/providers/AuthDialogProvider";
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
import { createClient } from "@/lib/supabase/client";
import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { cloneElement, isValidElement, MouseEvent, useEffect, useMemo, useState, type ReactElement, type ReactNode } from "react";

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

  const t = useTranslations("Login");

  if (!user) {
    if (openAuthDialog) {
      return <AuthDialogTrigger mobile={mobile} />;
    }
    return (
      <Button
        onClick={() => router.push("/sign-up")}
        variant="outline"
        className={`gradient-bg border-main text-white hover:text-white rounded-lg font-medium text-center hover:opacity-90 shadow-lg ${mobile ? "w-full" : ""
          }`}
      >
        {t("Button.signIn")}
      </Button>
    );
  }

  return (
    <AuthenticatedUserInfo
      renderContainer={renderContainer}
      isBenefitsLoading={isBenefitsLoading}
      signOut={signOut}
      user={user}
    />
  );
}

type AuthenticatedUserInfoProps = {
  renderContainer?: (children: React.ReactNode) => React.ReactNode;
  isBenefitsLoading: boolean;
  signOut: () => Promise<void> | void;
  user: NonNullable<ReturnType<typeof useAuth>["user"]>;
};

function AuthenticatedUserInfo({
  renderContainer,
  isBenefitsLoading,
  signOut,
  user,
}: AuthenticatedUserInfoProps) {
  const router = useRouter();
  const t = useTranslations("Login");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const userMenus: Menu[] = t.raw("UserMenus");
  const adminMenus: Menu[] = t.raw("AdminMenus");
  const isStripeEnabled = process.env.NEXT_PUBLIC_ENABLE_STRIPE === "true";
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let active = true;

    const fetchInvite = async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("invite_code")
          .eq("id", user.id)
          .maybeSingle();

        if (!active) {
          return;
        }

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
      } catch (error) {
        if (!active) {
          return;
        }
        console.error("[invite-link] unexpected error", error);
        setInviteLink(null);
      }
    };

    void fetchInvite();

    return () => {
      active = false;
    };
  }, [supabase, user.id]);

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
          <Link href="/pricing">
            {t("Button.upgradePlan")}
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
type AuthDialogTriggerProps = {
  mobile?: boolean;
  initialTab?: "signin" | "signup";
  triggerElement?: ReactNode;
};

export function AuthDialogTrigger({
  mobile = false,
  initialTab = "signin",
  triggerElement,
}: AuthDialogTriggerProps) {
  const t = useTranslations("Login");
  const { openAuthDialog } = useAuthDialog();

  const handleOpen = () => {
    openAuthDialog(initialTab);
  };

  if (triggerElement && isValidElement(triggerElement)) {
    const element = triggerElement as ReactElement<any>;
    return cloneElement(
      element,
      {
        ...element.props,
        onClick: (event: MouseEvent<HTMLElement>) => {
          if (typeof element.props?.onClick === "function") {
            element.props.onClick(event);
          }
          if (!event.defaultPrevented) {
            handleOpen();
          }
        },
      } as Record<string, any>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={handleOpen}
      className={`gradient-bg border-main text-white hover:text-white rounded-lg font-medium text-center hover:opacity-90 shadow-lg ${mobile ? "w-full" : ""
        }`}
    >
      {t("Button.signIn")}
    </Button>
  );
}

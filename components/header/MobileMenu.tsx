"use client";

import { pacifico } from "@/app/fonts";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link as I18nLink } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { HeaderLink } from "@/types/common";
import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { UserInfo } from "./UserInfo";

interface MobileMenuProps {
  hideHrefs?: string[];
  hideIds?: string[];
}

export default function MobileMenu({ hideHrefs, hideIds }: MobileMenuProps) {
  const t = useTranslations("Home");
  const tHeader = useTranslations("Header");
  const { user } = useAuth();

  let headerLinks: HeaderLink[] = tHeader.raw("links");
  const pricingLink = headerLinks.find((link) => link.name === "Pricing");
  if (pricingLink) {
    pricingLink.href = process.env.NEXT_PUBLIC_PRICING_PATH!;
  }

  // filter links if requested
  const hideHrefSet = new Set((hideHrefs || []).map((h) => h.toLowerCase()));
  const hideIdSet = new Set(hideIds || []);
  headerLinks = headerLinks.filter((link) => {
    if (link.id && hideIdSet.has(link.id)) return false;
    if (link.href && hideHrefSet.has(link.href.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex items-center">
      <LocaleSwitcher />
      <ThemeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger className="p-2">
          <Menu className="h-5 w-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>
            <I18nLink
              href="/"
              title={t("title")}
              prefetch={true}
              className="flex items-center space-x-2"
            >
              <Image
                alt={t("title")}
                src="/logo.svg"
                className="w-6 h-6"
                width={32}
                height={32}
              />
              <span className={cn("gradient-text", pacifico.className)}>
                {t("title")}
              </span>
            </I18nLink>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {user ? (
            <>
              <UserInfo
                mobile
                renderContainer={(children) => (
                  <DropdownMenuLabel className="font-normal">
                    {children}
                  </DropdownMenuLabel>
                )}
              />
            </>
          ) : (
            <DropdownMenuItem asChild>
              <UserInfo mobile />
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {headerLinks.map((link) => (
              <DropdownMenuItem key={link.name}>
                <I18nLink
                  href={link.href}
                  title={link.name}
                  prefetch={
                    link.target && link.target === "_blank" ? false : true
                  }
                  target={link.target || "_self"}
                  rel={link.rel || undefined}
                >
                  {link.name}
                </I18nLink>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

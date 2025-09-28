"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { pacifico } from "@/app/fonts";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserAvatar } from "@/components/header/UserAvatar";
import { Link as I18nLink } from "@/i18n/routing";
import { useAuth } from "@/components/providers/AuthProvider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import type { ViewerJob } from "@/actions/ai-jobs/public";

type ViewerHeaderProps = {
  job: ViewerJob;
  shareUrl: string;
  generateUrl: string;
};

export function ViewerHeader({ job: _job, shareUrl: _shareUrl, generateUrl }: ViewerHeaderProps) {
  const t = useTranslations("Viewer.header");
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#14141e] backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-6">
          <I18nLink href="/" className="flex items-center gap-2" prefetch>
            <Image
              alt={t("logoAlt")}
              src="/logo.svg"
              className="h-8 w-8"
              width={32}
              height={32}
              priority
            />
            <span className={cn("text-2xl text-white", pacifico.className)}>Nexty</span>
          </I18nLink>
          <nav className="hidden items-center gap-6 text-sm text-white/70 md:flex">
            <I18nLink href="/" className="transition hover:text-white" prefetch>
              {t("nav.home", { default: "Home" })}
            </I18nLink>
            <I18nLink href="/text-to-image" className="transition hover:text-white" prefetch>
              {t("nav.textToImage", { default: "Text to Image" })}
            </I18nLink>
            <I18nLink href="/text-to-video" className="transition hover:text-white" prefetch>
              {t("nav.textToVideo", { default: "Text to Video" })}
            </I18nLink>
            <I18nLink href="/pricing" className="transition hover:text-white" prefetch>
              {t("nav.pricing", { default: "Pricing" })}
            </I18nLink>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          {user ? (
            <UserAvatar />
          ) : (
            <Button
              asChild
              className="inline-flex bg-gradient-to-r from-[#725bff] to-[#a855f7] text-white shadow-lg shadow-purple-500/30 hover:from-[#7f64ff] hover:to-[#b667ff]"
            >
              <I18nLink href="/sign-up" prefetch>
                {t("nav.cta", { default: "Start for Free" })}
              </I18nLink>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

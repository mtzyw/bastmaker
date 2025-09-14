"use client";

import { Link as I18nLink, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { HeaderLink } from "@/types/common";
import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";

interface HeaderLinksProps {
  className?: string;
  linkClassName?: string;
  activeLinkClassName?: string;
}

const HeaderLinks = ({
  className,
  linkClassName,
  activeLinkClassName,
}: HeaderLinksProps) => {
  const tHeader = useTranslations("Header");
  const pathname = usePathname();

  const headerLinks: HeaderLink[] = tHeader.raw("links");
  const pricingLink = headerLinks.find((link) => link.id === "pricing");
  if (pricingLink) {
    pricingLink.href = process.env.NEXT_PUBLIC_PRICING_PATH!;
  }

  return (
    <div
      className={cn(
        "hidden lg:flex flex-row items-center gap-x-2 text-sm",
        className
      )}
    >
      {headerLinks.map((link) => (
        <I18nLink
          key={link.name}
          href={link.href}
          title={link.name}
          prefetch={link.target && link.target === "_blank" ? false : true}
          target={link.target || "_self"}
          rel={link.rel || undefined}
          className={cn(
            "rounded-xl px-4 py-2 flex items-center gap-x-1",
            linkClassName,
            pathname === link.href && `font-medium ${activeLinkClassName}`
          )}
        >
          {link.name}
          {link.target && link.target === "_blank" && (
            <span className="text-xs">
              <ExternalLink className="w-4 h-4" />
            </span>
          )}
        </I18nLink>
      ))}
    </div>
  );
};

export default HeaderLinks;

import { pacifico } from "@/app/fonts";
import HeaderLinks from "@/components/header/HeaderLinks";
import MobileMenu from "@/components/header/MobileMenu";
import { UserAvatar } from "@/components/header/UserAvatar";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Link as I18nLink } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import Image from "next/image";

interface HeaderProps {
  hideHeaderHrefs?: string[];
  hideHeaderIds?: string[];
}

const Header = ({ hideHeaderHrefs, hideHeaderIds }: HeaderProps) => {
  const t = useTranslations("Home");

  return (
    <header className="py-4 px-6 backdrop-blur-md sticky top-0 z-50 shadow-sm header-bg">
      <nav className="flex justify-between items-center w-full mx-auto">
        <div className="flex items-center space-x-6 md:space-x-12">
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

          <HeaderLinks
            className="text-white"
            linkClassName="hover:bg-accent-foreground/10 hover:text-white"
            activeLinkClassName="text-white"
            hideHrefs={hideHeaderHrefs}
            hideIds={hideHeaderIds}
          />
        </div>

        <div className="flex items-center gap-x-2 flex-1 justify-end">
          {/* PC */}
          <div className="hidden lg:flex items-center gap-x-2">
            <LocaleSwitcher />
            <ThemeToggle />
            <UserAvatar />
          </div>

          {/* Mobile */}
          <div className="flex lg:hidden">
            <MobileMenu hideHrefs={hideHeaderHrefs} hideIds={hideHeaderIds} />
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;

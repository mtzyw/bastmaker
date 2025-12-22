import { LOCALES } from "@/i18n/routing";

const MARKETING_ROUTE_PREFIXES = [
  "/",
  "/pricing",
  "/blogs",
  "/sign-up",
  "/sign-in",
  "/login",
  "/invitation-landing",
];

export const stripLocalePrefix = (pathname?: string | null): string => {
  if (!pathname) {
    return "";
  }
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) {
    return "/";
  }
  if (LOCALES.includes(parts[0])) {
    parts.shift();
  }
  if (parts.length === 0) {
    return "/";
  }
  return `/${parts.join("/")}`;
};

export const isMarketingRoute = (pathname?: string | null): boolean => {
  const normalizedPath = stripLocalePrefix(pathname);
  if (!normalizedPath) {
    return false;
  }
  return MARKETING_ROUTE_PREFIXES.some((prefix) => {
    if (prefix === "/") {
      return normalizedPath === "/";
    }
    return normalizedPath.startsWith(prefix);
  });
};

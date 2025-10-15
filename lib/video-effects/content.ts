import { readFile } from "fs/promises";
import path from "path";

import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/i18n/routing";

export type VideoEffectCopy = {
  displayTitle?: string;
  seoTitle?: string;
  seoDescription?: string;
  hero?: {
    heading?: string;
    description?: string;
    cta?: {
      label?: string;
      href?: string;
    };
  };
  gallery?: {
    heading?: string;
    subheading?: string;
  };
  galleryItems?: Array<{
    title: string;
    description?: string;
  }>;
  features?: {
    heading?: string;
    items?: Array<{
      title: string;
      description?: string;
      ctaLabel?: string;
      ctaHref?: string;
    }>;
  };
  valueProps?: {
    heading?: string;
    description?: string;
    items?: Array<{
      title: string;
      description?: string;
      icon?: string;
    }>;
  };
  moreEffects?: {
    heading?: string;
    description?: string;
    linkLabel?: string;
  };
  faq?: {
    heading?: string;
    items?: Array<{
      question: string;
      answer: string;
    }>;
  };
};

const cache = new Map<string, VideoEffectCopy | null>();

function getCopyFilePath(locale: Locale, slug: string) {
  return path.join(
    process.cwd(),
    "i18n",
    "messages",
    locale,
    "video-effects",
    `${slug}.json`
  );
}

async function readCopyFile(locale: Locale, slug: string): Promise<VideoEffectCopy | null> {
  const cacheKey = `${locale}:${slug}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey) ?? null;
  }

  const filePath = getCopyFilePath(locale, slug);
  try {
    const file = await readFile(filePath, "utf-8");
    const parsed = JSON.parse(file) as VideoEffectCopy;
    cache.set(cacheKey, parsed);
    return parsed;
  } catch (error: unknown) {
    cache.set(cacheKey, null);
    if (
      process.env.NODE_ENV !== "production" &&
      (error as NodeJS.ErrnoException)?.code !== "ENOENT"
    ) {
      console.error("[video-effects] failed to read localized copy", {
        locale,
        slug,
        error,
      });
    }
    return null;
  }
}

export async function loadVideoEffectCopy(
  slug: string,
  locale: Locale
): Promise<{ locale: Locale; copy: VideoEffectCopy | null }> {
  const normalizedLocale = (LOCALES.includes(locale) ? locale : DEFAULT_LOCALE) as Locale;
  const localizedCopy = await readCopyFile(normalizedLocale, slug);

  if (localizedCopy) {
    return { locale: normalizedLocale, copy: localizedCopy };
  }

  if (normalizedLocale !== DEFAULT_LOCALE) {
    const fallbackCopy = await readCopyFile(DEFAULT_LOCALE, slug);
    return { locale: DEFAULT_LOCALE as Locale, copy: fallbackCopy };
  }

  return { locale: normalizedLocale, copy: null };
}

export function clearVideoEffectCopyCache() {
  cache.clear();
}

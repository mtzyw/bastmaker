"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRef } from "react";

const FALLBACK_PREVIEW_IMAGE =
  "https://cdn.bestmaker.ai/static/placeholders/image-effect-preview.jpg";

export type ImageEffectsGalleryItem = {
  slug: string;
  title: string;
  category?: string | null;
  description?: string | null;
  previewImageUrl?: string | null;
};

function ImageEffectCard({ effect }: { effect: ImageEffectsGalleryItem }) {
  const imageRef = useRef<HTMLImageElement | null>(null);

  const handleHoverStart = () => {
    const img = imageRef.current;
    if (!img) return;
    img.style.transform = "scale(1.05)";
  };

  const handleHoverEnd = () => {
    const img = imageRef.current;
    if (!img) return;
    img.style.transform = "scale(1)";
  };

  return (
    <Link
      href={`/image-effects/${effect.slug}`}
      className="group relative block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      onMouseEnter={handleHoverStart}
      onMouseLeave={handleHoverEnd}
      onFocus={handleHoverStart}
      onBlur={handleHoverEnd}
    >
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-sm transition duration-300 group-hover:border-white/30 group-hover:shadow-lg group-hover:shadow-blue-500/20">
        <Image
          ref={imageRef}
          src={effect.previewImageUrl ?? FALLBACK_PREVIEW_IMAGE}
          alt={effect.title}
          fill
          className="object-cover transition-transform duration-300"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-black/25 to-black/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="rounded-full bg-white px-5 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-900 shadow-lg">
            Use This Template
          </span>
        </div>
      </div>
      <p className="mt-3 text-sm font-medium text-white">{effect.title}</p>
    </Link>
  );
}

type ImageEffectsGalleryProps = {
  effects: ImageEffectsGalleryItem[];
};

export default function ImageEffectsGallery({ effects }: ImageEffectsGalleryProps) {
  const t = useTranslations("ImageEffects");

  return (
    <div className="flex h-full flex-col">
      <header className="mb-8 space-y-2">
        <h2 className="text-2xl font-semibold text-white md:text-3xl">
          {t("header.title")}
        </h2>
        <p className="text-sm text-white/60">
          {t("header.description")}
        </p>
      </header>

      <ScrollArea className="flex-1">
        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-5">
          {effects.map((effect) => (
            <ImageEffectCard key={effect.slug} effect={effect} />
          ))}
        </div>
        <div className="h-10" />
      </ScrollArea>
    </div>
  );
}

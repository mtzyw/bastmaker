"use client";

import { useMemo, useState } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { VIDEO_EFFECTS, VIDEO_EFFECT_CATEGORIES } from "@/lib/video-effects/effects";
import { Link } from "@/i18n/routing";

export default function VideoEffectsGallery() {
  const [activeCategory, setActiveCategory] = useState<string>(VIDEO_EFFECT_CATEGORIES[0]);

  const filteredEffects = useMemo(() => {
    if (activeCategory === "全部特效") {
      return VIDEO_EFFECTS;
    }
    return VIDEO_EFFECTS.filter((effect) => effect.category === activeCategory);
  }, [activeCategory]);

  return (
    <div className="flex h-full flex-col">
      <header className="mb-6">
        <h2 className="text-2xl font-semibold text-white md:text-3xl">精选特效</h2>
        <p className="mt-2 text-sm text-white/60">
          选择模板即可自动应用镜头动作、光效和表情变化，后续内容可随时替换。
        </p>
      </header>

      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-6">
        <TabsList className="flex w-full flex-wrap gap-2 bg-white/5 p-1">
          {VIDEO_EFFECT_CATEGORIES.map((category) => (
            <TabsTrigger
              key={category}
              value={category}
              className={cn(
                "flex-1 min-w-[148px] rounded-md px-4 py-2 text-sm transition data-[state=active]:bg-white data-[state=active]:text-gray-900"
              )}
            >
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <ScrollArea className="flex-1">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredEffects.map((effect) => (
            <Link
              key={effect.slug}
              href={`/video-effects/${effect.slug}`}
              className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            >
              <article className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/80 via-slate-900/80 to-slate-950/80 shadow-lg transition hover:border-white/20 hover:shadow-blue-500/20">
                <div className="relative aspect-video overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/0 to-white/5 transition duration-300 group-hover:from-white/20" />
                  <div className="absolute inset-0 flex items-center justify-center text-white/20" />
                </div>
                <div className="px-4 pb-5 pt-4 text-white">
                  <h3 className="text-lg font-semibold leading-tight">{effect.title}</h3>
                </div>
              </article>
            </Link>
          ))}
        </div>
        <div className="h-8" />
      </ScrollArea>
    </div>
  );
}

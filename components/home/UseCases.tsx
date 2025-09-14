"use client";

import { SectionBG5 } from "@/components/sectionBG";
import { ScrollVelocity } from "@/components/ui/scroll-velocity";
import { useTranslations } from "next-intl";
import Image from "next/image";

const images = [
  {
    title: "Example 1",
    thumbnail: "/images/examples/flux-kontext-pro/test5-after.webp",
  },
  {
    title: "Example 2",
    thumbnail: "/images/examples/flux-kontext-pro/test2-after.webp",
  },
  {
    title: "Example 3",
    thumbnail: "/images/examples/flux-kontext-pro/test6-after.webp",
  },
  {
    title: "Example 4",
    thumbnail: "/images/examples/multi-images/test-1-after.webp",
  },
  {
    title: "Example 5",
    thumbnail: "/images/examples/multi-images/test-3-after.webp",
  },
  {
    title: "Example 6",
    thumbnail: "/images/examples/flux-kontext-pro/test5-after.webp",
  },
  {
    title: "Example 7",
    thumbnail: "/images/examples/flux-kontext-pro/test2-after.webp",
  },
  {
    title: "Example 8",
    thumbnail: "/images/examples/flux-kontext-pro/test6-after.webp",
  },
  {
    title: "Example 9",
    thumbnail: "/images/examples/multi-images/test-1-after.webp",
  },
  {
    title: "Example 10",
    thumbnail: "/images/examples/multi-images/test-3-after.webp",
  },
];

const velocity = [3, -3];

export default function UseCases() {
  const t = useTranslations("Landing.UseCases");
  return (
    <section className="relative">
      <SectionBG5 />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("title")}</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {t("description")}
          </p>
        </div>
        <div className="flex flex-col space-y-5 py-10">
          {velocity.map((v, index) => (
            <ScrollVelocity key={index} velocity={v}>
              {images.map(({ title, thumbnail }) => (
                <div
                  key={title}
                  className="relative h-[6rem] w-[9rem] md:h-[8rem] md:w-[12rem] xl:h-[12rem] xl:w-[18rem]"
                >
                  <Image
                    src={thumbnail}
                    alt={title}
                    fill
                    className="h-full w-full object-cover object-center"
                  />
                </div>
              ))}
            </ScrollVelocity>
          ))}
        </div>
      </div>
    </section>
  );
}

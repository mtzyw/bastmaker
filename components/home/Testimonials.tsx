"use client";

import { SectionBG5 } from "@/components/sectionBG";
import { getTweetIds } from "@/config/testimonials";
import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { Tweet } from "react-tweet";

function TweetSkeleton() {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="animate-pulse">
        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mt-2"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TweetItem({ tweetId }: { tweetId: string }) {
  return (
    <div className="flex justify-center">
      <div className="w-full max-w-md">
        <Suspense fallback={<TweetSkeleton />}>
          <Tweet id={tweetId} />
        </Suspense>
      </div>
    </div>
  );
}

export default function Testimonials() {
  const t = useTranslations("Landing.Testimonials");
  const tweetIds = getTweetIds();

  return (
    <section className="py-16 relative">
      <SectionBG5 />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("title")}</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {t("description")}
          </p>
        </div>

        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {tweetIds.map((tweetId: string) => (
            <TweetItem key={tweetId} tweetId={tweetId} />
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import { PricingCardDisplay } from "@/components/pricing/PricingCardDisplay";
import { useAuth } from "@/components/providers/AuthProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEFAULT_LOCALE } from "@/i18n/routing";
import { PricingPlan } from "@/types/pricing";
import { Check, Gift } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface PricingClientProps {
  annualPlans: PricingPlan[];
  monthlyPlans: PricingPlan[];
  oneTimePlans: PricingPlan[];
  locale: string;
}

export default function PricingClient({
  annualPlans,
  monthlyPlans,
  oneTimePlans,
  locale,
}: PricingClientProps) {
  const t = useTranslations("Pricing");
  const { user } = useAuth();

  const renderPlans = (
    plans: PricingPlan[],
    planType: "monthly" | "annual" | "one-time"
  ) => {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 max-w-[1400px] mx-auto">
        <FreePlanCard t={t} isLoggedIn={!!user} />
        {plans.map((plan, index) => {
          const localizedPlan =
            plan.lang_jsonb?.[locale] || plan.lang_jsonb?.[DEFAULT_LOCALE];

          if (!localizedPlan) {
            console.warn(
              `Missing localization for locale '${
                locale || DEFAULT_LOCALE
              }' for plan ID ${plan.id}`
            );
            return null;
          }

          const cardId =
            (planType === "annual" || planType === "monthly") && index === 1
              ? "subscription-card-highlight"
              : undefined;

          return (
            <PricingCardDisplay
              id={cardId}
              key={plan.id}
              plan={plan}
              localizedPlan={localizedPlan}
            />
          );
        })}
      </div>
    );
};

type TranslationFunction = ReturnType<typeof useTranslations>;

function FreePlanCard({
  t,
  isLoggedIn,
}: {
  t: TranslationFunction;
  isLoggedIn: boolean;
}) {
  const includedFeatureKeys = [
    "textToImage",
    "imageToImage",
    "editingTools",
    "artEffects",
    "pngDownloads",
    "storage",
    "emailSupport",
  ] as const;

  const limitedFeatureKeys = [
    "privateGeneration",
    "priority",
    "commercial",
    "adFree",
  ] as const;

  const features = [
    ...includedFeatureKeys.map((key) => ({
      label: t(`freePlan.features.${key}`),
      included: true,
    })),
    ...limitedFeatureKeys.map((key) => ({
      label: t(`freePlan.limited.${key}`),
      included: false,
    })),
  ];

  const priceSuffix = t("freePlan.priceSuffix").replace(/^\//, "");
  return (
    <div className="relative w-full rounded-[20px] border border-white/10 bg-[#1e1e22] px-8 py-8 text-white shadow-[0_18px_45px_rgba(0,0,0,0.5)]">
      <div className="absolute right-6 top-6 rounded-xl bg-[#2a2a2f] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white/80">
        {t("freePlan.badge")}
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold text-[#c7d2ff]">
          {t("freePlan.title")}
        </h3>

        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-5xl font-extrabold leading-none">
            {t("freePlan.price")}
          </span>
          {priceSuffix ? (
            <span className="text-base font-medium uppercase tracking-wide text-white/60">
              /{priceSuffix}
            </span>
          ) : null}
        </div>

        <div className="h-px w-full bg-[#2b2b30]" />

        {isLoggedIn ? (
          <div className="block rounded-xl bg-[linear-gradient(90deg,#E9B9FF,#9CC4FF)] px-6 py-3 text-center text-base font-semibold text-black shadow-[0_12px_30px_rgba(0,0,0,0.4)] select-none cursor-default">
            {(() => {
              const loggedInLabel = t("freePlan.ctaLoggedIn");
              return loggedInLabel === "Pricing.freePlan.ctaLoggedIn"
                ? t("freePlan.badge")
                : loggedInLabel;
            })()}
          </div>
        ) : (
          <Link
            href="/sign-up"
            className="block rounded-xl bg-[linear-gradient(90deg,#E9B9FF,#9CC4FF)] px-6 py-3 text-center text-base font-semibold text-black shadow-[0_12px_30px_rgba(0,0,0,0.4)] transition-all duration-150 hover:-translate-y-0.5 hover:brightness-105"
          >
            {t("freePlan.badge")}
          </Link>
        )}
      </div>

      <div className="mt-6 rounded-[14px] border border-white/10 bg-[#1b1b1f] p-5">
        <div className="text-base font-semibold">
          {t("freePlan.features.credits")}
        </div>

        <div className="mt-3 flex gap-2 text-xl">
          {Array.from({ length: 5 }).map((_, index) => (
            <span
              key={index}
              className={
                index === 0
                  ? "text-[#e4c8ff] brightness-125"
                  : "text-white/30 opacity-70"
              }
              aria-hidden="true"
            >
              ✨
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {features.map((feature) => (
          <div
            key={feature.label}
            className={`flex items-center gap-3 text-[15px] ${
              feature.included
                ? "text-white/85"
                : "text-white/40 line-through decoration-white/30"
            }`}
          >
            <Check
              className={`h-5 w-5 flex-shrink-0 ${
                feature.included ? "text-[#9acbff]" : "text-white/30"
              }`}
            />
            <span>{feature.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

  return (
    <div className="w-full mx-auto space-y-20">
      <div className="mt-10">
        <div className="text-center mb-10 space-y-4">
          <h2 className="text-3xl md:text-4xl font-semibold text-white">
            {t("SubscriptionTitle")}
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto">
            {t("SubscriptionDescription")}
          </p>
        </div>
        <Tabs defaultValue="annual" className="w-full mx-auto max-w-6xl">
          <TabsList className="mx-auto flex w-full max-w-md items-center justify-between rounded-full bg-white/10 p-1 backdrop-blur">
            <TabsTrigger
              value="monthly"
              className="flex-1 rounded-full px-6 py-2 text-sm font-medium text-white/70 transition data-[state=active]:bg-[linear-gradient(to_right,rgb(18,194,233),rgb(196,113,237),rgb(246,79,89))] data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              {t("monthly")}
            </TabsTrigger>
            <TabsTrigger
              value="annual"
              className="flex-1 rounded-full px-6 py-2 text-sm font-medium text-white/70 transition data-[state=active]:bg-[linear-gradient(to_right,rgb(18,194,233),rgb(196,113,237),rgb(246,79,89))] data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              <span className="flex items-center justify-center gap-2">
                {t("annual")}
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-white">
                  <Gift className="w-4 h-4 text-yellow-300" />
                  <span className="uppercase tracking-wide">{t("saveTip")}</span>
                </span>
              </span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="monthly" className="mt-10">
            {renderPlans(monthlyPlans, "monthly")}
          </TabsContent>
          <TabsContent value="annual" className="mt-10">
            {renderPlans(annualPlans, "annual")}
          </TabsContent>
        </Tabs>
      </div>

      {oneTimePlans.length > 0 && (
        <div className="space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-semibold text-white">
              {t("oneTimeTitle")}
            </h2>
            <p className="text-white/70 max-w-2xl mx-auto">
              {t("oneTimeDescription")}
            </p>
          </div>
          {renderPlans(oneTimePlans, "one-time")}
        </div>
      )}
    </div>
  );
}

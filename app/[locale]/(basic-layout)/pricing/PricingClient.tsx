"use client";

import { PricingCardDisplay } from "@/components/pricing/PricingCardDisplay";
import { useAuth } from "@/components/providers/AuthProvider";
import { useUserBenefits } from "@/hooks/useUserBenefits";
import { DEFAULT_LOCALE } from "@/i18n/routing";
import { PricingPlan } from "@/types/pricing";
import { Check } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";

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
  const { benefits } = useUserBenefits();
  const [billingCycle, setBillingCycle] = useState<"annual" | "monthly">(
    "annual"
  );
  const activePlanId = benefits?.activePlanId ?? null;

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
              currentPlanId={activePlanId}
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

        <div className="flex justify-center">
          <div className="inline-flex items-center gap-1 rounded-full border border-[#2f2f33] bg-[#16171b] p-1.5">
            {(["monthly", "annual"] as const).map((cycle) => (
              <button
                key={cycle}
                type="button"
                onClick={() => setBillingCycle(cycle)}
                className={`group flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                  billingCycle === cycle
                    ? "bg-[#26262b] text-white"
                    : "text-[#8b8b90]"
                }`}
              >
                <span>
                  {cycle === "annual" ? t("annual") : t("monthly")}
                </span>
                {cycle === "annual" ? (
                  <span
                    className={`rounded-full px-3 py-0.5 text-[11px] font-semibold transition ${
                      billingCycle === cycle
                        ? "bg-[#2f2f34] text-white"
                        : "bg-[#26262b] text-white/70"
                    }`}
                  >
                    {t("saveTip")}
                  </span>
                ) : (
                  <span
                    className={`rounded-full px-3 py-0.5 text-[11px] font-semibold transition ${
                      billingCycle === cycle
                        ? "bg-[#2f2f34] text-white"
                        : "bg-[#26262b] text-white/70"
                    }`}
                  >
                    Save 30%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10">
          {billingCycle === "monthly"
            ? renderPlans(monthlyPlans, "monthly")
            : renderPlans(annualPlans, "annual")}
        </div>
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

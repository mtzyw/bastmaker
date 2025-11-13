"use client";

import { PricingCardDisplay } from "@/components/pricing/PricingCardDisplay";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEFAULT_LOCALE } from "@/i18n/routing";
import { PricingPlan } from "@/types/pricing";
import { Gift } from "lucide-react";
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

  const renderPlans = (
    plans: PricingPlan[],
    planType: "monthly" | "annual" | "one-time"
  ) => {
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
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
        <Tabs defaultValue="annual" className="w-full mx-auto max-w-4xl">
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

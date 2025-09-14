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
      <div
        className={`grid grid-cols-1 md:grid-cols-3 gap-8 ${
          plans.length > 0 ? `md:grid-cols-${plans.length}` : ""
        }`}
      >
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
    <div className="w-full mx-auto">
      <div className="mt-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold">
            {t("SubscriptionTitle")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("SubscriptionDescription")}
          </p>
        </div>
        <Tabs defaultValue="annual" className="w-full mx-auto">
          <TabsList className="grid w-fit mx-auto grid-cols-2 h-12 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <TabsTrigger
              value="monthly"
              className="px-6 py-2 text-sm font-normal rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 dark:text-gray-300 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white"
            >
              {t("monthly")}
            </TabsTrigger>
            <TabsTrigger
              value="annual"
              className="px-6 py-2 text-sm font-normal rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 dark:text-gray-300 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white relative"
            >
              <span className="flex items-center gap-2">
                {t("annual")}
                <span className="inline-flex items-center gap-1 text-xs font-semibold">
                  <Gift className="w-4 h-4 text-main" />
                  <span className="gradient-text">{t("saveTip")}</span>
                </span>
              </span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="monthly" className="mt-8">
            {renderPlans(monthlyPlans, "monthly")}
          </TabsContent>
          <TabsContent value="annual" className="mt-8">
            {renderPlans(annualPlans, "annual")}
          </TabsContent>
        </Tabs>
      </div>

      {oneTimePlans.length > 0 && (
        <div className="mt-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">
              {t("oneTimeTitle")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("oneTimeDescription")}
            </p>
          </div>
          {renderPlans(oneTimePlans, "one-time")}
        </div>
      )}
    </div>
  );
}

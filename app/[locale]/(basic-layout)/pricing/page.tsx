import { getPublicPricingPlans } from "@/actions/prices/public";
import { Locale } from "@/i18n/routing";
import { constructMetadata } from "@/lib/metadata";
import { PricingPlan } from "@/types/pricing";
import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import FlashSaleBanner from "./FlashSaleBanner";
import PricingClient from "./PricingClient";
import PricingFAQ from "./PricingFAQ";

type Params = Promise<{ locale: string }>;

type MetadataProps = {
  params: Params;
};

export async function generateMetadata({
  params,
}: MetadataProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Pricing" });

  return constructMetadata({
    page: "Pricing",
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    path: `/pricing`,
  });
}

export default async function PricingPage() {
  const t = await getTranslations("Pricing");
  const locale = await getLocale();

  let allPlans: PricingPlan[] = [];
  const result = await getPublicPricingPlans();

  if (result.success) {
    allPlans = result.data || [];
  } else {
    console.error("Failed to fetch public pricing plans:", result.error);
  }

  const annualPlans = allPlans.filter(
    (plan) =>
      plan.payment_type === "recurring" && plan.recurring_interval === "year"
  );

  const monthlyPlans = allPlans.filter(
    (plan) =>
      plan.payment_type === "recurring" && plan.recurring_interval === "month"
  );

  const oneTimePlans = allPlans.filter(
    (plan) => plan.payment_type === "one_time"
  );

  return (
    <div className="container max-w-7xl mx-auto px-4 md:px-8 py-16">
      <div className="text-center mb-16">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{t("title")}</h1>
      </div>

      <FlashSaleBanner />

      <PricingClient
        annualPlans={annualPlans}
        monthlyPlans={monthlyPlans}
        oneTimePlans={oneTimePlans}
        locale={locale}
      />

      <PricingFAQ />
    </div>
  );
}

import { getPublicPricingPlans } from "@/actions/prices/public";
import { Locale } from "@/i18n/routing";
import { constructMetadata } from "@/lib/metadata";
import { PricingPlan } from "@/types/pricing";
import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
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
    <div className="relative min-h-screen w-full overflow-hidden bg-[#2c2c2e] text-white">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(23,92,255,0.35),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,_rgba(255,91,235,0.25),transparent_45%)]" />
        <div className="absolute inset-0 bg-[#0a0a0b]" />
      </div>
      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 py-16 space-y-12 bg-[#0a0a0b]">
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-5xl font-semibold text-white">{t("title")}</h1>
          <p className="text-white/70 max-w-3xl mx-auto">{t("description")}</p>
        </div>

        <PricingClient
          annualPlans={annualPlans}
          monthlyPlans={monthlyPlans}
          oneTimePlans={oneTimePlans}
          locale={locale}
        />

        <PricingFAQ />
      </div>
    </div>
  );
}

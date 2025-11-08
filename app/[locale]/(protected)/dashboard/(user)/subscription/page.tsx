import {
  getDetailedSubscriptionInfo,
  getUserBenefits,
} from "@/actions/usage/benefits";
import { Button } from "@/components/ui/button";
import { Link as I18nLink } from "@/i18n/routing";
import { constructMetadata } from "@/lib/metadata";
import { createStripePortalSession } from "@/lib/stripe/actions";
import { createClient } from "@/lib/supabase/server";
import { ExternalLink, Settings } from "lucide-react";
import { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import DetailedSubscriptionDisplay from "./DetailedSubscriptionDisplay";

type Params = Promise<{ locale: string }>;

type MetadataProps = {
  params: Params;
};

export async function generateMetadata({
  params,
}: MetadataProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "Subscription",
  });

  return constructMetadata({
    page: "Subscription",
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    path: `/dashboard/subscription`,
  });
}

export default async function SubscriptionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-up");
  }

  const benefits = await getUserBenefits(user.id);
  const detailedInfo = await getDetailedSubscriptionInfo(user.id);

  const isMember =
    benefits.subscriptionStatus === "active" ||
    benefits.subscriptionStatus === "trialing";

  const t = await getTranslations("Subscription");

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-3">{t("title")}</h1>
        <p className="text-lg text-muted-foreground">{t("description")}</p>
      </div>

      <DetailedSubscriptionDisplay subscriptionInfo={detailedInfo} />
      {isMember ? (
        <div className="rounded-xl border bg-card p-8 shadow-sm">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Settings className="h-6 w-6" />
              <h2 className="text-xl font-semibold">{t("management.title")}</h2>
            </div>

            <p className="text-muted-foreground leading-relaxed">
              {t("management.description")}
            </p>

            <form action={createStripePortalSession} className="space-y-4">
              <Button
                type="submit"
                variant="outline"
                className="h-11 px-6 gap-2 font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                <span>{t("management.manageButton")}</span>
              </Button>
              <p className="text-xs text-muted-foreground">
                {t("management.redirectNotice")}
              </p>
            </form>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border bg-card p-8 shadow-sm">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              {t("noSubscription.title")}
            </h3>
            <p className="text-muted-foreground">
              {t("noSubscription.description")}
            </p>
            <Button
              asChild
              className="h-11 px-6 font-medium text-white shadow-lg shadow-[#f64f59]/30 bg-[linear-gradient(to_right,rgb(18,194,233),rgb(196,113,237),rgb(246,79,89))] hover:opacity-90"
            >
              <I18nLink
                href={process.env.NEXT_PUBLIC_PRICING_PATH!}
                title={t("noSubscription.upgradeButton")}
              >
                {t("noSubscription.upgradeButton")}
              </I18nLink>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

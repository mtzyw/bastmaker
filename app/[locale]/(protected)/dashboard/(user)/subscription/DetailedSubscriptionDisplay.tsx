"use client";

import { DetailedSubscriptionInfo } from "@/actions/usage/benefits";
import { Badge } from "@/components/ui/badge";
import { formatTimestampWithIntl } from "@/lib/utils";
import { Calendar, Clock, CreditCard } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { BiCoinStack } from "react-icons/bi";

interface DetailedSubscriptionDisplayProps {
  subscriptionInfo: DetailedSubscriptionInfo;
}

function getStatusColor(status: string | null) {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800";
    case "trialing":
      return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800";
    case "past_due":
      return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800";
    case "canceled":
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800";
    case "inactive_period_ended":
      return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800";
  }
}

export default function DetailedSubscriptionDisplay({
  subscriptionInfo,
}: DetailedSubscriptionDisplayProps) {
  const locale = useLocale();
  const t = useTranslations("Subscription");

  const { subscription, plan } = subscriptionInfo;

  if (!subscription || !plan) {
    return null;
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return t("common.notSet");
    return formatTimestampWithIntl(dateString, locale);
  };

  const getStatusText = (status: string | null) => {
    if (!status) return t("status.unknown");

    const statusTranslations: Record<string, string> = {
      active: t("status.active"),
      trialing: t("status.trialing"),
      past_due: t("status.past_due"),
      canceled: t("status.canceled"),
      inactive_period_ended: t("status.inactive_period_ended"),
    };

    return statusTranslations[status] || status;
  };

  const getBillingCycleText = (interval: string) => {
    if (interval === "month") return t("subscriptionDetails.monthly");
    if (interval === "year") return t("subscriptionDetails.yearly");
    return interval;
  };

  const benefits = plan.benefits_jsonb || {};

  return (
    <div className="space-y-8">
      {/* Credits Information */}
      <div className="rounded-xl border bg-card p-8 shadow-sm">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <BiCoinStack
              className={`w-6 h-6 ${
                benefits.totalAvailableCredits > 0
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            />
            <h2 className="text-xl font-semibold">{t("credits.title")}</h2>
          </div>

          <p className="text-muted-foreground leading-relaxed">
            {t("credits.description")}
          </p>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center p-6 bg-primary/5 dark:bg-primary/10 rounded-lg border">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {t("credits.totalCredits")}
                </p>
                <p className="text-2xl font-semibold">
                  {subscriptionInfo.totalAvailableCredits}
                </p>
              </div>
            </div>

            <div className="text-center p-6 bg-muted/50 rounded-lg border">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {t("credits.subscriptionCredits")}
                </p>
                <p className="text-2xl font-semibold">
                  {subscriptionInfo.subscriptionCreditsBalance}
                </p>
              </div>
            </div>

            <div className="text-center p-6 bg-muted/50 rounded-lg border">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {t("credits.lifetimeCredits")}
                </p>
                <p className="text-2xl font-semibold">
                  {subscriptionInfo.oneTimeCreditsBalance}
                </p>
              </div>
            </div>
          </div>

          {benefits.monthly_credits && (
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  {t("credits.monthlyAllowanceTitle")}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  {t("credits.monthlyAllowanceDescription", {
                    credits: benefits.monthly_credits,
                  })}
                </p>
              </div>
            </div>
          )}

          {subscriptionInfo.yearlyAllocation && (
            <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 rounded-lg">
              <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                  {t("credits.yearlyResetTitle")}
                </p>
                <div className="space-y-1">
                  <p className="text-sm text-emerald-700 dark:text-emerald-400">
                    {t("credits.yearlyResetDescription", {
                      credits: subscriptionInfo.yearlyAllocation.monthlyCredits,
                    })}
                  </p>
                  <p className="text-sm text-emerald-700 dark:text-emerald-400">
                    {t("credits.nextResetDate", {
                      date: formatDate(
                        subscriptionInfo.yearlyAllocation.nextCreditDate
                      ),
                    })}
                  </p>
                  {/* <p className="text-xs text-emerald-600 dark:text-emerald-500">
                    {t("credits.remainingMonths", {
                      months: subscriptionInfo.yearlyAllocation.remainingMonths,
                    })}
                  </p> */}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Subscription Overview */}
      <div className="rounded-xl border bg-card p-8 shadow-sm">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <CreditCard className="h-6 w-6" />
            <h2 className="text-xl font-semibold">
              {t("subscriptionDetails.title")}
            </h2>
          </div>

          <p className="text-muted-foreground leading-relaxed">
            {t("subscriptionDetails.description")}
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {t("subscriptionDetails.currentPlan")}
                </label>
                <p className="text-lg font-semibold">{plan.card_title}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {t("subscriptionDetails.status")}
                </label>
                <div>
                  <Badge
                    className={getStatusColor(
                      subscriptionInfo.subscriptionStatus
                    )}
                  >
                    {getStatusText(subscriptionInfo.subscriptionStatus)}
                  </Badge>
                </div>
              </div>

              {plan.recurring_interval && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    {t("subscriptionDetails.billingCycle")}
                  </label>
                  <p className="text-sm">
                    {getBillingCycleText(plan.recurring_interval)}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {subscription.current_period_start && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    {t("subscriptionDetails.currentPeriod")}
                  </label>
                  <div className="space-y-1">
                    <p className="text-sm">
                      {formatDate(subscription.current_period_start)} -{" "}
                      {formatDate(subscription.current_period_end)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {subscription.cancel_at_period_end && (
            <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800/50 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  {t("subscriptionDetails.subscriptionEndingTitle")}
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  {t("subscriptionDetails.subscriptionEndingDescription")}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

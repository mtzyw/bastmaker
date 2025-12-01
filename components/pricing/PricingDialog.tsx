"use client";

import { getPublicPricingPlans } from "@/actions/prices/public";
import { PricingCardDisplay } from "@/components/pricing/PricingCardDisplay";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { DEFAULT_LOCALE } from "@/i18n/routing";
import { PricingPlan } from "@/types/pricing";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

interface PricingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: string;
}

export function PricingDialog({
  open,
  onOpenChange,
  locale,
}: PricingDialogProps) {
  const t = useTranslations("Pricing");
  const [billingCycle, setBillingCycle] = useState<"annual" | "monthly">(
    "annual"
  );
  const [plans, setPlans] = useState<{
    annual: PricingPlan[];
    monthly: PricingPlan[];
    oneTime: PricingPlan[];
  }>({ annual: [], monthly: [], oneTime: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && loading) {
      const fetchPlans = async () => {
        try {
          const result = await getPublicPricingPlans();
          if (result.success && result.data) {
            const allPlans = result.data;
            setPlans({
              annual: allPlans.filter(
                (p) =>
                  p.payment_type === "recurring" &&
                  p.recurring_interval === "year"
              ),
              monthly: allPlans.filter(
                (p) =>
                  p.payment_type === "recurring" &&
                  p.recurring_interval === "month"
              ),
              oneTime: allPlans.filter((p) => p.payment_type === "one_time"),
            });
          }
        } catch (error) {
          console.error("Failed to fetch pricing plans:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchPlans();
    }
  }, [open, loading]);

  const renderPlans = (
    plansToRender: PricingPlan[],
    planType: "monthly" | "annual" | "one-time"
  ) => {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {plansToRender.map((plan, index) => {
          const localizedPlan =
            plan.lang_jsonb?.[locale] || plan.lang_jsonb?.[DEFAULT_LOCALE];

          if (!localizedPlan) return null;

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl border-none bg-transparent p-0 shadow-none">
        <DialogTitle className="sr-only">{t("SubscriptionTitle")}</DialogTitle>
        <div className="relative w-full overflow-hidden rounded-[24px] border border-white/10 bg-[#0a0a0b] p-6 md:p-10 shadow-2xl">
          {/* Background Effects */}
          <div className="absolute inset-0 pointer-events-none">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(23,92,255,0.15),transparent_55%)]" />
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,_rgba(255,91,235,0.1),transparent_45%)]" />
          </div>

          <div className="relative z-10">
            <div className="mb-8 text-center space-y-3">
              <h2 className="text-2xl md:text-3xl font-semibold text-white">
                {t("SubscriptionTitle")}
              </h2>
              <p className="text-white/70 max-w-xl mx-auto text-sm md:text-base">
                {t("SubscriptionDescription")}
              </p>
            </div>

            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-1 rounded-full border border-[#2f2f33] bg-[#16171b] p-1">
                {(["monthly", "annual"] as const).map((cycle) => (
                  <button
                    key={cycle}
                    type="button"
                    onClick={() => setBillingCycle(cycle)}
                    className={`group flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition ${
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
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition ${
                          billingCycle === cycle
                            ? "bg-[#2f2f34] text-white"
                            : "bg-[#26262b] text-white/70"
                        }`}
                      >
                        {t("saveTip")}
                      </span>
                    ) : (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition ${
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

            {loading ? (
              <div className="flex h-60 items-center justify-center text-white/50">
                Loading plans...
              </div>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                 {billingCycle === "monthly"
                  ? renderPlans(plans.monthly, "monthly")
                  : renderPlans(plans.annual, "annual")}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

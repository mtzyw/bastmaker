"use client";

import { getPublicPricingPlans } from "@/actions/prices/public";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { DEFAULT_LOCALE, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { PricingPlan, PricingPlanFeature, PricingPlanTranslation } from "@/types/pricing";
import { Check, Loader2, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface SubscriptionPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscriptionPopup({ open, onOpenChange }: SubscriptionPopupProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [plans, setPlans] = useState<{
    annual: PricingPlan[];
    monthly: PricingPlan[];
  }>({ annual: [], monthly: [] });
  const [loading, setLoading] = useState(true);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("Pricing");

  useEffect(() => {
    if (open) {
      const fetchPlans = async () => {
        try {
          const result = await getPublicPricingPlans();
          if (result.success && result.data) {
            const allPlans = result.data;
            const annualPlans = allPlans.filter(
              (p) =>
                p.payment_type === "recurring" &&
                p.recurring_interval === "year"
            );
            const monthlyPlans = allPlans.filter(
              (p) =>
                p.payment_type === "recurring" &&
                p.recurring_interval === "month"
            );

            setPlans({
              annual: annualPlans,
              monthly: monthlyPlans,
            });

            // Set initial selected plan (highlighted or first)
            const defaultPlans = billingCycle === "monthly" ? monthlyPlans : annualPlans;
            const highlighted = defaultPlans.find(p => p.is_highlighted);
            if (highlighted) {
              setSelectedPlanId(highlighted.id);
            } else if (defaultPlans.length > 0) {
              setSelectedPlanId(defaultPlans[0].id);
            }
          }
        } catch (error) {
          console.error("Failed to fetch pricing plans:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchPlans();
    }
  }, [open]);

  // Update selected plan when billing cycle changes
  useEffect(() => {
    const currentPlansList = billingCycle === "monthly" ? plans.monthly : plans.annual;
    if (currentPlansList.length > 0) {
      const highlighted = currentPlansList.find(p => p.is_highlighted);
      if (highlighted) {
        setSelectedPlanId(highlighted.id);
      } else {
        setSelectedPlanId(currentPlansList[0].id);
      }
    }
  }, [billingCycle, plans]);


  const handleSubscribe = async () => {
    if (selectedPlanId === "free") {
      return;
    }

    const plan = currentPlans.find(p => p.id === selectedPlanId);
    if (plan) {
      await handleCheckout(plan);
    }
  };

  const handleCheckout = async (plan: PricingPlan) => {
    const stripePriceId = plan.stripe_price_id ?? null;
    if (!stripePriceId) {
      toast.error("Price ID is missing for this plan.");
      return;
    }

    setProcessingPlanId(plan.id);
    try {
      const requestBody = {
        priceId: stripePriceId,
        couponCode: plan.stripe_coupon_id,
      };

      const response = await fetch("/api/stripe/checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": (locale || DEFAULT_LOCALE) as string,
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.push(`/sign-up?next=${encodeURIComponent("/pricing")}`);
          toast.error("You must be logged in to purchase a plan.");
          return;
        }
        throw new Error(result.error || "HTTP error! status: " + response.status);
      }

      if (!result.success) {
        throw new Error(result.error || "Failed to create checkout session.");
      }

      if (result.data?.url) {
        router.push(result.data.url);
      } else {
        throw new Error("Checkout URL not received.");
      }
    } catch (error) {
      console.error("Checkout Error:", error);
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred.");
      setProcessingPlanId(null);
    }
  };

  const currentPlans = billingCycle === "monthly" ? plans.monthly : plans.annual;

  // Helper to get localized string
  const getLocalized = (plan: PricingPlan, key: keyof PricingPlanTranslation) => {
    const localized = plan.lang_jsonb?.[locale] || plan.lang_jsonb?.[DEFAULT_LOCALE];
    return localized?.[key] || (plan as any)[key];
  };

  // Define Free Plan Features
  const freeFeatures = [
    { description: t("freePlan.features.credits"), included: true },
    { description: t("freePlan.features.textToImage"), included: true },
    { description: t("freePlan.features.imageToImage"), included: true },
    { description: t("freePlan.features.editingTools"), included: true },
    { description: t("freePlan.features.artEffects"), included: true },
    { description: t("freePlan.features.pngDownloads"), included: true },
    { description: t("freePlan.features.storage"), included: true },
    { description: t("freePlan.features.emailSupport"), included: true },
  ];

  // Determine which plan's benefits to show
  let displayFeatures: any[] = [];

  // Use selected plan
  const activePlanId = selectedPlanId;

  if (activePlanId === "free") {
    displayFeatures = freeFeatures;
  } else {
    const displayPlan =
      currentPlans.find(p => p.id === activePlanId) ||
      currentPlans.find(p => p.is_highlighted) ||
      currentPlans[0];

    if (displayPlan) {
      displayFeatures = displayPlan.lang_jsonb?.[locale]?.features || displayPlan.features || [];
    }
  }

  // Function to highlight numbers and prices in text
  const highlightText = (text: string) => {
    // Regex to match currency (e.g., $0.033) and numbers (e.g., 90, 990000)
    // This is a simple heuristic and might need adjustment based on actual content
    const parts = text.split(/(\$[\d.]+|¥[\d.]+|[\d,]+)/g);
    return parts.map((part, index) => {
      if (/^(\$[\d.]+|¥[\d.]+|[\d,]+)$/.test(part)) {
        return <span key={index} className="text-[#10b981] font-bold">{part}</span>;
      }
      return part;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[520px] border border-white/10 bg-[#18181b] p-0 text-white shadow-2xl sm:rounded-[24px] overflow-hidden flex flex-col">
        <DialogTitle className="sr-only">{t("SubscriptionTitle")}</DialogTitle>

        <div className="flex flex-col md:flex-row h-full overflow-hidden">
          {/* Left Side - Plans */}
          <div className="flex-1 p-6 md:p-8 space-y-6 bg-[#18181b] overflow-y-auto">
            {/* Toggle */}
            <div className="flex items-center gap-4 mb-6">
              <div className="inline-flex rounded-lg bg-[#27272a] p-1">
                <button
                  onClick={() => setBillingCycle("monthly")}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                    billingCycle === "monthly"
                      ? "bg-[#3f3f46] text-white shadow-sm"
                      : "text-gray-400 hover:text-white"
                  )}
                >
                  {t("monthly")}
                </button>
                <button
                  onClick={() => setBillingCycle("annual")}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                    billingCycle === "annual"
                      ? "bg-[#3f3f46] text-white shadow-sm"
                      : "text-gray-400 hover:text-white"
                  )}
                >
                  {t("annual")}
                  <span className="bg-[#10b981] text-black text-[10px] font-bold px-1.5 py-0.5 rounded">
                    43% OFF 🎉
                  </span>
                </button>
              </div>
            </div>

            {/* Cards */}
            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-white/50" />
                </div>
              ) : (
                <>
                  {/* Free Plan Card */}
                  <div
                    onClick={() => setSelectedPlanId("free")}
                    className={cn(
                      "relative p-5 rounded-2xl border transition-all cursor-pointer group",
                      selectedPlanId === "free"
                        ? "bg-[#27272a] border-white/40 shadow-md"
                        : "bg-[#27272a] border-transparent hover:border-white/10"
                    )}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-2xl font-bold">{t("freePlan.title")}</h3>
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-[#38bdf8] font-semibold">
                          <Sparkles className="w-4 h-4 fill-current" />
                          <span>{t("freePlan.features.credits").replace(/[^0-9]/g, '')}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold">{t("freePlan.price")}</div>
                      </div>
                    </div>
                  </div>

                  {currentPlans.map((plan) => {
                    const title = getLocalized(plan, "card_title");
                    const price = getLocalized(plan, "display_price");
                    const highlightText = getLocalized(plan, "highlight_text");
                    const features = (getLocalized(plan, "features") as PricingPlanFeature[]) || [];
                    // Find credit feature to display
                    const creditFeature = features.find(f =>
                      f.description.toLowerCase().includes("credit") ||
                      f.description.includes("积分") ||
                      f.description.includes("点数") ||
                      f.description.includes("クレジット")
                    );
                    const credits = creditFeature ? creditFeature.description.replace(/[^0-9]/g, '') : "0";

                    const isSelected = selectedPlanId === plan.id;

                    return (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={cn(
                          "relative p-5 rounded-2xl border transition-all cursor-pointer group",
                          isSelected
                            ? "bg-[#3b82f6] border-[#3b82f6] shadow-lg shadow-blue-900/20"
                            : "bg-[#27272a] border-transparent hover:border-white/10"
                        )}
                      >
                        {plan.is_highlighted && (
                          <div className="absolute -top-3 -left-3">
                            <span className="bg-[#ef4444] text-white text-xs font-bold px-3 py-1 rounded-br-lg shadow-sm transform -rotate-12 origin-bottom-right block w-fit">
                              {t("smartBanner.returning.badge")}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="text-2xl font-bold">{title}</h3>
                              {highlightText && (
                                <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                                  {highlightText}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 mt-1 text-[#38bdf8] font-semibold">
                              <Sparkles className="w-4 h-4 fill-current" />
                              <span>{credits}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold">{price}</div>
                            {processingPlanId === plan.id && (
                              <div className="text-xs mt-1 flex justify-end">
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          {/* Right Side - Benefits */}
          <div className="flex-1 bg-[#27272a] p-6 md:p-8 border-l border-white/5 flex flex-col overflow-hidden">
            <h3 className="text-lg font-semibold mb-6 text-white shrink-0">
              {t("vipBenefits.title")}
            </h3>
            <div className="flex-1 overflow-y-auto pr-2">
              <ul className="space-y-4">
                {displayFeatures.map((feature: any, index: number) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-gray-300">
                    <Check className="w-5 h-5 text-[#10b981] shrink-0" />
                    <span>
                      {highlightText(feature.description)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 shrink-0">
              <button
                onClick={handleSubscribe}
                disabled={!!processingPlanId}
                className="w-full rounded-xl bg-[#10b981] py-3 text-center text-base font-bold text-black shadow-lg transition-all hover:bg-[#059669] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingPlanId ? (
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                ) : (
                  t("vipBenefits.getItNow")
                )}
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 text-xs text-gray-500 text-center shrink-0">
              {t("vipBenefits.terms")}
              <Link
                href="/terms-of-service"
                className="text-[#10b981] cursor-pointer hover:underline ml-1"
                onClick={() => onOpenChange(false)}
              >
                {t("vipBenefits.termsLink")}
              </Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import PricingCTA from "@/components/pricing/PricingCTA";
import { PricingPlan, PricingPlanTranslation } from "@/types/pricing";
import { Check } from "lucide-react";

const defaultCtaStyle =
  "bg-[linear-gradient(90deg,#E9B9FF,#9CC4FF)] text-black font-semibold shadow-[0_12px_30px_rgba(0,0,0,0.35)] hover:brightness-105 hover:-translate-y-0.5 transition-all duration-150 h-[52px] text-base";
const highlightedCtaStyle =
  "bg-[linear-gradient(90deg,#E9B9FF,#9CC4FF)] text-black font-semibold shadow-[0_12px_30px_rgba(0,0,0,0.35)] hover:brightness-105 hover:-translate-y-0.5 transition-all duration-150 h-[52px] text-base";

interface PricingCardDisplayProps {
  id?: string;
  plan: PricingPlan;
  localizedPlan: PricingPlanTranslation;
}

export function PricingCardDisplay({
  id,
  plan,
  localizedPlan,
}: PricingCardDisplayProps) {
  const cardTitle =
    localizedPlan?.card_title || plan.card_title || "Unnamed Plan";
  const cardDescription =
    localizedPlan?.card_description || plan.card_description || "";
  const displayPrice = localizedPlan?.display_price || plan.display_price || "";
  const originalPrice = localizedPlan?.original_price || plan.original_price;
  const priceSuffix =
    localizedPlan?.price_suffix?.replace(/^\/+/, "") ||
    plan.price_suffix?.replace(/^\/+/, "");
  const features = localizedPlan?.features || plan.features || [];
  const featuresToDisplay =
    features?.filter(
      (feature) =>
        !(feature.description?.toLowerCase().includes("credit") ?? false)
    ) || [];
  const highlightText = localizedPlan?.highlight_text;
  const priceMatch = displayPrice?.match(/^([^\d]*)([\d.,]+)/);
  const currencySymbol = priceMatch?.[1]?.trim();
  const priceValue = priceMatch?.[2] || displayPrice;

  if (plan.is_highlighted) {
    const saleBadgeText = originalPrice ? "Special Offer" : "Premium";
    const bestBadgeText = highlightText || "Best Deal";
    const creditHighlight = features?.find(
      (feature) => feature.description?.toLowerCase().includes("credit") ?? false
    );
    const creditDescription =
      creditHighlight?.description || displayPrice || cardTitle;
    return (
      <div
        id={id}
        className="rounded-[24px] bg-[linear-gradient(135deg,#ff7b5f,#ff44f8,#5b8dff)] p-[2px] shadow-[0_25px_80px_rgba(18,25,60,0.45)]"
      >
        <div className="rounded-[22px] bg-[radial-gradient(circle_at_top_left,#1c2140_0%,#07091b_55%,#050515_100%)] px-6 py-6 text-white">
          <div className="mb-4 flex items-start justify-end gap-3">
            <div className="flex gap-2">
              <span className="rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/90">
                {saleBadgeText}
              </span>
              <span className="rounded-full bg-[linear-gradient(135deg,#ff7b5f,#ff44f8,#ffa64f)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#1a1030]">
                {bestBadgeText}
              </span>
            </div>
          </div>

          <div className="mb-2 flex flex-wrap items-baseline gap-2">
            {currencySymbol && (
              <span className="text-base text-white/80">{currencySymbol}</span>
            )}
            <span className="text-4xl font-bold">{priceValue}</span>
            {priceSuffix && (
              <span className="text-sm text-white/70">/{priceSuffix}</span>
            )}
            {originalPrice && (
              <span className="text-xs text-white/50 line-through">
                {originalPrice}
              </span>
            )}
          </div>
          <div className="mt-5 h-px w-full bg-white/10" />

          <div className="mt-4">
            <PricingCTA
              plan={plan}
              localizedPlan={localizedPlan}
              defaultCtaStyle={defaultCtaStyle}
              highlightedCtaStyle={highlightedCtaStyle}
            />
          </div>

          <div className="mt-5 rounded-[18px] border border-white/10 bg-[radial-gradient(circle_at_top,#2a2550_0%,#10132a_55%,#08081a_100%)] p-5">
            <div className="text-base font-semibold">{creditDescription}</div>
            <div className="mt-3 flex gap-2 text-xl text-[#ffb2ff]">
              {Array.from({ length: 5 }).map((_, index) => (
                <span key={index} className="brightness-110" aria-hidden="true">
                  ✨
                </span>
              ))}
            </div>
          </div>

          <ul className="mt-10 space-y-3">
            {featuresToDisplay.map(
              (
                feature: { description: string; included: boolean },
                index: number
              ) => (
                <li
                  key={index}
                  className="flex items-start gap-3 text-sm text-[#d6d7f6]"
                >
                  <span className="mt-0.5 text-[#7cf59b]">✔</span>
                  <span className={feature.included ? undefined : "opacity-50 line-through"}>
                    {feature.description}
                  </span>
                </li>
              )
            )}
          </ul>
        </div>
      </div>
    );
  }

  const creditHighlight = features?.find(
    (feature) => feature.description?.toLowerCase().includes("credit") ?? false
  );
  const creditDescription =
    creditHighlight?.description || displayPrice || cardTitle;
  return (
    <div
      id={id}
      className="relative w-full rounded-[20px] border border-white/10 bg-[#1e1e22] px-8 py-8 text-white shadow-[0_18px_45px_rgba(0,0,0,0.5)]"
    >
      {highlightText && (
        <div className="absolute right-6 top-6 rounded-xl bg-[#2a2a2f] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/80">
          {highlightText}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <h3 className="text-xl font-semibold text-[#c7d2ff]">{cardTitle}</h3>
        </div>

        <div className="flex flex-wrap items-baseline gap-2">
          {currencySymbol && (
            <span className="text-base text-white/70">{currencySymbol}</span>
          )}
          <span className="text-4xl font-extrabold leading-none">{priceValue}</span>
          {priceSuffix && (
            <span className="text-base font-medium uppercase tracking-wide text-white/60">
              /{priceSuffix}
            </span>
          )}
          {originalPrice && (
            <span className="text-sm text-white/50 line-through">{originalPrice}</span>
          )}
        </div>
      </div>

      <div className="mt-6 h-px w-full bg-[#2b2b30]" />

      <div className="mt-4">
        <PricingCTA
          plan={plan}
          localizedPlan={localizedPlan}
          defaultCtaStyle={defaultCtaStyle}
          highlightedCtaStyle={highlightedCtaStyle}
        />
      </div>

      <div className="mt-6 rounded-[14px] border border-white/10 bg-[#1b1b1f] p-5">
        <div className="text-base font-semibold">{creditDescription}</div>
        <div className="mt-3 flex gap-2 text-xl">
          {Array.from({ length: 5 }).map((_, index) => (
            <span
              key={index}
              className={
                index < 3
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

      <ul className="mt-6 space-y-3">
        {featuresToDisplay.map(
          (
            feature: { description: string; included: boolean },
            index: number
          ) => (
            <li
              key={index}
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
              <span>{feature.description}</span>
            </li>
          )
        )}
      </ul>
    </div>
  );
}

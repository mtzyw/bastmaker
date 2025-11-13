import PricingCTA from "@/components/pricing/PricingCTA";
import { PricingPlan, PricingPlanTranslation } from "@/types/pricing";
import { Check, X } from "lucide-react";

const defaultBorderStyle = "border-white/10";
const highlightedBorderStyle = "border-transparent";
const defaultCtaStyle = "bg-white/10 hover:bg-white/20 backdrop-blur text-white";
const highlightedCtaStyle =
  "bg-[linear-gradient(to_right,rgb(18,194,233),rgb(196,113,237),rgb(246,79,89))] hover:opacity-90";

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
  const highlightText = localizedPlan?.highlight_text;

  const cardInnerClasses = `relative rounded-2xl border px-8 py-8 backdrop-blur-lg text-white shadow-[0_20px_60px_rgba(3,8,23,0.45)] ${
    plan.is_highlighted ? `${highlightedBorderStyle} bg-[#030a18]/90` : `${defaultBorderStyle} bg-white/5`
  }`;

  const cardContent = (
    <div className={cardInnerClasses}>
      {plan.is_highlighted && highlightText && (
        <div className="absolute top-3 right-3 bg-[linear-gradient(to_right,rgb(18,194,233),rgb(196,113,237))] text-white text-[11px] px-3 py-1 rounded-full font-medium">
          {highlightText}
        </div>
      )}
      <h3 className="text-2xl font-semibold mb-2">{cardTitle}</h3>
      {cardDescription && (
        <p className="text-white/70 mb-6 min-h-[3rem]">{cardDescription}</p>
      )}

      <div className="text-4xl font-bold mb-6">
        {originalPrice ? (
          <span className="text-lg line-through decoration-2 text-white/50 mr-1">
            {originalPrice}
          </span>
        ) : null}

        {displayPrice}

        {priceSuffix ? (
          <span className="text-lg text-white/60">/{priceSuffix}</span>
        ) : null}
      </div>
      <ul className="space-y-3 mb-8">
        {features?.map(
          (
            feature: { description: string; included: boolean },
            index: number
          ) => (
            <li key={index} className="flex items-start">
              {feature.included ? (
                <Check className="text-emerald-400 h-5 w-5 mt-1 mr-3 flex-shrink-0" />
              ) : (
                <X className="text-rose-400 h-5 w-5 mt-1 mr-3 flex-shrink-0 opacity-60" />
              )}
              <span className={feature.included ? "text-white/90" : "text-white/50"}>
                {feature.description}
              </span>
            </li>
          )
        )}
      </ul>

      <PricingCTA
        plan={plan}
        localizedPlan={localizedPlan}
        defaultCtaStyle={defaultCtaStyle}
        highlightedCtaStyle={highlightedCtaStyle}
      />
    </div>
  );

  return plan.is_highlighted ? (
    <div
      id={id}
      className="rounded-2xl bg-[linear-gradient(135deg,rgba(18,194,233,0.4),rgba(196,113,237,0.5),rgba(246,79,89,0.4))] p-[1px] shadow-[0_25px_80px_rgba(18,194,233,0.25)]"
    >
      {cardContent}
    </div>
  ) : (
    <div id={id}>{cardContent}</div>
  );
}

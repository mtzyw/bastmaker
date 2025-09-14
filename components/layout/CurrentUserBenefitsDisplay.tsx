"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUserBenefits } from "@/hooks/useUserBenefits";
import { Link as I18nLink } from "@/i18n/routing";
import { Info } from "lucide-react";
import { BiCoinStack } from "react-icons/bi";

export default function CurrentUserBenefitsDisplay() {
  const { benefits, isLoading } = useUserBenefits();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <BiCoinStack className="w-4 h-4 text-muted-foreground animate-pulse" />
        <span className="text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (!benefits) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <BiCoinStack className="w-4 h-4 text-muted-foreground" />
        <span className="text-muted-foreground">-- Credits</span>
      </div>
    );
  }

  const hasDetailedCredits =
    benefits.subscriptionCreditsBalance > 0 ||
    benefits.oneTimeCreditsBalance > 0;

  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <BiCoinStack
          className={`w-4 h-4 ${
            benefits.totalAvailableCredits > 0
              ? "text-primary"
              : "text-muted-foreground"
          }`}
        />
        <span
          className={`font-medium ${
            benefits.totalAvailableCredits > 0
              ? "text-foreground"
              : "text-muted-foreground"
          }`}
        >
          {benefits.totalAvailableCredits} Credits
        </span>

        {hasDetailedCredits && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-3 h-3 text-muted-foreground hover:text-foreground" />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                <div className="space-y-1">
                  <div>Subscription: {benefits.subscriptionCreditsBalance}</div>
                  <div>Lifetime: {benefits.oneTimeCreditsBalance}</div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <div className="flex gap-1">
        {benefits.totalAvailableCredits === 0 && (
          <Button
            asChild
            size="sm"
            variant="outline"
            className="text-xs h-6 px-2"
          >
            <I18nLink
              href={process.env.NEXT_PUBLIC_PRICING_PATH!}
              title="Get Credits"
              prefetch={false}
            >
              Get Credits
            </I18nLink>
          </Button>
        )}
      </div>
    </div>
  );
}

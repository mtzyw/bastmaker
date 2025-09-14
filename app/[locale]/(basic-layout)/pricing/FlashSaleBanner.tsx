/**
 * 🎯 Core Features: Prevents page flickering, SEO-friendly, shows banner for all users
 *
 * 📊 Display Strategy:
 * 1. Subscribed users → Referral sharing banner (promote user growth)
 * 2. New users (within 48h) → New user offer banner + countdown timer
 * 3. Returning users (logged in, after 48h) → Returning user banner + daily countdown
 * 4. Unregistered users (after 48h) → New user banner + daily countdown (encourage signup)
 */
"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { siteConfig } from "@/config/site";
import { useUserBenefits } from "@/hooks/useUserBenefits";
import { useRouter } from "@/i18n/routing";
import { Clock, Gift, Share2, TrendingUp, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type BannerState = "new-user" | "returning" | "referral";

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

export default function FlashSaleBanner() {
  const t = useTranslations("Pricing");
  const router = useRouter();

  const { benefits } = useUserBenefits();
  const { user } = useAuth();

  const [bannerState, setBannerState] = useState<BannerState>("new-user");
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const isSubscribedUser =
      benefits?.subscriptionStatus === "active" ||
      benefits?.subscriptionStatus === "trialing";

    if (isSubscribedUser) {
      setBannerState("referral");
      setIsLoading(false);
      return;
    }

    const firstVisit = localStorage.getItem("pricingFirstVisit");
    const now = Date.now();

    if (!firstVisit) {
      localStorage.setItem("pricingFirstVisit", now.toString());
      setBannerState("new-user");

      const deadline = now + 48 * 60 * 60 * 1000;
      calculateTimeLeft(deadline);
    } else {
      const visitTime = parseInt(firstVisit);
      const hoursSinceFirst = (now - visitTime) / (1000 * 60 * 60);

      if (hoursSinceFirst < 48) {
        setBannerState("new-user");
        const deadline = visitTime + 48 * 60 * 60 * 1000;
        calculateTimeLeft(deadline);
      } else if (user) {
        setBannerState("returning");
        calculateDailyTimeLeft();
      } else {
        setBannerState("new-user");
        calculateDailyTimeLeft();
      }
    }

    setIsLoading(false);
  }, [benefits, user]);

  const calculateTimeLeft = (deadline: number) => {
    const now = Date.now();
    const diff = deadline - now;

    if (diff <= 0) {
      setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      return;
    }

    setTimeLeft({
      hours: Math.floor(diff / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
    });
  };

  const calculateDailyTimeLeft = () => {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const diff = endOfDay.getTime() - now.getTime();

    setTimeLeft({
      hours: Math.floor(diff / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
    });
  };

  useEffect(() => {
    if (isLoading || bannerState === "referral") return;

    const timer = setInterval(() => {
      if (bannerState === "new-user") {
        const firstVisit = localStorage.getItem("pricingFirstVisit");
        if (firstVisit) {
          const deadline = parseInt(firstVisit) + 48 * 60 * 60 * 1000;
          calculateTimeLeft(deadline);

          if (Date.now() >= deadline) {
            if (user) {
              setBannerState("returning");
              calculateDailyTimeLeft();
            } else {
              calculateDailyTimeLeft();
            }
          }
        }
      } else if (bannerState === "returning") {
        calculateDailyTimeLeft();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [bannerState, isLoading, user]);

  const formatTime = (time: number) => time.toString().padStart(2, "0");

  const handleCtaClick = () => {
    if (bannerState === "referral") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    } else {
      router.push("/pricing#subscription-card-highlight");
    }
  };

  const getBannerContent = () => {
    switch (bannerState) {
      case "new-user":
        return {
          title: t("smartBanner.newUser.title"),
          description: t("smartBanner.newUser.description"),
          urgency: t("smartBanner.newUser.urgency"),
          ctaText: t("smartBanner.newUser.ctaText"),
          icon: <Gift className="w-8 h-8 text-yellow-300" />,
          badge: t("smartBanner.newUser.badge"),
          urgencyText: t("smartBanner.newUser.urgencyText"),
          showTimer: true,
        };
      case "returning":
        return {
          title: t("smartBanner.returning.title"),
          description: t("smartBanner.returning.description"),
          urgency: t("smartBanner.returning.urgency"),
          ctaText: t("smartBanner.returning.ctaText"),
          icon: <TrendingUp className="w-8 h-8 text-yellow-300" />,
          badge: t("smartBanner.returning.badge"),
          urgencyText: t("smartBanner.returning.urgencyText"),
          showTimer: true,
        };
      case "referral":
        return {
          title: t("smartBanner.referral.title", { siteName: siteConfig.name }),
          description: t("smartBanner.referral.description", {
            siteName: siteConfig.name,
          }),
          urgency: t("smartBanner.referral.urgency"),
          ctaText: t("smartBanner.referral.ctaText"),
          icon: <Share2 className="w-8 h-8 text-yellow-300" />,
          badge: t("smartBanner.referral.badge"),
          urgencyText: t("smartBanner.referral.urgencyText"),
          showTimer: false,
        };
      default:
        return null;
    }
  };

  const content = getBannerContent();
  if (!content) return null;

  if (isLoading) {
    return <FlashSaleBannerSkeleton />;
  }

  return (
    <div className="w-full max-w-7xl mx-auto mb-12 overflow-hidden gradient-bg rounded-lg shadow-2xl relative animate-in fade-in duration-300">
      <div className="absolute top-4 left-4 bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-bold">
        {content.badge}
      </div>

      <div className="px-8 py-6 pt-12">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex-1 text-center lg:text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              <span className="flex items-center justify-center lg:justify-start gap-2">
                {content.icon}
                {content.title}
                {content.icon}
              </span>
            </h2>

            <p className="text-white/95 text-lg mb-4 max-w-2xl">
              {content.description}
            </p>

            {/* Social Proof */}
            {/* <div className="flex items-center justify-center lg:justify-start gap-4 text-white/90 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span>{content.socialProof1}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-yellow-300" />
                <span>{content.socialProof2}</span>
              </div>
            </div> */}
          </div>

          <div className="flex flex-col items-center gap-4">
            {content.showTimer && (
              <>
                <div className="flex items-center gap-2 text-white">
                  <Clock className="w-5 h-5" />
                  <span className="text-sm font-medium">{content.urgency}</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 text-center border border-white/30">
                    <div className="text-2xl font-bold text-white">
                      {formatTime(timeLeft.hours)}
                    </div>
                    <div className="text-xs text-white/80">
                      {t("smartBanner.common.hours")}
                    </div>
                  </div>
                  <div className="text-white text-xl font-bold">:</div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 text-center border border-white/30">
                    <div className="text-2xl font-bold text-white">
                      {formatTime(timeLeft.minutes)}
                    </div>
                    <div className="text-xs text-white/80">
                      {t("smartBanner.common.minutes")}
                    </div>
                  </div>
                  <div className="text-white text-xl font-bold">:</div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 text-center border border-white/30">
                    <div className="text-2xl font-bold text-white">
                      {formatTime(timeLeft.seconds)}
                    </div>
                    <div className="text-xs text-white/80">
                      {t("smartBanner.common.seconds")}
                    </div>
                  </div>
                </div>
              </>
            )}

            <Button
              onClick={handleCtaClick}
              className="bg-white text-main hover:bg-gray-100 font-bold px-8 py-4 rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-200 transform hover:scale-105 group text-lg"
            >
              <Zap className="w-5 h-5 mr-2 text-yellow-500" />
              {content.ctaText}
            </Button>

            <div className="text-center text-white/90 text-sm">
              <div className="font-semibold">{content.urgencyText}</div>
              {content.showTimer && (
                <div className="text-xs">{t("smartBanner.common.noCode")}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FlashSaleBannerSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto mb-12 overflow-hidden gradient-bg rounded-lg shadow-2xl relative animate-in fade-in duration-300">
      <div className="absolute top-4 left-4">
        <Skeleton className="h-6 w-20 rounded-full bg-white/20" />
      </div>

      <div className="px-8 py-6 pt-12">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex-1 text-center lg:text-left">
            <div className="mb-2">
              <div className="flex items-center justify-center lg:justify-start gap-2">
                <Skeleton className="h-8 w-8 rounded bg-white/20" />
                <Skeleton className="h-8 w-64 bg-white/20" />
                <Skeleton className="h-8 w-8 rounded bg-white/20" />
              </div>
            </div>

            <Skeleton className="h-6 w-full max-w-2xl mx-auto lg:mx-0 mb-4 bg-white/20" />
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded bg-white/20" />
              <Skeleton className="h-5 w-24 bg-white/20" />
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 text-center border border-white/30">
                <Skeleton className="h-8 w-8 bg-white/30 mb-1" />
                <Skeleton className="h-3 w-8 bg-white/30" />
              </div>
              <div className="text-white/50 text-xl">:</div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 text-center border border-white/30">
                <Skeleton className="h-8 w-8 bg-white/30 mb-1" />
                <Skeleton className="h-3 w-8 bg-white/30" />
              </div>
              <div className="text-white/50 text-xl">:</div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 text-center border border-white/30">
                <Skeleton className="h-8 w-8 bg-white/30 mb-1" />
                <Skeleton className="h-3 w-8 bg-white/30" />
              </div>
            </div>

            <div className="bg-white/30 text-transparent font-bold px-8 py-2 rounded-xl text-lg flex items-center gap-2">
              <Skeleton className="h-5 w-5 bg-white/40" />
              <Skeleton className="h-5 w-32 bg-white/40" />
            </div>

            <div className="text-center">
              <Skeleton className="h-4 w-40 mb-1 bg-white/20" />
              <Skeleton className="h-3 w-32 bg-white/20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

type CreditsBadgeProps = {
  className?: string;
};

type CreditsPayload = {
  credits: number;
  label: string;
};

export function CreditsBadge({ className }: CreditsBadgeProps) {
  const [data, setData] = useState<CreditsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch("/api/usage/credits", {
          method: "GET",
          cache: "no-store",
        });
        const json = (await response.json()) as {
          success: boolean;
          data?: CreditsPayload;
        };
        if (!cancelled && json?.success && json.data) {
          setData(json.data);
        } else if (!cancelled) {
          setData({ credits: 0, label: "Free" });
        }
      } catch {
        if (!cancelled) {
          setData({ credits: 0, label: "Free" });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const creditsDisplay =
    data?.credits !== undefined ? data.credits.toLocaleString() : "0";
  const labelDisplay = data?.label ?? "Free";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm text-white/80",
        className
      )}
      aria-live="polite"
    >
      <Sparkles className="h-4 w-4 text-[#dc2e5a]" />
      <span className="font-semibold text-white">
        {loading ? "—" : creditsDisplay}
      </span>
      <span className="text-white/40">|</span>
      <span className="text-white/80">{loading ? "..." : labelDisplay}</span>
    </div>
  );
}

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type MyCreationsFilterTabsProps = {
  labels: string[];
  onChange?: (label: string) => void;
};

export function MyCreationsFilterTabs({ labels, onChange }: MyCreationsFilterTabsProps) {
  const [active, setActive] = useState(labels[0]);

  return (
    <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
      {labels.map((label) => {
        const isActive = label === active;
        return (
          <button
            key={label}
            type="button"
            onClick={() => {
              setActive(label);
              onChange?.(label);
            }}
            className={cn(
              "relative px-3 py-1 transition-colors",
              isActive ? "text-white" : "text-white/60 hover:text-white/80"
            )}
          >
            {label}
            <span
              className={cn(
                "pointer-events-none absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-white/80 transition-opacity",
                isActive ? "opacity-100" : "opacity-0"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

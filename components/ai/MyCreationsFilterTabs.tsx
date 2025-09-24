"use client";

import { cn } from "@/lib/utils";

export type MyCreationsFilterOption = {
  label: string;
  value: string;
};

type MyCreationsFilterTabsProps = {
  options: MyCreationsFilterOption[];
  value: string;
  onChange?: (value: string) => void;
};

export function MyCreationsFilterTabs({ options, value, onChange }: MyCreationsFilterTabsProps) {
  
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              onChange?.(option.value);
            }}
            className={cn(
              "relative px-3 py-1 transition-colors",
              isActive ? "text-white" : "text-white/60 hover:text-white/80"
            )}
          >
            {option.label}
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

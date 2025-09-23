"use client";

import { cn } from "@/lib/utils";

type AspectRatioInlineSelectorProps = {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
};

const WIDTH_MAP: Record<string, string> = {
  "16:9": "w-9",
  "9:16": "w-5",
  "1:1": "w-7",
  "4:3": "w-8",
  "3:4": "w-6",
  "3:2": "w-9",
  "2:3": "w-5",
  "1:2": "w-4",
  "2:1": "w-10",
  "4:5": "w-7",
  "5:4": "w-8",
  auto: "w-8",
};

const HEIGHT_MAP: Record<string, string> = {
  default: "h-6",
};

function getWidthClass(ratio: string) {
  return WIDTH_MAP[ratio] ?? "w-7";
}

function getHeightClass(ratio: string) {
  return HEIGHT_MAP[ratio] ?? HEIGHT_MAP.default;
}

export function AspectRatioInlineSelector({
  value,
  options,
  onChange,
  label,
  description,
  disabled = false,
  className,
}: AspectRatioInlineSelectorProps) {
  if (!options || options.length === 0) {
    return null;
  }

  const containerClass = options.length <= 5 ? "flex gap-2" : "flex flex-wrap gap-2";
  const isCompactRow = options.length <= 5;

  return (
    <div className={className}>
      {(label || description) && (
        <div className="mb-2">
          {label ? (
            <div className="text-sm font-medium text-white">{label}</div>
          ) : null}
          {description ? (
            <p className="text-xs text-white/60">{description}</p>
          ) : null}
        </div>
      )}
      <div
        role="radiogroup"
        aria-label={label || "Aspect Ratio"}
        className={containerClass}
      >
        {options.map((ratio) => {
          const isActive = ratio === value;
          return (
            <div
              key={ratio}
              className={cn(
                isCompactRow ? "flex-1 basis-0" : "flex-none"
              )}
            >
              <button
                type="button"
                role="radio"
                aria-checked={isActive}
                disabled={disabled}
                onClick={() => onChange(ratio)}
                className={cn(
                  "flex h-16 w-full flex-col items-center justify-center gap-1 rounded-lg border border-white/10 px-2 py-1.5 transition-all bg-white/8 text-white/70 hover:bg-white/12",
                  isActive && "text-white",
                  disabled && "opacity-60 cursor-not-allowed hover:bg-white/8"
                )}
              >
                <span
                  className={cn(
                    "block rounded-md transition-colors",
                    getWidthClass(ratio),
                    getHeightClass(ratio),
                    isActive ? "bg-[#dc2e5a]" : "bg-white/20"
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] font-semibold tracking-wide transition-colors",
                    isActive ? "text-white" : "text-white/70"
                  )}
                >
                  {ratio}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

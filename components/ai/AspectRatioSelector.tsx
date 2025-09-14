"use client";

import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface AspectRatioSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}

const ASPECT_RATIOS = [
  { value: "match_input_image", label: "Auto", shortLabel: "Auto" },
  { value: "1:1", label: "Square (1:1)", shortLabel: "1:1" },
  { value: "16:9", label: "Landscape (16:9)", shortLabel: "16:9" },
  { value: "9:16", label: "Portrait (9:16)", shortLabel: "9:16" },
  { value: "3:2", label: "Classic (3:2)", shortLabel: "3:2" },
  { value: "2:3", label: "Portrait (2:3)", shortLabel: "2:3" },
  { value: "3:4", label: "Portrait (3:4)", shortLabel: "3:4" },
  { value: "4:3", label: "Standard (4:3)", shortLabel: "4:3" },
];

const getAspectWidth = (aspectRatio: string) => {
  if (aspectRatio === "match_input_image" || aspectRatio === "1:1")
    return "24px";
  if (aspectRatio === "16:9") return "32px";
  if (aspectRatio === "9:16") return "16px";
  if (aspectRatio === "3:2") return "32px";
  if (aspectRatio === "2:3") return "20px";
  if (aspectRatio === "3:4") return "18px";
  if (aspectRatio === "4:3") return "32px";
  return "24px";
};

const getAspectHeight = (aspectRatio: string) => {
  if (aspectRatio === "match_input_image" || aspectRatio === "1:1")
    return "24px";
  if (aspectRatio === "16:9") return "18px";
  if (aspectRatio === "9:16") return "28px";
  if (aspectRatio === "3:2") return "21px";
  if (aspectRatio === "2:3") return "30px";
  if (aspectRatio === "3:4") return "24px";
  if (aspectRatio === "4:3") return "24px";
  return "24px";
};

export function AspectRatioSelector({
  value,
  onChange,
  disabled = false,
  className,
  label,
}: AspectRatioSelectorProps) {
  const t = useTranslations("GenImageShared.aspectRatioSelector");

  return (
    <div className={className}>
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
        {label || t("label")}
      </label>
      <div className="grid gap-2 grid-cols-4 sm:grid-cols-8">
        {ASPECT_RATIOS.map((ratio) => (
          <button
            key={ratio.value}
            onClick={() => onChange(ratio.value)}
            disabled={disabled}
            className={cn(
              "h-20 bg-gray-100 dark:bg-gray-800 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg text-sm duration-300 px-0 transition-all hover:bg-gray-200 dark:hover:bg-gray-700",
              value === ratio.value
                ? "border-main border bg-gray-100 dark:bg-gray-800"
                : "border border-gray-200 dark:border-gray-700",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            <div className="flex items-center justify-center">
              <span
                className={cn(
                  "rounded-sm transition-colors",
                  value === ratio.value
                    ? "bg-main"
                    : "bg-gray-300 dark:bg-gray-600"
                )}
                style={{
                  width: getAspectWidth(ratio.value),
                  height: getAspectHeight(ratio.value),
                }}
              />
            </div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {ratio.shortLabel}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

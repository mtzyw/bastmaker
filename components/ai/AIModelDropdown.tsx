"use client";

import { Clock, GraduationCap, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VideoModelSelectOption } from "./video-models";

type AIModelDropdownProps = {
  options: VideoModelSelectOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  showSearchIcon?: boolean;
};

const DEFAULT_ICON_CLASS = "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white";

export function AIModelDropdown({
  options,
  value,
  onChange,
  className,
  showSearchIcon = false,
}: AIModelDropdownProps) {
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  return (
    <div className={cn("w-full text-white", className)}>
      <div className="rounded-xl border border-white/10 bg-white/10 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold",
                selectedOption?.icon?.className ?? DEFAULT_ICON_CLASS,
              )}
            >
              {selectedOption?.icon?.label ?? (selectedOption?.label?.[0] ?? "M")}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold leading-none">
                  {selectedOption?.label ?? "选择模型"}
                </h2>
                {selectedOption?.recommended ? (
                  <span className="rounded-full bg-[#dc2e5a] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                    推荐
                  </span>
                ) : null}
              </div>
              {selectedOption?.description ? (
                <p className="text-xs text-white/70">{selectedOption.description}</p>
              ) : null}
            </div>
          </div>
          {showSearchIcon ? <Search className="h-4 w-4 text-white/60" /> : null}
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
        <div className="divide-y divide-white/5 bg-white/5">
          {options.map((option) => {
            const isActive = option.value === (selectedOption?.value ?? value);

            return (
              <button
                type="button"
                key={option.value}
                onClick={() => onChange(option.value)}
                className={cn(
                  "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
                  isActive
                    ? "bg-[#dc2e5a]/30 border-l-2 border-l-[#dc2e5a]"
                    : "hover:bg-white/10",
                )}
              >
                <span
                  className={cn(
                    "mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-semibold",
                    isActive ? "border-[#dc2e5a] bg-[#dc2e5a] text-white" : "border-white/30 text-white/70",
                  )}
                >
                  {option.icon?.label ?? option.label[0]}
                </span>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium leading-none text-white">{option.label}</p>
                    {option.recommended ? (
                      <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-medium text-white/80">
                        推荐
                      </span>
                    ) : null}
                  </div>
                  {option.description ? (
                    <p className="mt-1 text-xs text-white/60">{option.description}</p>
                  ) : null}

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {option.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-medium tracking-wide text-white/70"
                      >
                        {tag}
                      </span>
                    ))}
                    {option.fps ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white/70">
                        <Clock className="h-3 w-3" />
                        {option.fps}
                      </span>
                    ) : null}
                    {typeof option.credits === "number" ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white/70">
                        <GraduationCap className="h-3 w-3" />
                        {option.credits} Credits
                      </span>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

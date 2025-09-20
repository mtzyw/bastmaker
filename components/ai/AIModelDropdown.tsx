"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ChevronDown, GraduationCap, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VideoModelSelectOption } from "./video-models";

type AIModelDropdownProps = {
  options: VideoModelSelectOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  showSearchIcon?: boolean;
  defaultOpen?: boolean;
};

const DEFAULT_ICON_CLASS = "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white";

export function AIModelDropdown({
  options,
  value,
  onChange,
  className,
  showSearchIcon = false,
  defaultOpen = false,
}: AIModelDropdownProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? options[0],
    [options, value]
  );
  const selectedIcon = selectedOption?.icon;
  const selectedHasImage = Boolean(selectedIcon?.src);
  const selectedIconWrapperClass = selectedHasImage
    ? cn(
        "h-9 w-9 rounded-full overflow-hidden bg-white/10 ring-1 ring-white/10",
        selectedIcon?.className,
      )
    : cn(
        "h-10 w-10 rounded-full text-sm font-semibold",
        selectedIcon?.className ?? DEFAULT_ICON_CLASS,
      );

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current) {
        return;
      }
      if (event.target instanceof Node && !rootRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className={cn("relative w-full text-white", className)}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#1e1e24] p-4 transition-colors hover:bg-[#25262e]"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3 text-left">
          <div className={cn("flex items-center justify-center", selectedIconWrapperClass)}>
            {selectedHasImage ? (
              <Image
                src={selectedOption.icon.src}
                alt={`${selectedOption.label} icon`}
                width={28}
                height={28}
                className="h-full w-full object-cover"
              />
            ) : (
              selectedOption?.icon?.label ?? (selectedOption?.label?.[0] ?? "M")
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold leading-none">
                {selectedOption?.label ?? "选择模型"}
              </span>
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
        <div className="flex items-center gap-2 text-white/60">
          {showSearchIcon ? <Search className="h-4 w-4" /> : null}
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", isOpen ? "rotate-180" : "rotate-0")}
          />
        </div>
      </button>

      {isOpen ? (
        <div className="absolute left-0 top-full z-20 mt-2 w-full">
          <div
            className="max-h-80 overflow-y-auto rounded-xl border border-white/10 bg-[#1e1e24] shadow-lg"
            role="listbox"
          >
            {options.map((option) => {
              const isActive = option.value === (selectedOption?.value ?? value);
              const optionIcon = option.icon;
              const optionHasImage = Boolean(optionIcon?.src);
              const optionIconWrapperClass = optionHasImage
                ? cn(
                    "mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/12 ring-1 ring-white/10 overflow-hidden",
                    isActive ? "ring-2 ring-[#dc2e5a]/60 bg-[#dc2e5a]/20" : undefined,
                    optionIcon?.className,
                  )
                : cn(
                    "mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-semibold",
                    isActive
                      ? "border-[#dc2e5a] bg-[#dc2e5a] text-white"
                      : "border-white/30 text-white/70",
                    optionIcon?.className ?? "",
                  );

              return (
                <button
                  type="button"
                  key={option.value}
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
                    isActive
                      ? "bg-[#dc2e5a]/30 border-l-2 border-l-[#dc2e5a]"
                      : "hover:bg-white/10",
                  )}
                  onClick={() => handleSelect(option.value)}
                  role="option"
                  aria-selected={isActive}
                >
                  <span className={optionIconWrapperClass}>
                    {optionHasImage ? (
                      <Image
                        src={option.icon.src}
                        alt={`${option.label} icon`}
                        width={16}
                        height={16}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      option.icon?.label ?? option.label[0]
                    )}
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
      ) : null}
    </div>
  );
}

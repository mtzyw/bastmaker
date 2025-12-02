"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";

interface NativeCarouselProps extends React.HTMLAttributes<HTMLUListElement> {
  children: React.ReactNode;
}

export function NativeCarousel({
  className,
  children,
  ...props
}: NativeCarouselProps) {
  const scrollRef = React.useRef<HTMLUListElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);

  const checkScroll = React.useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10); // -10 for tolerance
    }
  }, []);

  React.useEffect(() => {
    const element = scrollRef.current;
    if (element) {
      element.addEventListener("scroll", checkScroll);
      // Initial check
      checkScroll();
      // Check on resize
      window.addEventListener("resize", checkScroll);
      return () => {
        element.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [checkScroll]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const { scrollLeft, scrollWidth, clientWidth } = container;
      const firstItem = container.children[0] as HTMLElement;

      if (!firstItem) return;

      const itemWidth = firstItem.clientWidth;
      const gap = 16; // gap-4 is 1rem = 16px
      const scrollAmount = itemWidth + gap;

      if (direction === "left") {
        if (scrollLeft <= 10) { // Tolerance for start
          // Loop to end
          container.scrollTo({ left: scrollWidth, behavior: "smooth" });
        } else {
          container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
        }
      } else {
        if (scrollLeft + clientWidth >= scrollWidth - 10) { // Tolerance for end
          // Loop to start
          container.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          container.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
      }
    }
  };

  return (
    <div className="group relative w-full">
      <ul
        ref={scrollRef}
        className={cn(
          "flex w-full overflow-x-auto snap-x snap-mandatory gap-4 pb-4",
          // Hide scrollbar styles
          "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']",
          className
        )}
        role="list"
        {...props}
      >
        {children}
      </ul>

      {/* Navigation Buttons */}
      <div className="mt-4 flex justify-center gap-4">
        <button
          onClick={() => scroll("left")}
          className="rounded-full border border-white/10 bg-black/30 p-3 text-white transition-all hover:bg-white/10 active:scale-95"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          onClick={() => scroll("right")}
          className="rounded-full border border-white/10 bg-black/30 p-3 text-white transition-all hover:bg-white/10 active:scale-95"
          aria-label="Next slide"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

interface NativeCarouselItemProps extends React.HTMLAttributes<HTMLLIElement> {
  children: React.ReactNode;
}

export function NativeCarouselItem({
  className,
  children,
  ...props
}: NativeCarouselItemProps) {
  return (
    <li
      className={cn(
        "snap-center shrink-0 w-[85%] md:w-[45%] lg:w-[30%]",
        className
      )}
      role="listitem"
      {...props}
    >
      {children}
    </li>
  );
}

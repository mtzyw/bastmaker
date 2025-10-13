import Footer from "@/components/footer/Footer";
import { cn } from "@/lib/utils";
import { AISidebar } from "../../ai-sidebar/components/ai-sidebar";
import React from "react";

type WidthPreset = "10" | "12" | "13" | "15" | "20";
type SplitPreset = "20/80" | "25/75" | "30/70";

function leftWidthClass(_preset: WidthPreset) {
  // Align grid left column to AISidebar width (256px)
  return "lg:grid-cols-[256px_minmax(0,1fr)]";
}

function section2SplitClass(_preset: SplitPreset) {
  // Use a fixed-width left column and flexible right column on md+ screens
  // This keeps Section 2 Left static while Section 2 Right scales.
  return "md:[grid-template-columns:380px_minmax(0,1fr)]";
}

function leftWidthValue(_preset: WidthPreset) {
  // Match AISidebar (w-64 = 256px)
  return "256px";
}

export type SectionConfig = {
  id: string;
  bg: string;
  fg: string;
  title: string;
};

export default function PureFourSections({
  leftWidth = "13",
  section2Split = "25/75",
  sections,
  withSidebar = true,
  section2Left,
  section2Right,
  lockSection2Height = true,
  mergedSectionContent,
  hideMergedSection = false,
}: {
  leftWidth?: WidthPreset;
  section2Split?: SplitPreset;
  sections: [SectionConfig, SectionConfig, SectionConfig, SectionConfig];
  withSidebar?: boolean;
  section2Left?: React.ReactNode;
  section2Right?: React.ReactNode;
  lockSection2Height?: boolean;
  mergedSectionContent?: React.ReactNode;
  hideMergedSection?: boolean;
}) {
  const [s1, s2, s3, s4] = sections;
  const section2HeightClass = lockSection2Height
    ? "h-[calc(100vh-4rem)]"
    : "min-h-[calc(100vh-4rem)]";
  const section2GridHeightClass = lockSection2Height ? "h-full min-h-0" : undefined;
  const section2ColumnHeightClass = lockSection2Height ? "h-full min-h-0" : undefined;
  const section2ColumnInnerHeightClass = lockSection2Height ? "h-full min-h-0" : undefined;
  return (
    <div className="relative w-full">
      {/* Desktop fixed left column (never moves) - only when embedded */}
      {withSidebar && (
        <div
          className="hidden lg:block fixed left-0 top-16 h-[calc(100vh-4rem)] z-40 header-bg"
          style={{ width: leftWidthValue(leftWidth) }}
        >
          <AISidebar className="bg-transparent" />
        </div>
      )}

      {/* Mobile Section 1 in normal flow - only when embedded */}
      {withSidebar && (
        <section
          className="w-full min-h-screen flex items-center justify-center lg:hidden header-bg"
        >
          <div className="max-w-sm w-full px-4">
            <AISidebar className="bg-transparent" />
          </div>
        </section>
      )}

      {/* Grid with left placeholder and right content */}
      <div className={`grid grid-cols-1 ${withSidebar ? leftWidthClass(leftWidth) : ""} w-full relative z-0`}>
        {withSidebar && (
          <div className="hidden lg:block pointer-events-none" aria-hidden="true" />
        )}
        <div className="w-full">
        {/* Section 2 split left/right (fixed viewport height below header) */}
        <section className={cn("w-full", section2HeightClass)}>
          <div className={cn("grid grid-cols-1", section2SplitClass(section2Split), section2GridHeightClass)}>
            <div
              className={cn(section2ColumnHeightClass, "flex items-start header-bg text-white")}
            >
              <div className={cn(
                "container mx-auto px-4 md:px-6 pt-4 w-full flex flex-col md:border-r md:border-white/10",
                section2ColumnInnerHeightClass
              )}
              >
                {section2Left ? (
                  section2Left
                ) : (
                  <>
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">{s2.title} Left</h2>
                    <p className="text-sm opacity-80">Pure color block.</p>
                  </>
                )}
              </div>
            </div>
            <div
              className={cn(section2ColumnHeightClass, "flex items-center header-bg text-white")}
            >
              <div className={cn(
                "container mx-auto px-4 md:px-8 w-full flex flex-col",
                section2ColumnInnerHeightClass
              )}
              >
                <div className="flex-1 min-h-0">
                  {section2Right ? (
                    section2Right
                  ) : (
                    <>
                      <h2 className="text-3xl md:text-4xl font-bold mb-4">{s2.title} Right</h2>
                      <p className="text-sm opacity-80">Pure color block.</p>
                    </>
                  )}
                </div>
                <div className="mt-6 border-t border-white/10 -mx-4 md:-mx-8" />
              </div>
            </div>
          </div>
        </section>

        {/* Merged Section 3 + 4 with Footer at the bottom */}
        {!hideMergedSection && (
          <section
            className="w-full min-h-screen lg:min-h-[calc(100vh-4rem)] flex items-center header-bg text-white"
          >
            <div className="w-full">
              {mergedSectionContent ? (
                mergedSectionContent
              ) : (
                <div className="container mx-auto px-4 md:px-8 py-16">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">{s3.title}</h2>
                  <p className="text-sm opacity-80 mb-8">Pure color block (merged with Section 4).</p>
                  <h3 className="text-xl font-semibold mb-4">{s4.title}</h3>
                  <p className="text-sm opacity-80 mb-10">Footer is embedded below in the merged section.</p>
                </div>
              )}
              <Footer />
            </div>
          </section>
        )}
        </div>
      </div>
    </div>
  );
}

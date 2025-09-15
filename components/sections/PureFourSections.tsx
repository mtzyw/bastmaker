import Footer from "@/components/footer/Footer";
import { AISidebar } from "../../ai-sidebar/components/ai-sidebar";
import React from "react";

type WidthPreset = "10" | "12" | "13" | "15" | "20";
type SplitPreset = "20/80" | "25/75" | "30/70";

function leftWidthClass(_preset: WidthPreset) {
  // Align grid left column to AISidebar width (256px)
  return "lg:grid-cols-[256px_minmax(0,1fr)]";
}

function section2SplitClass(preset: SplitPreset) {
  switch (preset) {
    case "20/80":
      return "md:[grid-template-columns:20%_80%]";
    case "25/75":
      return "md:[grid-template-columns:25%_75%]";
    case "30/70":
      return "md:[grid-template-columns:30%_70%]";
  }
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
}: {
  leftWidth?: WidthPreset;
  section2Split?: SplitPreset;
  sections: [SectionConfig, SectionConfig, SectionConfig, SectionConfig];
  withSidebar?: boolean;
}) {
  const [s1, s2, s3, s4] = sections;
  return (
    <div className="relative w-full">
      {/* Desktop fixed left column (never moves) - only when embedded */}
      {withSidebar && (
        <div
          className="hidden lg:block fixed left-0 top-16 h-[calc(100vh-4rem)] z-40"
          style={{ width: leftWidthValue(leftWidth), backgroundColor: s1.bg }}
        >
          <AISidebar className="bg-transparent" />
        </div>
      )}

      {/* Mobile Section 1 in normal flow - only when embedded */}
      {withSidebar && (
        <section
          className="w-full min-h-screen flex items-center justify-center lg:hidden"
          style={{ backgroundColor: s1.bg, color: s1.fg }}
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
        {/* Section 2 split left/right */}
        <section className="w-full min-h-screen lg:min-h-[calc(100vh-4rem)]">
          <div className={`grid grid-cols-1 ${section2SplitClass(section2Split)} h-full`}>
            <div
              style={{ backgroundColor: s2.bg, color: s2.fg }}
              className="min-h-screen lg:min-h-[calc(100vh-4rem)] flex items-center"
            >
              <div className="container mx-auto px-4 md:px-8">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">{s2.title} Left</h2>
                <p className="text-sm opacity-80">Pure color block.</p>
              </div>
            </div>
            <div
              style={{ backgroundColor: "#0D1526", color: s2.fg }}
              className="min-h-screen lg:min-h-[calc(100vh-4rem)] flex items-center"
            >
              <div className="container mx-auto px-4 md:px-8">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">{s2.title} Right</h2>
                <p className="text-sm opacity-80">Pure color block.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Merged Section 3 + 4 with Footer at the bottom */}
        <section
          style={{ backgroundColor: s4.bg, color: s4.fg }}
          className="w-full min-h-screen lg:min-h-[calc(100vh-4rem)] flex items-center"
        >
          <div className="w-full">
            <div className="container mx-auto px-4 md:px-8 py-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{s3.title}</h2>
              <p className="text-sm opacity-80 mb-8">Pure color block (merged with Section 4).</p>
              <h3 className="text-xl font-semibold mb-4">{s4.title}</h3>
              <p className="text-sm opacity-80 mb-10">Footer is embedded below in the merged section.</p>
            </div>
            {/* Footer (server component) placed inside merged section */}
            {/* eslint-disable-next-line react/jsx-pascal-case */}
            <Footer />
          </div>
        </section>
        </div>
      </div>
    </div>
  );
}

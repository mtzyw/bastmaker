import Footer from "@/components/footer/Footer";
import React from "react";

type WidthPreset = "10" | "12" | "13" | "15" | "20";
type SplitPreset = "20/80" | "25/75" | "30/70";

function leftWidthClass(preset: WidthPreset) {
  // Percent-based grid columns (original behavior)
  switch (preset) {
    case "10":
      return "lg:grid-cols-[10%_minmax(0,1fr)]";
    case "12":
      return "lg:grid-cols-[12%_minmax(0,1fr)]";
    case "13":
      return "lg:grid-cols-[13%_minmax(0,1fr)]";
    case "15":
      return "lg:grid-cols-[15%_minmax(0,1fr)]";
    case "20":
      return "lg:grid-cols-[20%_minmax(0,1fr)]";
  }
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
}: {
  leftWidth?: WidthPreset;
  section2Split?: SplitPreset;
  sections: [SectionConfig, SectionConfig, SectionConfig, SectionConfig];
}) {
  const [s1, s2, s3, s4] = sections;
  return (
    <div className={`w-full grid grid-cols-1 ${leftWidthClass(leftWidth)}`}>
      {/* Left column: Section 1 */}
      <section
        style={{ backgroundColor: s1.bg, color: s1.fg }}
        className="w-full min-h-screen lg:h-screen lg:sticky lg:top-0 flex items-center"
      >
        <div className="container mx-auto px-4 md:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{s1.title}</h2>
          <p className="text-sm opacity-80">Left fixed column (Section 1)</p>
        </div>
      </section>

      {/* Right column: Sections 2–4 */}
      <div className="w-full">
        {/* Section 2 split left/right */}
        <section className="w-full min-h-screen">
          <div className={`grid grid-cols-1 ${section2SplitClass(section2Split)} h-full`}>
            <div
              style={{ backgroundColor: s2.bg, color: s2.fg }}
              className="min-h-screen flex items-center"
            >
              <div className="container mx-auto px-4 md:px-8">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">{s2.title} Left</h2>
                <p className="text-sm opacity-80">Pure color block.</p>
              </div>
            </div>
            <div
              style={{ backgroundColor: "#0D1526", color: s2.fg }}
              className="min-h-screen flex items-center"
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
          className="w-full min-h-screen flex items-center"
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
  );
}

import CTA from "@/components/home/CTA";
import FAQ from "@/components/home/FAQ";
import Hero from "@/components/home/Hero";

export default async function HomeComponent() {
  return (
    <div className="w-full">
      <Hero />

      <FAQ />

      <CTA />
    </div>
  );
}

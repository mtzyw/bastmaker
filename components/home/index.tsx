import CTA from "@/components/home/CTA";
import FAQ from "@/components/home/FAQ";
import AIFeatures from "@/components/home/Features";
import Hero from "@/components/home/Hero";
import Testimonials from "@/components/home/Testimonials";
import UseCases from "@/components/home/UseCases";

export default async function HomeComponent() {
  return (
    <div className="w-full">
      <Hero />

      <AIFeatures />

      <UseCases />

      <Testimonials />

      <FAQ />

      <CTA />
    </div>
  );
}

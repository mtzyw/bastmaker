import { CTASection } from "@/components/landing/cta-section"
import { FAQSection } from "@/components/landing/faq-section"
import { Features } from "@/components/landing/features"
import { HeroSection } from "@/components/landing/hero-section"
import { MoreTools } from "@/components/landing/more-tools"
import { PrivacySecurity } from "@/components/landing/privacy-security"
import { Testimonials } from "@/components/landing/testimonials"
import { VideoGallery } from "@/components/landing/video-gallery"
import { WhyChoose } from "@/components/landing/why-choose"

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <HeroSection />
      <VideoGallery />
      <WhyChoose />
      <Features />
      <PrivacySecurity />
      <MoreTools />
      <Testimonials />
      <CTASection />
      <FAQSection />
    </main>
  )
}

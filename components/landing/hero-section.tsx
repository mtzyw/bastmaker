import { Button } from "@/components/ui/button"
import { ImageIcon, Sparkles } from "lucide-react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import Link from "next/link"

export function HeroSection() {
  const t = useTranslations("Landing.Hero")

  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/astronaut-floating-in-space-with-earth-in-backgrou.jpg"
          alt="Astronaut floating in space with Earth"
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background" />
      <div className="relative container mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-sm text-amber-300">{t("badge")}</span>
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 max-w-4xl mx-auto leading-tight text-balance text-foreground">
          {t.rich("title", {
            br: () => <br />,
          })}
        </h1>
        <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
          {t("description")}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/text-to-video">
            <Button
              size="lg"
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium px-8"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              {t("textToVideoBtn")}
            </Button>
          </Link>
          <Link href="/image-to-video">
            <Button size="lg" variant="outline" className="border-border bg-card/50 hover:bg-card text-white hover:text-white px-8">
              <ImageIcon className="w-5 h-5 mr-2" />
              {t("imageToVideoBtn")}
            </Button>
          </Link>
        </div>
        <p className="text-sm md:text-base text-muted-foreground mt-6 max-w-2xl mx-auto">
          {t("supporting")}
        </p>
      </div>
    </section>
  )
}

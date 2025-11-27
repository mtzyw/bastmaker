import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"

export function CTASection() {
  const t = useTranslations("Landing.CTA")

  return (
    <section
      className="py-20 bg-[#21212a]"
    >
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">{t("title")}</h2>
        <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">{t("description")}</p>
        <Link href="/text-to-video">
          <Button
            size="lg"
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium px-8"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            {t("button")}
          </Button>
        </Link>
      </div>
    </section>
  )
}

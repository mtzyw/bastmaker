import { Check, Sparkles } from "lucide-react"
import { useTranslations } from "next-intl"
import Image from "next/image"

export function Features() {
  const t = useTranslations("Landing.Features")

  return (
    <section className="py-20 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-400 px-4 py-1.5 rounded-full text-sm font-medium border border-amber-500/20">
            <Sparkles className="w-4 h-4" />
            {t("badge")}
          </span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-foreground">
          {t("title")}
        </h2>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h3 className="text-2xl font-bold mb-4 text-foreground">{t("feature1.title")}</h3>
            <p className="text-muted-foreground mb-6">
              {t("feature1.description")}
            </p>
            <ul className="space-y-3 text-foreground/80">
              {[0, 1, 2].map((i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                  <span>{t(`feature1.list.${i}`)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 blur-3xl rounded-full opacity-50" />
            <div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl bg-[#21212a]">
              <Image
                src="https://static.bestmaker.ai/image-to-videos/1764215701846-td5k5y.png"
                alt="AI Video Generation Interface"
                width={800}
                height={600}
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

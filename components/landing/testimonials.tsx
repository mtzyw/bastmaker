import { Star } from "lucide-react"
import { useTranslations } from "next-intl"

const testimonials = [
  { rating: 5, key: "0" },
  { rating: 5, key: "1" },
  { rating: 5, key: "2" },
]

export function Testimonials() {
  const t = useTranslations("Landing.Testimonials")

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
          {t("title")}
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((item) => (
            <div
              key={item.key}
              /* Subtle amber/warm gradient card */
              className="bg-[#21212a] border border-amber-500/10 rounded-2xl p-6"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(item.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-foreground/80 mb-6">&quot;{t(`items.${item.key}.content`)}&quot;</p>
              <div className="flex items-center gap-3">
                <div>
                  <div className="font-semibold text-foreground">{t(`items.${item.key}.name`)}</div>
                  <div className="text-muted-foreground text-sm">{t(`items.${item.key}.role`)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

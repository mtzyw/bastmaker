import { Check, Sparkles } from "lucide-react"
import { useTranslations } from "next-intl"
import Image from "next/image"

type FeatureItem = {
  title: string
  description: string
}

export function Features() {
  const t = useTranslations("Landing.Features")
  const items = (t.raw("items") as FeatureItem[]) || []

  return (
    <section className="py-20 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-400 px-4 py-1.5 rounded-full text-sm font-medium border border-amber-500/20">
            <Sparkles className="w-4 h-4" />
            {t("badge")}
          </span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-foreground">
          {t("title")}
        </h2>
        <p className="text-muted-foreground text-center max-w-3xl mx-auto mb-16">
          {t("description")}
        </p>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-4 rounded-2xl border border-border/60 bg-card/30 p-5 hover:border-amber-500/50 transition-colors"
              >
                <div className="mt-1 rounded-full bg-amber-500/10 p-2 text-amber-400">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 blur-3xl rounded-full opacity-50" />
            <div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl bg-[#21212a]">
              <Image
                src="https://static.bestmaker.ai/image-to-videos/1764215701846-td5k5y.png"
                alt="AI Video and Image Creation Interface"
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

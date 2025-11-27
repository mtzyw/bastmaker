import { DollarSign, FileVideo, Globe, Sparkles, Users, Zap } from "lucide-react"
import { useTranslations } from "next-intl"

const features = [
  { icon: Zap, key: "0" },
  { icon: DollarSign, key: "1" },
  { icon: Globe, key: "2" },
  { icon: Sparkles, key: "3" },
  { icon: FileVideo, key: "4" },
  { icon: Users, key: "5" },
]

export function WhyChoose() {
  const t = useTranslations("Landing.WhyChoose")

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">{t("title")}</h2>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            {t("description")}
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.key}
              className="bg-secondary/50 border border-border rounded-2xl p-6 hover:bg-secondary hover:border-amber-500/30 transition-colors"
            >
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">{t(`items.${feature.key}.title`)}</h3>
              <p className="text-muted-foreground text-sm">{t(`items.${feature.key}.desc`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

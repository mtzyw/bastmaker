import { ImagePlus, Layers, Music, Scissors, Video, Wand2 } from "lucide-react"
import { useTranslations } from "next-intl"

const tools = [
  { icon: Wand2, key: "0" },
  { icon: ImagePlus, key: "1" },
  { icon: Video, key: "2" },
  { icon: Layers, key: "3" },
  { icon: Scissors, key: "4" },
  { icon: Music, key: "5" },
]

export function MoreTools() {
  const t = useTranslations("Landing.MoreTools")

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">{t("title")}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("description")}
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {tools.map((tool) => (
            <div
              key={tool.key}
              className="bg-secondary/50 border border-border rounded-xl p-6 text-center hover:bg-secondary hover:border-amber-500/30 transition-colors cursor-pointer"
            >
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <tool.icon className="w-6 h-6 text-amber-400" />
              </div>
              <h4 className="font-semibold mb-1 text-foreground">{t(`items.${tool.key}.name`)}</h4>
              <p className="text-muted-foreground text-xs">{t(`items.${tool.key}.desc`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

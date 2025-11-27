import { Eye, Lock, Shield } from "lucide-react"
import { useTranslations } from "next-intl"

export function PrivacySecurity() {
  const t = useTranslations("Landing.PrivacySecurity")

  const items = [
    { icon: Lock, key: "0" },
    { icon: Eye, key: "1" },
    { icon: Shield, key: "2" },
  ]

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">{t("title")}</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t("description")}
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {items.map((item) => (
              <div key={item.key} className="bg-secondary/50 border border-border rounded-xl p-6">
                <item.icon className="w-8 h-8 text-emerald-400 mx-auto mb-4" />
                <h4 className="font-semibold mb-2 text-foreground">{t(`items.${item.key}.title`)}</h4>
                <p className="text-muted-foreground text-sm">{t(`items.${item.key}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

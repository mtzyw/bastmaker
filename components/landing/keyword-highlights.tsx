import { useTranslations } from "next-intl"

export function KeywordHighlights() {
  const t = useTranslations("Landing.KeywordHighlights")
  const items = (t.raw("items") as string[]) || []

  if (!items.length) {
    return null
  }

  return (
    <section className="py-8 bg-background border-y border-border/40">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {items.map((item) => (
            <span
              key={item}
              className="inline-flex items-center rounded-full border border-border/60 bg-card/30 px-4 py-2 text-sm text-muted-foreground"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

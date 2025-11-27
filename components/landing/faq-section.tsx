import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useTranslations } from "next-intl"

export function FAQSection() {
  const t = useTranslations("Landing.FAQ")

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">{t("title")}</h2>
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="bg-secondary/50 border border-border rounded-xl px-6 data-[state=open]:border-amber-500/30"
              >
                <AccordionTrigger className="text-left text-foreground hover:text-amber-400 hover:no-underline py-6">
                  {t(`items.${i}.question`)}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6 whitespace-pre-line">
                  {t(`items.${i}.answer`)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}

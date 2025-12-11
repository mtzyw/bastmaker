import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useTranslations } from "next-intl"

type FAQItem = {
  question: string
  answer: string
}

export function FAQSection() {
  const t = useTranslations("Landing.FAQ")
  const items = (t.raw("items") as FAQItem[]) || []

  if (!items.length) {
    return null
  }

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">{t("title")}</h2>
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {items.map((item, index) => (
              <AccordionItem
                key={item.question}
                value={`item-${index}`}
                className="bg-secondary/50 border border-border rounded-xl px-6 data-[state=open]:border-amber-500/30"
              >
                <AccordionTrigger className="text-left text-foreground hover:text-amber-400 hover:no-underline py-6">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6 whitespace-pre-line">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}

import { SectionBG5 } from "@/components/sectionBG";
import { FAQItem, FAQItemType } from "@/components/shared/FAQItem";
import { useTranslations } from "next-intl";

export default function FAQ() {
  const t = useTranslations("Landing.FAQ");

  const faqs: FAQItemType[] = t.raw("items");

  return (
    <section id="faq" className="py-10 relative">
      <SectionBG5 />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("title")}</h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            {t("description")}
          </p>
        </div>

        <div className="space-y-4 mb-16">
          {faqs.map((faq) => (
            <FAQItem key={faq.question} faq={faq} />
          ))}
        </div>
      </div>
    </section>
  );
}

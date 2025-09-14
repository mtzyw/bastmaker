import { FAQItem, FAQItemType } from "@/components/shared/FAQItem";
import { useTranslations } from "next-intl";

export default function FAQSection() {
  const t = useTranslations("FluxKontextPro.faq");
  const faqs: FAQItemType[] = t.raw("items");

  return (
    <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6 gradient-text">
            {t("title")}
          </h2>
        </div>

        <div className="space-y-6">
          {faqs.map((faq) => (
            <FAQItem key={faq.question} faq={faq} />
          ))}
        </div>
      </div>
    </section>
  );
}

export interface FAQItemType {
  question: string;
  answer: string;
}

export function FAQItem({ faq }: { faq: FAQItemType }) {
  return (
    <div className="card rounded-xl p-6 shadow-sm border dark:border-gray-800">
      <div className="flex items-center mb-3">
        <h3 className="text-lg font-semibold">{faq.question}</h3>
      </div>
      <div className="text-muted-foreground">
        <p>{faq.answer}</p>
      </div>
    </div>
  );
}

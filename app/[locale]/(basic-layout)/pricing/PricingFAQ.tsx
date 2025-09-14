import { FAQItem, FAQItemType } from "@/components/shared/FAQItem";
import ThemeBadge from "@/components/shared/ThemeBadge";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";

const welcomeCredits = process.env.NEXT_PUBLIC_WELCOME_CREDITS || "0";
const discordInviteUrl = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL;

export default function PricingFAQ() {
  const t = useTranslations("Pricing");

  const faqItems = t.raw("faq.items") as Array<{
    question: string;
    answer: string;
  }>;

  const faqs: FAQItemType[] = faqItems.map((item) => ({
    question: item.question,
    answer: item.answer
      .replace("{siteName}", siteConfig.name)
      .replace("{welcomeCredits}", welcomeCredits),
  }));

  return (
    <section className="py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <ThemeBadge
            icon="help-circle"
            text={t("faq.badge")}
            iconClassName="h-4 w-4 text-indigo-600 dark:text-indigo-400 mr-2"
          />

          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            <span className="gradient-text">{t("faq.title")}</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            {t("faq.description")}
          </p>
        </div>

        <div className="space-y-6 mb-16">
          {faqs.map((faq) => (
            <FAQItem key={faq.question} faq={faq} />
          ))}
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl p-8 border border-blue-200/50 dark:border-blue-800/50 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>

            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {t("faq.contact.title")}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
              {t("faq.contact.description")}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {discordInviteUrl ? (
                <Button
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 rounded-xl font-semibold"
                  asChild
                >
                  <a
                    href={discordInviteUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    {t("faq.contact.discord")}
                  </a>
                </Button>
              ) : (
                <>
                  {siteConfig.socialLinks?.email && (
                    <Button
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 rounded-xl font-semibold"
                      asChild
                    >
                      <a href={siteConfig.socialLinks.email}>
                        <MessageCircle className="w-5 h-5 mr-2" />
                        {t("faq.contact.email")}
                      </a>
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

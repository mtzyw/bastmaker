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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
        <div className="text-center mb-16">
          <ThemeBadge
            icon="help-circle"
            text={t("faq.badge")}
            iconClassName="h-4 w-4 text-cyan-300 mr-2"
          />

          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="text-white">{t("faq.title")}</span>
          </h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
            {t("faq.description")}
          </p>
        </div>

        <div className="space-y-6 mb-16">
          {faqs.map((faq) => (
            <FAQItem key={faq.question} faq={faq} />
          ))}
        </div>

        <div className="rounded-2xl p-8 border border-white/10 bg-white/5 backdrop-blur text-center">
          <div className="max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-[linear-gradient(to_right,rgb(18,194,233),rgb(196,113,237),rgb(246,79,89))] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>

            <h3 className="text-2xl font-bold text-white mb-4">
              {t("faq.contact.title")}
            </h3>
            <p className="text-white/70 mb-8 leading-relaxed">
              {t("faq.contact.description")}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {discordInviteUrl ? (
                <Button
                  className="bg-[linear-gradient(to_right,rgb(18,194,233),rgb(196,113,237),rgb(246,79,89))] hover:opacity-90 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 rounded-xl font-semibold"
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
                      className="bg-[linear-gradient(to_right,rgb(18,194,233),rgb(196,113,237),rgb(246,79,89))] hover:opacity-90 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 rounded-xl font-semibold"
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

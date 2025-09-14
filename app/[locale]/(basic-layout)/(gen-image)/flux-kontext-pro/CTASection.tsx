import { Link as I18nLink } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export default function CTASection() {
  const t = useTranslations("FluxKontextPro.cta");

  return (
    <section className="py-20 gradient-bg text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">{t("title")}</h2>
        <p className="text-xl opacity-90 mb-8 max-w-3xl mx-auto">
          {t("description")}
        </p>
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
          <I18nLink
            href={process.env.NEXT_PUBLIC_DEFAULT_FEATURE_PAGE || '/'}
            className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-medium text-center hover:bg-opacity-90 shadow-lg transition-all"
          >
            {t("button")}
          </I18nLink>
        </div>
      </div>
    </section>
  );
}

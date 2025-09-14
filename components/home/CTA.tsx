import { SectionBG4 } from "@/components/sectionBG";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link as I18nLink } from "@/i18n/routing";
import { ArrowRight, Rocket, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

export default function CTA() {
  const t = useTranslations("Landing.CTA");

  return (
    <section className="relative py-20 overflow-hidden">
      <SectionBG4 />

      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse" />
        <div className="absolute top-40 right-20 w-32 h-32 bg-yellow-400/20 rounded-full blur-2xl animate-bounce" />
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-pink-400/20 rounded-full blur-xl animate-pulse delay-1000" />
        <div className="absolute bottom-10 right-10 w-16 h-16 bg-blue-400/20 rounded-full blur-lg animate-bounce delay-500" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center text-white">
          <Badge className="mb-6 px-4 py-2 text-sm font-medium bg-white/20 text-white border border-white/30 backdrop-blur-sm">
            <Rocket className="w-4 h-4 mr-2" />
            {t("badge")}
          </Badge>

          <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            {t.rich("title", {
              highlight: (chunks) => (
                <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent font-extrabold">
                  {chunks}
                </span>
              ),
            })}
          </h2>

          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-4xl mx-auto leading-relaxed">
            {t("description")}
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
            <I18nLink
              href={process.env.NEXT_PUBLIC_DEFAULT_FEATURE_PAGE || "/"}
            >
              <Button className="bg-white text-indigo-600 hover:bg-gray-100 shadow-2xl hover:shadow-3xl transition-all duration-200 px-10 py-6 rounded-2xl font-bold text-lg group transform hover:scale-105">
                <Sparkles className="w-6 h-6 mr-3 text-purple-600" />
                {t("primaryButton")}
                <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
              </Button>
            </I18nLink>
          </div>
        </div>
      </div>
    </section>
  );
}

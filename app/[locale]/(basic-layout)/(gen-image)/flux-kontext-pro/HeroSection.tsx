import { Badge } from "@/components/ui/badge";
import { CheckCircle, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import FluxKontextProClient from "./FluxKontextProClient";

export default function HeroSection() {
  const t = useTranslations("FluxKontextPro.hero");
  const features = t.raw("features");

  return (
    <section
      id="hero"
      className="py-12 px-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 px-4 py-2">
            <Sparkles className="w-4 h-4 mr-2" />
            {t("badge")}
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold mb-6 gradient-text">
            {t("title")}
          </h1>
          {/* <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto mb-8"> */}
          <p className="text-gray-600 dark:text-gray-400 max-w-4xl mx-auto leading-relaxed mb-8">
            {t("description")}
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {features.map((feature: string) => (
              <div
                key={feature}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"
              >
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
        <FluxKontextProClient />
      </div>
    </section>
  );
}

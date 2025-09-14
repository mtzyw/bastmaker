import { Card, CardContent } from "@/components/ui/card";
import {
  Camera,
  Image as ImageIcon,
  MapPin,
  Palette,
  Shirt,
  Sparkles,
  Type,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";

export default function UseCasesSection() {
  const t = useTranslations("MultiImageKontextPro.useCases");

  const useCases = [
    {
      title: t("items.styleTransfer.title"),
      description: t("items.styleTransfer.description"),
      icon: Palette,
      iconBg: "bg-purple-100 dark:bg-purple-900",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    {
      title: t("items.textEditing.title"),
      description: t("items.textEditing.description"),
      icon: Type,
      iconBg: "bg-blue-100 dark:bg-blue-900",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: t("items.backgroundReplacement.title"),
      description: t("items.backgroundReplacement.description"),
      icon: MapPin,
      iconBg: "bg-green-100 dark:bg-green-900",
      iconColor: "text-green-600 dark:text-green-400",
    },
    {
      title: t("items.fashionModification.title"),
      description: t("items.fashionModification.description"),
      icon: Shirt,
      iconBg: "bg-pink-100 dark:bg-pink-900",
      iconColor: "text-pink-600 dark:text-pink-400",
    },
    {
      title: t("items.photographyEnhancement.title"),
      description: t("items.photographyEnhancement.description"),
      icon: Camera,
      iconBg: "bg-orange-100 dark:bg-orange-900",
      iconColor: "text-orange-600 dark:text-orange-400",
    },
    {
      title: t("items.characterConsistency.title"),
      description: t("items.characterConsistency.description"),
      icon: Users,
      iconBg: "bg-indigo-100 dark:bg-indigo-900",
      iconColor: "text-indigo-600 dark:text-indigo-400",
    },
    {
      title: t("items.creativeContent.title"),
      description: t("items.creativeContent.description"),
      icon: Sparkles,
      iconBg: "bg-yellow-100 dark:bg-yellow-900",
      iconColor: "text-yellow-600 dark:text-yellow-400",
    },
    {
      title: t("items.professionalWorkflows.title"),
      description: t("items.professionalWorkflows.description"),
      icon: ImageIcon,
      iconBg: "bg-teal-100 dark:bg-teal-900",
      iconColor: "text-teal-600 dark:text-teal-400",
    },
  ];

  return (
    <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6 gradient-text">
            {t("title")}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
            {t("description")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {useCases.map((useCase, index) => {
            const IconComponent = useCase.icon;
            return (
              <Card
                key={index}
                className="border-primary/20 hover:shadow-lg transition-all duration-300 hover:scale-105 bg-white dark:bg-gray-800"
              >
                <CardContent className="p-6">
                  <div
                    className={`w-12 h-12 rounded-lg ${useCase.iconBg} flex items-center justify-center mb-4`}
                  >
                    <IconComponent className={`w-6 h-6 ${useCase.iconColor}`} />
                  </div>
                  <h3 className="font-semibold mb-3 text-gray-900 dark:text-white text-lg">
                    {useCase.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {useCase.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-3xl mx-auto">
            {t("footer")}
          </p>
        </div>
      </div>
    </section>
  );
}

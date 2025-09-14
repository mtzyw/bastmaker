import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Brain,
  Image as ImageIcon,
  Palette,
  Shield,
  Star,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";

export default function FeaturesSection() {
  const t = useTranslations("MultiImageKontextPro.features");

  const features = [
    {
      icon: Brain,
      iconBg: "bg-blue-100 dark:bg-blue-900",
      iconColor: "text-blue-600 dark:text-blue-400",
      title: t("items.dualInputProcessing.title"),
      description: t("items.dualInputProcessing.description"),
    },
    {
      icon: Zap,
      iconBg: "bg-green-100 dark:bg-green-900",
      iconColor: "text-green-600 dark:text-green-400",
      title: t("items.contextualFusion.title"),
      description: t("items.contextualFusion.description"),
    },
    {
      icon: Palette,
      iconBg: "bg-purple-100 dark:bg-purple-900",
      iconColor: "text-purple-600 dark:text-purple-400",
      title: t("items.creativeComposition.title"),
      description: t("items.creativeComposition.description"),
    },
    {
      icon: ImageIcon,
      iconBg: "bg-orange-100 dark:bg-orange-900",
      iconColor: "text-orange-600 dark:text-orange-400",
      title: t("items.professionalOutput.title"),
      description: t("items.professionalOutput.description"),
    },
    {
      icon: Shield,
      iconBg: "bg-red-100 dark:bg-red-900",
      iconColor: "text-red-600 dark:text-red-400",
      title: t("items.versatileApplications.title"),
      description: t("items.versatileApplications.description"),
    },
    {
      icon: Star,
      iconBg: "bg-teal-100 dark:bg-teal-900",
      iconColor: "text-teal-600 dark:text-teal-400",
      title: t("items.seamlessIntegration.title"),
      description: t("items.seamlessIntegration.description"),
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card key={index} className="border-primary/20 hover:shadow-lg">
                <CardHeader>
                  <div
                    className={`w-12 h-12 ${feature.iconBg} rounded-lg flex items-center justify-center mb-4`}
                  >
                    <IconComponent className={`w-6 h-6 ${feature.iconColor}`} />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

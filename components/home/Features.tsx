import { SectionBG5 } from "@/components/sectionBG";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { featureList } from "@/config/featureList";
import { Link as I18nLink } from "@/i18n/routing";
import { ArrowRight, Layers, Wand2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

const featureIcons = {
  flux_kontext_pro: Wand2,
  multi_image_kontext_pro: Layers,
};

const FEATURED_MODELS = [
  "flux_kontext_pro",
  "multi_image_kontext_pro",
] as const;

interface SingleImageExample {
  type: "single";
  before: string;
  after: string;
  prompt: string;
}

interface MultiImageExample {
  type: "multi";
  image1: string;
  image2: string;
  result: string;
  prompt: string;
}

type FeatureExample = SingleImageExample | MultiImageExample;

const featureExamples: Record<string, FeatureExample> = {
  flux_kontext_pro: {
    type: "single",
    before: "/images/examples/flux-kontext-pro/test5-before.webp",
    after: "/images/examples/flux-kontext-pro/test5-after.webp",
    prompt: "Convert to Studio Ghibli style",
  },
  multi_image_kontext_pro: {
    type: "multi",
    image1: "/images/examples/multi-images/test-1-before-1.webp",
    image2: "/images/examples/multi-images/test-1-before-2.webp",
    result: "/images/examples/multi-images/test-1-after.webp",
    prompt: "Put the woman next to the house",
  },
};

export default function AIFeatures() {
  const t = useTranslations("Landing.Features");

  const availableFeatures = FEATURED_MODELS.map(
    (modelId) => [modelId, featureList[modelId]] as const
  ).filter(([_, feature]) => feature);

  return (
    <section id="features" className="py-10 relative">
      <SectionBG5 />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t.rich("title", {
              highlight: (chunks) => (
                <span className="gradient-text">{chunks}</span>
              ),
            })}
          </h2>

          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
            {t("description")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          {availableFeatures.map(([featureId, feature]) => {
            const Icon =
              featureIcons[featureId as keyof typeof featureIcons] || Wand2;
            const example =
              featureExamples[featureId as keyof typeof featureExamples];

            return (
              <Card
                key={featureId}
                className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850"
              >
                <div className="relative h-64 theme-bg overflow-hidden">
                  {example && example.type === "single" && (
                    <div className="grid grid-cols-2 gap-4 p-6 h-full">
                      <div className="relative rounded-lg overflow-hidden">
                        <Image
                          src={example.before}
                          alt="Before"
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <Badge className="absolute bottom-2 left-2 bg-gray-800/80 text-white text-xs">
                          Before
                        </Badge>
                      </div>
                      <div className="relative rounded-lg overflow-hidden">
                        <Image
                          src={example.after}
                          alt="After"
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <Badge className="absolute bottom-2 left-2 gradient-bg border-main text-white text-xs">
                          After
                        </Badge>
                      </div>
                    </div>
                  )}

                  {example && example.type === "multi" && (
                    <div className="grid grid-cols-[1fr_auto_1fr_auto_1.5fr] gap-3 p-6 h-full items-center">
                      <div className="relative aspect-square rounded-lg overflow-hidden">
                        <Image
                          src={example.image1}
                          alt="Image 1"
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="text-2xl font-bold text-gray-400">+</div>
                      <div className="relative aspect-square rounded-lg overflow-hidden">
                        <Image
                          src={example.image2}
                          alt="Image 2"
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <ArrowRight className="text-gray-400 w-6 h-6" />
                      <div className="relative aspect-square rounded-lg overflow-hidden">
                        <Image
                          src={example.result}
                          alt="Result"
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 rounded-xl theme-icon-bg">
                      <Icon className="w-6 h-6 theme-text-primary" />
                    </div>
                    <CardTitle className="text-2xl text-gray-900 dark:text-white">
                      {feature.name}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-gray-600 dark:text-gray-400 leading-relaxed text-base font-mono">
                    Prompt: {example?.prompt}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-sm theme-badge-outline"
                      >
                        {feature.creditsCost} {t("credits")}
                      </Badge>
                    </div>

                    <I18nLink href={`/${featureId.replace(/_/g, "-")}`}>
                      <Button
                        size="sm"
                        className="button-gradient-bg shadow-md hover:shadow-lg transition-all duration-200 group px-4 py-2 text-white"
                      >
                        {t("tryNow")}
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </I18nLink>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

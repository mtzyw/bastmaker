import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

interface ExampleItem {
  id: string;
  title: string;
  description: string;
  beforeImage: string;
  afterImage: string;
  prompt: string;
}

export default function ExamplesSection() {
  const t = useTranslations("FluxKontextPro.examples");

  const examples: ExampleItem[] = [
    {
      id: "cartoonify",
      title: t("items.cartoonify.title"),
      description: t("items.cartoonify.description"),
      beforeImage: "/images/examples/flux-kontext-pro/test5-before.webp",
      afterImage: "/images/examples/flux-kontext-pro/test5-after.webp",
      prompt: "Convert to Studio Ghibli style",
    },
    {
      id: "textRemoval",
      title: t("items.textRemoval.title"),
      description: t("items.textRemoval.description"),
      beforeImage: "/images/examples/flux-kontext-pro/test2-before.webp",
      afterImage: "/images/examples/flux-kontext-pro/test2-after.webp",
      prompt:
        "Remove all text from the image while keeping the background intact",
    },
    {
      id: "backgroundChange",
      title: t("items.backgroundChange.title"),
      description: t("items.backgroundChange.description"),
      beforeImage: "/images/examples/flux-kontext-pro/test6-before.webp",
      afterImage: "/images/examples/flux-kontext-pro/test6-after.webp",
      prompt:
        "Replace the background with a view of the Statue of Liberty in the distance.",
    },
    {
      id: "restoreImage",
      title: t("items.restoreImage.title"),
      description: t("items.restoreImage.description"),
      beforeImage: "/images/examples/flux-kontext-pro/test4-before.webp",
      afterImage: "/images/examples/flux-kontext-pro/test4-after.webp",
      prompt: "Recolor and restore this image, remove scratches and damage.",
    },
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6 gradient-text">
            {t("title")}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
            {t("description")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {examples.map((example) => (
            <div key={example.id} className="group h-full">
              <Card className="overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl h-full flex flex-col">
                <CardContent className="p-0 flex flex-col h-full">
                  <div className="relative h-80 grid grid-cols-2 gap-0 flex-shrink-0">
                    <div className="relative overflow-hidden">
                      <Image
                        src={example.beforeImage}
                        alt={`${example.title} - Before`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />
                      <div className="absolute top-3 left-3">
                        <span className="bg-black/40 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-sm">
                          {t("labels.before")}
                        </span>
                      </div>
                    </div>

                    <div className="relative overflow-hidden">
                      <Image
                        src={example.afterImage}
                        alt={`${example.title} - After`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />
                      <div className="absolute top-3 right-3">
                        <span className="bg-black/40 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-sm">
                          {t("labels.after")}
                        </span>
                      </div>
                    </div>

                    <div className="absolute inset-y-0 left-1/2 transform -translate-x-1/2 flex items-center justify-center z-20">
                      <div className="bg-white dark:bg-slate-800 rounded-full p-3 shadow-lg border-2 border-white/50">
                        <ArrowRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                      </div>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
                      {example.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed flex-1">
                      {example.description}
                    </p>

                    <div className="py-2 px-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50 mt-auto h-24 flex flex-col">
                      <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wide flex-shrink-0">
                        {t("labels.promptUsed")}
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 font-mono leading-relaxed flex-1 overflow-hidden">
                        {example.prompt}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

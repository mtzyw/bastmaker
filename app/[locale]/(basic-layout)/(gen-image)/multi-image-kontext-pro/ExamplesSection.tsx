import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

interface ExampleItem {
  id: string;
  title: string;
  description: string;
  image1: string;
  image2: string;
  resultImage: string;
  prompt: string;
}

export default function ExamplesSection() {
  const t = useTranslations("MultiImageKontextPro.examples");

  const examples: ExampleItem[] = [
    {
      id: "portraitBackground",
      title: t("items.portraitBackground.title"),
      description: t("items.portraitBackground.description"),
      image1: "/images/examples/multi-images/test-1-before-1.webp",
      image2: "/images/examples/multi-images/test-1-before-2.webp",
      resultImage: "/images/examples/multi-images/test-1-after.webp",
      prompt: "Put the woman next to the house",
    },
    {
      id: "objectComposition",
      title: t("items.objectComposition.title"),
      description: t("items.objectComposition.description"),
      image1: "/images/examples/multi-images/test-3-before-1.webp",
      image2: "/images/examples/multi-images/test-3-before-2.webp",
      resultImage: "/images/examples/multi-images/test-3-after.webp",
      prompt:
        "Add the handwriting to the car scene, the text says &quot;Look at this car!&quot;",
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
              <Card className="overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 border-0 shadow-lg hover:shadow-2xl transition-all duration-500 h-full flex flex-col">
                <CardContent className="p-0 flex flex-col h-full">
                  <div className="relative h-64 theme-bg overflow-hidden">
                    <div className="hidden lg:grid grid-cols-[1fr_auto_1fr_auto_1.5fr] gap-3 p-6 h-full items-center">
                      <div className="relative aspect-square rounded-lg overflow-hidden">
                        <Image
                          src={example.image1}
                          alt={`${example.title} - Image 1`}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="20vw"
                        />
                      </div>
                      <div className="text-2xl font-bold text-gray-400">+</div>
                      <div className="relative aspect-square rounded-lg overflow-hidden">
                        <Image
                          src={example.image2}
                          alt={`${example.title} - Image 2`}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="20vw"
                        />
                      </div>
                      <ArrowRight className="text-gray-400 w-6 h-6" />
                      <div className="relative aspect-square rounded-lg overflow-hidden">
                        <Image
                          src={example.resultImage}
                          alt={`${example.title} - Result`}
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                          sizes="30vw"
                        />
                      </div>
                    </div>

                    <div className="hidden md:block lg:hidden">
                      <div className="h-full flex flex-col justify-center p-6">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="relative aspect-square rounded-lg overflow-hidden">
                            <Image
                              src={example.image1}
                              alt={`${example.title} - Image 1`}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                              sizes="40vw"
                            />
                          </div>
                          <div className="relative aspect-square rounded-lg overflow-hidden">
                            <Image
                              src={example.image2}
                              alt={`${example.title} - Image 2`}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                              sizes="40vw"
                            />
                          </div>
                        </div>
                        <div className="text-center mb-4">
                          <ArrowRight className="w-6 h-6 text-gray-400 mx-auto transform rotate-90" />
                        </div>
                        <div className="text-center">
                          <div className="relative aspect-[3/2] rounded-lg overflow-hidden max-w-md mx-auto">
                            <Image
                              src={example.resultImage}
                              alt={`${example.title} - Result`}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                              sizes="60vw"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="md:hidden h-full flex flex-col justify-center p-4">
                      <div className="flex gap-2 mb-4">
                        <div className="flex-1 relative aspect-square rounded-lg overflow-hidden">
                          <Image
                            src={example.image1}
                            alt={`${example.title} - Image 1`}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="45vw"
                          />
                        </div>
                        <div className="flex items-center justify-center px-2">
                          <span className="text-xl text-gray-400">+</span>
                        </div>
                        <div className="flex-1 relative aspect-square rounded-lg overflow-hidden">
                          <Image
                            src={example.image2}
                            alt={`${example.title} - Image 2`}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="45vw"
                          />
                        </div>
                      </div>
                      <div className="text-center mb-4">
                        <ArrowRight className="w-5 h-5 text-gray-400 transform rotate-90" />
                      </div>
                      <div className="text-center">
                        <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
                          <Image
                            src={example.resultImage}
                            alt={`${example.title} - Result`}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="90vw"
                          />
                        </div>
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

                    <div className="py-3 px-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50 mt-auto">
                      <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wide">
                        {t("labels.promptUsed")}
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 font-mono leading-relaxed">
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

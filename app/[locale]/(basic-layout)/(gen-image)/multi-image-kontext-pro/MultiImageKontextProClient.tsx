"use client";

import { generateUserPresignedUploadUrl } from "@/actions/r2-resources";
import { AspectRatioSelector } from "@/components/ai/AspectRatioSelector";
import ImageResultDisplay from "@/components/ai/ImageResultDisplay";
import RecentImagesGallery from "@/components/ai/RecentImagesGallery";
import { useAuth } from "@/components/providers/AuthProvider";
import { useSubscriptionPopup } from "@/components/providers/SubscriptionPopupProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  FLUX_KONTEXT_PRO_PATH,
  INPUT_IMAGE_MAX_SIZE,
  OUTPUT_FORMATS,
} from "@/config/common";
import { featureList } from "@/config/featureList";
import { siteConfig } from "@/config/site";
import { useDownloadAccess } from "@/hooks/useDownloadAccess";
import { useUserBenefits } from "@/hooks/useUserBenefits";
import { DEFAULT_LOCALE } from "@/i18n/routing";
import { downloadFile } from "@/lib/downloadFile";
// import { useBenefitsStore } from "@/stores/benefitsStore";
import { ChevronDown, Loader2, Upload, Wand2, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

interface JobInfo {
  job_id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output_url?: string;
  error?: string;
  request_params?: Record<string, any>;
}

const FEATURE_KEY = "multi_image_kontext_pro";
const FEATURE_DISABLED = true;

const UploadBox = ({
  getRootProps,
  getInputProps,
  isDragActive,
  isUploading,
  isProcessing,
  sourceImage,
  removeImage,
  imageIndex,
  t,
}: {
  getRootProps: any;
  getInputProps: any;
  isDragActive: boolean;
  isUploading: boolean;
  isProcessing: boolean;
  sourceImage: string | null;
  removeImage: (index: 1 | 2) => void;
  imageIndex: 1 | 2;
  t: (key: string, values?: any) => string;
}) => (
  <div
    {...getRootProps()}
    className={`
          border-2 border-dashed rounded-lg h-64 flex items-center justify-center cursor-pointer transition-all duration-200
          ${
            isDragActive
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-gray-50 dark:bg-gray-800/50"
          }
          ${isUploading || isProcessing ? "cursor-not-allowed opacity-50" : ""}
        `}
  >
    <input {...getInputProps()} />

    {isUploading ? (
      <div className="text-center p-8">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400 mb-2 font-medium">
          {t("upload.uploading")}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          {t("upload.uploadingSubtext")}
        </p>
      </div>
    ) : sourceImage ? (
      <div className="relative w-full h-full px-4">
        <Image
          src={sourceImage}
          alt={`Source image ${imageIndex}`}
          width={400}
          height={240}
          className="max-h-full w-auto mx-auto object-contain"
        />
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-1 right-1 w-8 h-8"
          onClick={(e) => {
            e.stopPropagation();
            removeImage(imageIndex);
          }}
          disabled={isProcessing}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    ) : (
      <div className="text-center p-8">
        <div className="w-12 h-12 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full mx-auto mb-4">
          <Upload className="w-6 h-6 text-gray-500 dark:text-gray-400" />
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          {isDragActive
            ? t("upload.dragActive")
            : t("upload.dragInactive", { index: imageIndex })}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          {t("upload.supportedFormats", {
            size: INPUT_IMAGE_MAX_SIZE / 1024 / 1024,
          })}
        </p>
      </div>
    )}
  </div>
);

export default function MultiImageKontextProClient() {
  if (FEATURE_DISABLED) {
    return (
      <section className="container mx-auto px-4 py-10">
        <div className="bg-white dark:bg-gray-900 rounded-lg border p-10 text-center">
          <h2 className="text-xl font-semibold mb-2">Feature Unavailable</h2>
          <p className="text-muted-foreground">AI image generation is currently disabled.</p>
        </div>
      </section>
    );
  }

  return <MultiImageKontextProClientContent />;
}

function MultiImageKontextProClientContent() {
  const locale = useLocale();
  const {
    benefits,
    isLoading: benefitsLoading,
    optimisticDeduct,
    mutate: revalidateBenefits,
  } = useUserBenefits();
  const { user } = useAuth();
  const { openSubscriptionPopup } = useSubscriptionPopup();
  const router = useRouter();
  const galleryRef = useRef<any>(null);
  const t = useTranslations("MultiImageKontextPro.client");
  const { ensureDownloadAllowed } = useDownloadAccess({
    benefits,
    isLoading: benefitsLoading,
  });

  const [sourceImage1, setSourceImage1] = useState<string | null>(null);
  const [sourceImageUrl1, setSourceImageUrl1] = useState<string | null>(null);
  const [sourceImage2, setSourceImage2] = useState<string | null>(null);
  const [sourceImageUrl2, setSourceImageUrl2] = useState<string | null>(null);

  const [resultImage, setResultImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("match_input_image");
  const [outputFormat, setOutputFormat] = useState("png");
  const [seed, setSeed] = useState("");
  const [selectedModel, setSelectedModel] = useState<
    "multi_image_kontext_pro" | "multi_image_kontext_max"
  >("multi_image_kontext_pro");
  const [isUploading1, setIsUploading1] = useState(false);
  const [isUploading2, setIsUploading2] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [job, setJob] = useState<JobInfo | null>(null);
  const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useState(false);

  const isUploading = isUploading1 || isUploading2;
  const creditsRequired = featureList[selectedModel].creditsCost;

  const saveFormData = useCallback(() => {
    const formData = {
      prompt,
      aspectRatio,
      outputFormat,
      seed,
      selectedModel,
      timestamp: Date.now(),
    };
    localStorage.setItem(
      "multi_image_kontext_pro_form",
      JSON.stringify(formData)
    );
  }, [prompt, aspectRatio, outputFormat, seed, selectedModel]);

  useEffect(() => {
    if (
      prompt ||
      aspectRatio !== "match_input_image" ||
      outputFormat !== "png" ||
      seed ||
      selectedModel !== "multi_image_kontext_pro"
    ) {
      saveFormData();
    }
  }, [prompt, aspectRatio, outputFormat, seed, saveFormData, selectedModel]);

  useEffect(() => {
    const savedJob = localStorage.getItem("multi_image_kontext_pro_job");
    if (savedJob) {
      try {
        const job = JSON.parse(savedJob);
        if (
          job.job_id &&
          (job.status === "starting" || job.status === "processing")
        ) {
          setJob(job);
          setIsProcessing(true);
        }
      } catch (error) {
        console.error("Failed to parse saved job:", error);
        localStorage.removeItem("multi_image_kontext_pro_job");
      }
    }

    const savedImage1 = localStorage.getItem("multi_image_kontext_pro_image1");
    if (savedImage1) {
      try {
        const imageData = JSON.parse(savedImage1);
        if (imageData.sourceImage && imageData.sourceImageUrl) {
          setSourceImage1(imageData.sourceImage);
          setSourceImageUrl1(imageData.sourceImageUrl);
        }
      } catch (error) {
        console.error("Failed to parse saved image 1:", error);
        localStorage.removeItem("multi_image_kontext_pro_image1");
      }
    }

    const savedImage2 = localStorage.getItem("multi_image_kontext_pro_image2");
    if (savedImage2) {
      try {
        const imageData = JSON.parse(savedImage2);
        if (imageData.sourceImage && imageData.sourceImageUrl) {
          setSourceImage2(imageData.sourceImage);
          setSourceImageUrl2(imageData.sourceImageUrl);
        }
      } catch (error) {
        console.error("Failed to parse saved image 2:", error);
        localStorage.removeItem("multi_image_kontext_pro_image2");
      }
    }

    const savedFormData = localStorage.getItem("multi_image_kontext_pro_form");
    if (savedFormData) {
      try {
        const formData = JSON.parse(savedFormData);
        if (formData.prompt) setPrompt(formData.prompt);
        if (formData.aspectRatio) setAspectRatio(formData.aspectRatio);
        if (formData.selectedModel) setSelectedModel(formData.selectedModel);
        // if (formData.outputFormat) setOutputFormat(formData.outputFormat);
        // if (formData.seed) setSeed(formData.seed);
      } catch (error) {
        console.error("Failed to parse saved form data:", error);
        localStorage.removeItem("multi_image_kontext_pro_form");
      }
    }

    const savedResult = localStorage.getItem("multi_image_kontext_pro_result");
    if (savedResult) {
      try {
        const resultData = JSON.parse(savedResult);
        setResultImage(resultData.resultImage);
      } catch (error) {
        console.error("Failed to parse saved result:", error);
        localStorage.removeItem("multi_image_kontext_pro_result");
      }
    }
  }, []);

  useEffect(() => {
    if (!job?.job_id || !isProcessing) return;

    let timeoutId: NodeJS.Timeout;

    const pollJobStatus = async () => {
      try {
        const response = await fetch(
          `/api/ai/replicate/flux-kontent/status/${job.job_id}`,
          {
            headers: {
              "Content-Type": "application/json",
              "Accept-Language": (locale || DEFAULT_LOCALE) as string,
            },
          }
        );

        if (!response.ok) {
          setIsProcessing(false);
          localStorage.removeItem("multi_image_kontext_pro_job");

          throw new Error("Failed to fetch job status");
        }

        const result = await response.json();
        if (result.success) {
          const job: JobInfo = result.data;

          setJob(job);
          localStorage.setItem(
            "multi_image_kontext_pro_job",
            JSON.stringify(job)
          );

          if (job.status === "succeeded") {
            const resultUrl = job.output_url || null;
            setResultImage(resultUrl);
            setIsProcessing(false);
            localStorage.removeItem("multi_image_kontext_pro_job");

            if (resultUrl) {
              const resultData = {
                resultImage: resultUrl,
                timestamp: Date.now(),
                jobId: job.job_id,
              };
              localStorage.setItem(
                "multi_image_kontext_pro_result",
                JSON.stringify(resultData)
              );

              galleryRef.current?.refresh();
            }
            return;
          }

          if (job.status === "failed") {
            setIsProcessing(false);
            localStorage.removeItem("multi_image_kontext_pro_job");
            localStorage.removeItem("multi_image_kontext_pro_result");
            toast.error(
              `Processing failed: ${result.error || "Unknown error"}`
            );
            return;
          }

          if (job.status === "canceled") {
            setIsProcessing(false);
            localStorage.removeItem("multi_image_kontext_pro_job");
            localStorage.removeItem("multi_image_kontext_pro_result");
            return;
          }

          timeoutId = setTimeout(pollJobStatus, 2000);
        }
      } catch (error) {
        console.error("Failed to poll job status:", error);
        setIsProcessing(false);
      }
    };

    pollJobStatus();

    return () => clearTimeout(timeoutId);
  }, [job?.job_id, isProcessing, locale]);

  const handleImageUpload = useCallback(
    async (file: File, imageIndex: 1 | 2) => {
      if (!user) {
        toast.error("Please login to upload image", {
          action: {
            label: "Login",
            onClick: () => {
              const currentPath = window.location.pathname;
              router.push(`/sign-up?next=${encodeURIComponent(currentPath)}`);
            },
          },
        });
        const currentPath = window.location.pathname;
        router.push(`/sign-up?next=${encodeURIComponent(currentPath)}`);
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.error(t("upload.validationError"));
        return;
      }

      const maxSize = INPUT_IMAGE_MAX_SIZE;
      if (file.size > maxSize) {
        toast.error(t("upload.sizeError", { size: maxSize / 1024 / 1024 }));
        return;
      }

      if (imageIndex === 1) {
        setIsUploading1(true);
      } else {
        setIsUploading2(true);
      }

      setJob(null);
      setResultImage(null);
      setIsProcessing(false);
      localStorage.removeItem("multi_image_kontext_pro_job");
      localStorage.removeItem("multi_image_kontext_pro_result");

      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (imageIndex === 1) {
            setSourceImage1(reader.result as string);
          } else {
            setSourceImage2(reader.result as string);
          }
        };
        reader.readAsDataURL(file);

        const presignedResponse = await generateUserPresignedUploadUrl({
          fileName: file.name,
          contentType: file.type,
          prefix: "input-image",
          path: FLUX_KONTEXT_PRO_PATH,
        });

        if (!presignedResponse.success || !presignedResponse.data) {
          throw new Error(
            presignedResponse.error || "Failed to get upload URL"
          );
        }

        const { presignedUrl, publicObjectUrl } = presignedResponse.data;

        const uploadResponse = await fetch(presignedUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
            "Accept-Language": (locale || DEFAULT_LOCALE) as string,
          },
        });

        if (!uploadResponse.ok) {
          let r2Error = "";
          try {
            r2Error = await uploadResponse.text();
          } catch {}
          console.error("Upload Error:", r2Error, uploadResponse);
          throw new Error(r2Error);
        }

        if (imageIndex === 1) {
          setSourceImageUrl1(publicObjectUrl);
        } else {
          setSourceImageUrl2(publicObjectUrl);
        }

        const imageData = {
          sourceImage: publicObjectUrl,
          sourceImageUrl: publicObjectUrl,
          timestamp: Date.now(),
        };
        localStorage.setItem(
          `multi_image_kontext_pro_image${imageIndex}`,
          JSON.stringify(imageData)
        );
      } catch (error) {
        console.error("Upload failed:", error);
        toast.error(t("upload.uploadError"));
        if (imageIndex === 1) {
          setSourceImage1(null);
          setSourceImageUrl1(null);
          localStorage.removeItem("multi_image_kontext_pro_image1");
        } else {
          setSourceImage2(null);
          setSourceImageUrl2(null);
          localStorage.removeItem("multi_image_kontext_pro_image2");
        }
      } finally {
        if (imageIndex === 1) {
          setIsUploading1(false);
        } else {
          setIsUploading2(false);
        }
      }
    },
    [t, locale]
  );

  const onDrop1 = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        handleImageUpload(acceptedFiles[0], 1);
      }
    },
    [handleImageUpload]
  );

  const onDrop2 = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        handleImageUpload(acceptedFiles[0], 2);
      }
    },
    [handleImageUpload]
  );

  const {
    getRootProps: getRootProps1,
    getInputProps: getInputProps1,
    isDragActive: isDragActive1,
  } = useDropzone({
    onDrop: onDrop1,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/webp": [".webp"],
    },
    multiple: false,
    disabled: isUploading1 || isProcessing,
  });

  const {
    getRootProps: getRootProps2,
    getInputProps: getInputProps2,
    isDragActive: isDragActive2,
  } = useDropzone({
    onDrop: onDrop2,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/webp": [".webp"],
    },
    multiple: false,
    disabled: isUploading2 || isProcessing,
  });

  const handleSubmit = async () => {
    if (!user) {
      const currentPath = window.location.pathname;
      router.push(`/sign-up?next=${encodeURIComponent(currentPath)}`);
      return;
    }

    if (!sourceImageUrl1 || !sourceImageUrl2 || !prompt.trim()) {
      toast.error(t("form.submitValidation"));
      return;
    }

    if (!benefits || benefits.totalAvailableCredits < creditsRequired) {
      toast(t("processing.insufficientCredits"), {
        duration: 10000,
        action: {
          label: t("processing.getCreditsAction"),
          onClick: () => {
            window.open(
              process.env.NEXT_PUBLIC_PRICING_PATH || "/#pricing",
              "_blank"
            );
          },
        },
      });
      openSubscriptionPopup();
      return;
    }

    setJob(null);
    setIsProcessing(true);
    setResultImage(null);
    localStorage.removeItem("multi_image_kontext_pro_job");
    localStorage.removeItem("multi_image_kontext_pro_result");

    try {
      const requestBody = {
        feature_id: selectedModel,
        parameters: {
          prompt: prompt.trim(),
          input_image_1: sourceImageUrl1,
          input_image_2: sourceImageUrl2,
          aspect_ratio: aspectRatio,
          output_format: outputFormat,
        },
        ...(seed && { seed: parseInt(seed, 10) }),
      };

      optimisticDeduct(creditsRequired);

      const response = await fetch("/api/ai/replicate/flux-kontent/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": (locale || DEFAULT_LOCALE) as string,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        setIsProcessing(false);
        revalidateBenefits();
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit job");
      }

      const result = await response.json();
      if (result.success) {
        const jobId = result.data.job_id;

        revalidateBenefits();

        const initialStatus: JobInfo = {
          job_id: jobId,
          status: "starting",
        };
        setJob(initialStatus);
        localStorage.setItem(
          "multi_image_kontext_pro_job",
          JSON.stringify(initialStatus)
        );
      } else {
        setIsProcessing(false);
        revalidateBenefits();
        throw new Error(result.error || "Failed to submit job");
      }
    } catch (error) {
      console.error("Submit failed:", error);
      toast.error(
        error instanceof Error ? error.message : t("processing.submitError")
      );
      setIsProcessing(false);
      revalidateBenefits();
    }
  };

  const handleDownload = () => {
    if (!resultImage) {
      return;
    }
    if (!ensureDownloadAllowed()) {
      return;
    }
    void downloadFile(
      resultImage,
      `${siteConfig.name}-${selectedModel}.${outputFormat}`
    );
  };

  const removeImage = (imageIndex: 1 | 2) => {
    if (imageIndex === 1) {
      setSourceImage1(null);
      setSourceImageUrl1(null);
      localStorage.removeItem("multi_image_kontext_pro_image1");
    } else {
      setSourceImage2(null);
      setSourceImageUrl2(null);
      localStorage.removeItem("multi_image_kontext_pro_image2");
    }
  };

  const handleEdit = useCallback(() => {
    if (!resultImage) return;

    // For multi-image, we'll replace the first image with the result.
    // This could be made more sophisticated in the future.
    setSourceImage1(resultImage);
    setSourceImageUrl1(resultImage);

    const imageData = {
      sourceImage: resultImage,
      sourceImageUrl: resultImage,
      timestamp: Date.now(),
    };
    localStorage.setItem(
      "multi_image_kontext_pro_image1",
      JSON.stringify(imageData)
    );

    setResultImage(null);
    localStorage.removeItem("multi_image_kontext_pro_result");
  }, [resultImage]);

  return (
    <section className="container mx-auto px-4 py-4 mb-8">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left side - Upload and editing area */}
        <div className="flex flex-col space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <UploadBox
              getRootProps={getRootProps1}
              getInputProps={getInputProps1}
              isDragActive={isDragActive1}
              isUploading={isUploading1}
              isProcessing={isProcessing}
              sourceImage={sourceImage1}
              removeImage={removeImage}
              imageIndex={1}
              t={t}
            />
            <UploadBox
              getRootProps={getRootProps2}
              getInputProps={getInputProps2}
              isDragActive={isDragActive2}
              isUploading={isUploading2}
              isProcessing={isProcessing}
              sourceImage={sourceImage2}
              removeImage={removeImage}
              imageIndex={2}
              t={t}
            />
          </div>

          <AspectRatioSelector
            value={aspectRatio}
            onChange={setAspectRatio}
            disabled={isProcessing}
          />

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("form.promptLabel")}
            </label>
            <Textarea
              placeholder={t("form.promptPlaceholder")}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              maxLength={1000}
              disabled={isProcessing}
              className="resize-none rounded-lg border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border dark:border-gray-700 p-3 shadow-sm">
            <div>
              <Label
                htmlFor="quality-switch"
                className="font-medium text-gray-800 dark:text-gray-200"
              >
                {t("form.maxQualityLabel")}
              </Label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("form.maxQualityDescription", {
                  credits: featureList["multi_image_kontext_max"].creditsCost,
                })}
              </p>
            </div>
            <Switch
              id="quality-switch"
              checked={selectedModel === "multi_image_kontext_max"}
              onCheckedChange={(checked) => {
                setSelectedModel(
                  checked
                    ? "multi_image_kontext_max"
                    : "multi_image_kontext_pro"
                );
              }}
              disabled={isProcessing}
            />
          </div>

          <div className="space-y-2">
            <button
              onClick={() => setIsAdvancedSettingsOpen(!isAdvancedSettingsOpen)}
              className="flex w-full items-center justify-between rounded-lg py-2 text-left text-sm font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800/50"
            >
              <span>{t("form.advancedSettings")}</span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 transition-transform duration-300 ${
                  isAdvancedSettingsOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isAdvancedSettingsOpen ? "max-h-40" : "max-h-0"
              }`}
            >
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("form.outputFormatLabel")}
                  </label>
                  <Select
                    value={outputFormat}
                    onValueChange={setOutputFormat}
                    disabled={isProcessing}
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OUTPUT_FORMATS.map((format) => (
                        <SelectItem key={format.value} value={format.value}>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("form.seedLabel")}
                  </label>
                  <Input
                    type="number"
                    placeholder={t("form.seedPlaceholder")}
                    value={seed}
                    onChange={(e) => setSeed(e.target.value)}
                    disabled={isProcessing}
                    className="rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={
              !sourceImage1 ||
              !sourceImage2 ||
              !prompt.trim() ||
              isUploading ||
              isProcessing
            }
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {t("processing.processing")}
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                {t("processing.transformButton", {
                  credits: creditsRequired,
                })}
              </>
            )}
          </Button>
        </div>

        {/* Right side - Preview area */}
        <div className="flex flex-col space-y-6">
          <ImageResultDisplay
            resultImage={resultImage}
            isProcessing={isProcessing}
            job={job}
            onDownload={handleDownload}
            onEdit={handleEdit}
          />

          <RecentImagesGallery
            ref={galleryRef}
            statuses={["processing", "succeeded"]}
            pageSize={12}
          />
        </div>
      </div>
    </section>
  );
}

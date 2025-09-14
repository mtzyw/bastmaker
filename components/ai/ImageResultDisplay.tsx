import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStatusBadgeStyle } from "@/lib/utils";
import { Download, Edit, Image as ImageIcon, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

interface JobInfo {
  job_id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output_url?: string;
  error?: string;
  request_params?: Record<string, any>;
}

interface ResultDisplayProps {
  resultImage: string | null;
  isProcessing: boolean;
  job: JobInfo | null;
  onDownload: () => void;
  onEdit?: () => void;
  title?: string;
  processingMessage?: string;
  processingSubMessage?: string;
  placeholderMessage?: string;
}

export default function ImageResultDisplay({
  resultImage,
  isProcessing,
  job,
  onDownload,
  onEdit,
  title,
  processingMessage,
  processingSubMessage,
  placeholderMessage,
}: ResultDisplayProps) {
  const t = useTranslations("GenImageShared.imageResultDisplay");

  const getStatusText = (status: string) => {
    return t(`status.${status}` as any);
  };

  return (
    <div className="space-y-6">
      {/* Preview Area */}
      <div className="bg-gray-50 dark:bg-gray-800/50 h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center overflow-hidden">
        {isProcessing ? (
          <div className="text-center p-8">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2 font-medium">
              {processingMessage || t("processing.message")}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              {processingSubMessage || t("processing.subMessage")}
            </p>
            {job && (
              <Badge className={`mt-4 ${getStatusBadgeStyle(job.status)}`}>
                {getStatusText(job.status)}
              </Badge>
            )}
          </div>
        ) : resultImage ? (
          <Image
            src={resultImage}
            alt={t("altText")}
            width={500}
            height={400}
            className="max-h-full w-auto mx-auto object-contain"
          />
        ) : (
          <div className="text-center p-8">
            <div className="w-12 h-12 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full mx-auto mb-4">
              <ImageIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              {placeholderMessage || t("placeholder.message")}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              {t("placeholder.description")}
            </p>
          </div>
        )}
      </div>

      {resultImage && (
        <div className="flex justify-center items-center">
          <div className="flex space-x-3">
            <Button
              onClick={onDownload}
              variant="outline"
              className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              {t("buttons.download")}
            </Button>
            {onEdit && (
              <Button
                onClick={onEdit}
                variant="outline"
                className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Edit className="w-4 h-4 mr-2" />
                {t("buttons.edit")}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

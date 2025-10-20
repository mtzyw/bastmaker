"use client";

import { getImageJobsUser, ImageJob } from "@/actions/image-jobs";
import { ImagePreview } from "@/components/ImagePreview";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link as I18nLink } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Loader2, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { toast } from "sonner";

interface RecentImagesGalleryProps {
  featureId?: string;
  statuses?: Array<
    "starting" | "processing" | "succeeded" | "failed" | "canceled"
  >;
  pageSize?: number;
  className?: string;
}

export interface RecentImagesGalleryRef {
  refresh: () => void;
}

const RecentImagesGallery = forwardRef<
  RecentImagesGalleryRef,
  RecentImagesGalleryProps
>(
  (
    {
      featureId,
      statuses = ["processing", "succeeded"],
      pageSize = 12,
      className,
    },
    ref
  ) => {
    const t = useTranslations("GenImageShared.recentImagesGallery");
    const [jobs, setJobs] = useState<ImageJob[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [hasMore, setHasMore] = useState(false);

    const fetchJobs = useCallback(
      async (isRefresh = false) => {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          // 如果用户未登录，设置为空列表并停止加载
          setJobs([]);
          setHasMore(false);
          setIsLoading(false);
          setIsRefreshing(false);
          return;
        }

        if (isRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        try {
          const result = await getImageJobsUser({
            pageIndex: 0,
            pageSize,
            featureId,
            statuses,
          });

          if (result.success && result.data) {
            setJobs(result.data?.jobs || []);
            setHasMore(result.data?.hasMore || false);
          } else {
            toast.error(result.error || t("errorMessages.failedToLoadImages"));
          }
        } catch (error) {
          console.error("Failed to fetch jobs:", error);
          toast.error(t("errorMessages.failedToLoadImages"));
        } finally {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      },
      [featureId, statuses, pageSize]
    );

    useEffect(() => {
      fetchJobs();
    }, []);

    const handleRefresh = useCallback(() => {
      fetchJobs(true);
    }, [fetchJobs]);

    useImperativeHandle(
      ref,
      () => ({
        refresh: handleRefresh,
      }),
      [handleRefresh]
    );

    const getImageUrl = (job: ImageJob) => {
      return job.final_output_url || job.temp_output_url;
    };

    const isProcessing = (job: ImageJob) => {
      return job.status === "starting" || job.status === "processing";
    };

    if (isLoading) {
      return (
        <div className={cn("space-y-4", className)}>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
              {t("title")}
            </label>
            <Skeleton className="h-9 w-20" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: pageSize }).map((_, index) => (
              <div key={index} className="aspect-square">
                <Skeleton className="w-full h-full rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (jobs.length === 0) {
      return (
        <div className={cn("space-y-4", className)}>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
              {t("title")}
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>{t("emptyState")}</p>
          </div>
        </div>
      );
    }

    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
            {t("title")}
          </label>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {jobs.map((job) => {
            const imageUrl = getImageUrl(job);
            const processing = isProcessing(job);

            return (
              <div
                key={job.id}
                className={cn(
                  "relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-200",
                  imageUrl &&
                    !processing &&
                    "cursor-pointer hover:shadow-lg hover:scale-105",
                  processing && "opacity-60"
                )}
              >
                {imageUrl ? (
                  <>
                    <ImagePreview>
                      <Image
                        src={imageUrl}
                        alt={`Generated image - ${job.feature_id}`}
                        fill
                        className="object-cover"
                      />
                    </ImagePreview>
                    {processing && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <div className="bg-white/90 dark:bg-gray-800/90 rounded-full p-3">
                          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        </div>
                      </div>
                    )}
                    {job.status === "failed" && (
                      <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                        <div className="bg-white/90 dark:bg-gray-800/90 rounded-full px-3 py-1">
                          <span className="text-xs font-medium text-red-600">
                            {t("status.failed")}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    {processing ? (
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {t("status.processing")}
                        </span>
                      </div>
                    ) : (
                      <div className="text-center">
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {t("status.noImage")}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {hasMore && (
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("showingImages", { count: jobs.length })}{" "}
              <I18nLink href="/my-creations" className="text-blue-500" prefetch={false}>
                {t("viewAllLink")}
              </I18nLink>
            </p>
          </div>
        )}
      </div>
    );
  }
);

RecentImagesGallery.displayName = "RecentImagesGallery";

export default RecentImagesGallery;

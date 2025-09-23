"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CreationItem } from "@/lib/ai/creations";

const STATUS_TEXT_MAP: Record<string, string> = {
  pending: "排队中",
  queued: "排队中",
  processing: "生成中",
  completed: "已完成",
  failed: "生成失败",
  cancelled: "已取消",
  cancelled_insufficient_credits: "积分不足",
};

const STATUS_STYLE_MAP: Record<string, string> = {
  pending: "bg-sky-500/20 text-sky-200 border border-sky-500/40",
  completed: "bg-emerald-500/20 text-emerald-200 border border-emerald-500/50",
  processing: "bg-sky-500/20 text-sky-200 border border-sky-500/40",
  queued: "bg-sky-500/20 text-sky-200 border border-sky-500/40",
  failed: "bg-rose-500/20 text-rose-200 border border-rose-500/40",
  cancelled: "bg-rose-500/20 text-rose-200 border border-rose-500/40",
  cancelled_insufficient_credits: "bg-amber-500/20 text-amber-200 border border-amber-500/40",
};

function getStatusLabel(status?: string | null) {
  if (!status) return "未知状态";
  return STATUS_TEXT_MAP[status] ?? status;
}

function getStatusStyle(status?: string | null) {
  if (!status) return "bg-white/15 text-white/80 border border-white/20";
  return STATUS_STYLE_MAP[status] ?? "bg-white/15 text-white/80 border border-white/20";
}

function getPrimaryOutput(item: CreationItem) {
  const [first] = item.outputs;
  if (!first) return null;
  return first.url ?? first.thumbUrl ?? null;
}

type ApiResponse = {
  success: boolean;
  data?: {
    items: CreationItem[];
    totalCount: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
  error?: string;
};

type MyCreationsContentProps = {
  initialItems: CreationItem[];
  totalCount: number;
  pageSize: number;
  isAuthenticated: boolean;
};

export function MyCreationsContent({
  initialItems,
  totalCount,
  pageSize,
  isAuthenticated,
}: MyCreationsContentProps) {
  const [items, setItems] = useState<CreationItem[]>(initialItems);
  const [page, setPage] = useState(0);
  const [currentTotal, setCurrentTotal] = useState(totalCount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasMore = useMemo(() => items.length < currentTotal, [items.length, currentTotal]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setError(null);

    try {
      const nextPage = page + 1;
      const response = await fetch(`/api/ai/my-creations?page=${nextPage}&pageSize=${pageSize}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? response.statusText);
      }

      const nextItems = result.data?.items ?? [];
      const nextTotalCount = result.data?.totalCount ?? currentTotal;

      setItems((prev) => [...prev, ...nextItems]);
      setPage(nextPage);
      setCurrentTotal(nextTotalCount);
    } catch (err: any) {
      console.error("[my-creations] load more failed", err);
      setError(err?.message ?? "加载失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading, page, pageSize, currentTotal]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center space-y-4">
          <h3 className="text-xl font-semibold text-white">登录后即可查看你的创作</h3>
          <p className="text-sm text-white/70">请先登录账号，再返回此页面查看历史生成记录。</p>
          <Button asChild variant="secondary">
            <Link href="/login">立即登录</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center space-y-3">
          <h3 className="text-xl font-semibold text-white">暂无作品</h3>
          <p className="text-sm text-white/70">
            快去尝试 <Link href="/text-to-image" className="underline hover:text-white">文字转图</Link> 或其他模型，生成你的第一幅作品吧。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {items.map((item) => {
          const previewUrl = getPrimaryOutput(item);
          const status = item.status ?? undefined;
          const statusLabel = getStatusLabel(status);
          const statusBadgeClass = getStatusStyle(status);
          const isInProgress = status === "queued" || status === "pending" || status === "processing";
          const isError = status === "failed" || status === "cancelled" || status === "cancelled_insufficient_credits";

          return (
            <div
              key={item.jobId}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm"
            >
              <div className="relative aspect-square overflow-hidden">
                <div className="absolute left-3 top-3 z-10">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium leading-none",
                      statusBadgeClass
                    )}
                  >
                    {statusLabel}
                  </span>
                </div>
                {previewUrl ? (
                  <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                    <Image
                      src={previewUrl}
                      alt="生成结果"
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 18vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      priority={false}
                    />
                  </a>
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-white/10 to-white/5">
                    {isInProgress ? (
                      <>
                        <span className="block h-8 w-8 animate-spin rounded-full border-2 border-white/40 border-t-white/80" />
                        <span className="mt-3 text-[13px] text-white/70">{statusLabel}</span>
                      </>
                    ) : (
                      <span className={cn(
                        "rounded-md px-3 py-1 text-sm",
                        isError ? "bg-rose-500/15 text-rose-100" : "bg-white/15 text-white/80"
                      )}>
                        {statusLabel}
                      </span>
                    )}
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col items-center gap-3">
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        {hasMore ? (
          <Button onClick={loadMore} disabled={loading} variant="outline" className="w-40 border-white/20 text-white">
            {loading ? "加载中..." : "加载更多"}
          </Button>
        ) : (
          <p className="text-sm text-white/50">没有更多内容啦</p>
        )}
      </div>

      {loading && hasMore && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[320px] rounded-2xl bg-white/10" />
          ))}
        </div>
      )}
    </div>
  );
}

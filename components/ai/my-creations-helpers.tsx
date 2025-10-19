"use client";

import type { CreationItem, CreationOutput } from "@/lib/ai/creations";

type StatusMap = Record<string, string>;

export const STATUS_TEXT_MAP: StatusMap = {
  pending: "生成中",
  queued: "生成中",
  processing: "生成中",
  running: "生成中",
  in_progress: "生成中",
  completed: "已完成",
  failed: "生成失败",
  cancelled: "已取消",
  cancelled_insufficient_credits: "积分不足",
};

export function isVideoOutput(output?: CreationOutput | null) {
  if (!output) return false;

  const mimeType = output.type?.toLowerCase() ?? "";
  if (mimeType.startsWith("video")) {
    return true;
  }

  const url = output.url?.toLowerCase() ?? "";
  return /(\.mp4|\.webm|\.mov)(\?.*)?$/.test(url);
}

export function getEffectiveStatus(item: CreationItem) {
  const candidate = item.latestStatus ?? item.status;
  return typeof candidate === "string" ? candidate.toLowerCase() : null;
}

const PROCESSING_STATUSES = new Set<string>(["pending", "queued", "processing", "running", "in_progress"]);

export function isProcessingStatus(status?: string | null) {
  if (!status) {
    return false;
  }
  return PROCESSING_STATUSES.has(status.toLowerCase());
}

export function getStatusLabel(status?: string | null) {
  if (!status) return "未知状态";
  const normalized = status.toLowerCase();
  return STATUS_TEXT_MAP[normalized] ?? status;
}

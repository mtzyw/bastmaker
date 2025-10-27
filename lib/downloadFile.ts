import { generateUserPresignedDownloadUrl } from "@/actions/r2-resources";
import { toast } from "sonner";

const DOWNLOAD_PROXY_ENDPOINT = process.env.NEXT_PUBLIC_DOWNLOAD_PROXY_URL
  ? process.env.NEXT_PUBLIC_DOWNLOAD_PROXY_URL.replace(/\/$/, "")
  : undefined;

function triggerDownloadHref(url: string, fileName?: string) {
  const link = document.createElement("a");
  link.href = url;
  if (fileName) {
    link.download = fileName;
  }
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export const downloadBase64File = (base64Data: string, fileName: string) => {
  const base64WithoutPrefix = base64Data.includes("base64,")
    ? base64Data.substring(base64Data.indexOf("base64,") + 7)
    : base64Data;

  const byteCharacters = atob(base64WithoutPrefix);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);

    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, { type: "application/octet-stream" });

  const url = window.URL.createObjectURL(blob);

  triggerDownloadHref(url, fileName);
  window.URL.revokeObjectURL(url);
};

async function downloadUrl(url: string, fileName: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    triggerDownloadHref(blobUrl, fileName);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error("Download failed, falling back to opening in a new tab:", error);
    window.open(url, "_blank");
  }
}

export const downloadFile = async (fullPath: string, fileName: string) => {
  try {
    const { pathname } = new URL(fullPath);
    const key = pathname.startsWith("/") ? pathname.slice(1) : pathname;
    const res = await generateUserPresignedDownloadUrl({ key });

    if (!res.success || !res.data?.presignedUrl) {
      toast.error(res.error || "Failed to get download link.");
      return false;
    }

    await downloadUrl(res.data.presignedUrl, fileName);
    return true;
  } catch (error: any) {
    toast.error(error.message || "An unknown error occurred during download.");
    console.error("Download failed:", error);
    return false;
  }
};

function buildProxyDownloadUrl(
  targetUrl: string,
  fileName: string,
  extras?: Record<string, string | null | undefined>
) {
  if (!DOWNLOAD_PROXY_ENDPOINT) {
    return null;
  }

  const trimmedTarget = targetUrl.trim();
  if (!trimmedTarget) {
    return null;
  }

  const params = new URLSearchParams({
    url: trimmedTarget,
    filename: fileName,
  });

  if (extras) {
    Object.entries(extras).forEach(([key, value]) => {
      if (typeof value === "string" && value.length > 0) {
        params.set(key, value);
      }
    });
  }

  return `${DOWNLOAD_PROXY_ENDPOINT}/download?${params.toString()}`;
}

export async function downloadViaProxy(
  targetUrl: string,
  fileName: string,
  extras?: Record<string, string | null | undefined>
) {
  const trimmedTarget = targetUrl.trim();
  if (!trimmedTarget) {
    toast.error("下载链接无效");
    return false;
  }

  const proxyUrl = buildProxyDownloadUrl(trimmedTarget, fileName, extras);
  if (!proxyUrl) {
    triggerDownloadHref(trimmedTarget, fileName);
    return true;
  }

  try {
    await downloadUrl(proxyUrl, fileName);
    return true;
  } catch (error) {
    console.error("[downloadViaProxy] proxy download failed, falling back to direct link", error);
    triggerDownloadHref(trimmedTarget, fileName);
    return false;
  }
}

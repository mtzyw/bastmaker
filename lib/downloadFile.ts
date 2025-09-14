import { generateUserPresignedDownloadUrl } from "@/actions/r2-resources";
import { toast } from "sonner";

export const downloadBase64File = (base64Data: string, fileName: string) => {
  const base64WithoutPrefix = base64Data.includes('base64,')
    ? base64Data.substring(base64Data.indexOf('base64,') + 7)
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

  const blob = new Blob(byteArrays, { type: 'application/octet-stream' });

  const url = window.URL.createObjectURL(blob);

  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = fileName;

  document.body.appendChild(downloadLink);
  downloadLink.click();

  document.body.removeChild(downloadLink);
  window.URL.revokeObjectURL(url);
}

async function downloadUrl(url: string, fileName: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName;
    a.target = '_blank';

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error(
      "Download failed, falling back to opening in a new tab:",
      error
    );
    window.open(url, "_blank");
  }
}

export const downloadFile = async (fullPath: string, fileName: string) => {
  try {
    const { pathname } = new URL(fullPath);
    const key = pathname.startsWith('/') ? pathname.slice(1) : pathname;
    const res = await generateUserPresignedDownloadUrl({ key });

    if (!res.success || !res.data?.presignedUrl) {
      toast.error(res.error || "Failed to get download link.");
      return;
    }

    await downloadUrl(res.data.presignedUrl, fileName);
  } catch (error: any) {
    toast.error(error.message || "An unknown error occurred during download.");
    console.error("Download failed:", error);
  }
};
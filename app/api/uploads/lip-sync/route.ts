import { apiResponse } from "@/lib/api-response";
import { generateR2Key, serverUploadFile } from "@/lib/cloudflare/r2";
import { createClient } from "@/lib/supabase/server";
import { Buffer } from "buffer";
import { NextRequest } from "next/server";

type UploadKind = "video" | "audio";

const ALLOWED_KINDS = new Set<UploadKind>(["video", "audio"]);

const MAX_FILE_SIZE_MB: Record<UploadKind, number> = {
  video: 200,
  audio: 40,
};

function resolveKind(input: FormDataEntryValue | null): UploadKind {
  if (typeof input !== "string") {
    return "video";
  }
  return ALLOWED_KINDS.has(input as UploadKind) ? (input as UploadKind) : "video";
}

function inferExtension(contentType: string, fallback: string): string {
  const type = contentType.toLowerCase();
  if (type.includes("mp4")) return "mp4";
  if (type.includes("mov")) return "mov";
  if (type.includes("webm")) return "webm";
  if (type.includes("wav")) return "wav";
  if (type.includes("mpeg")) return "mp3";
  if (type.includes("mp3")) return "mp3";
  if (type.includes("aac")) return "aac";
  if (type.includes("flac")) return "flac";
  return fallback;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return apiResponse.unauthorized();
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (error) {
    console.error("[lip-sync-upload] failed to parse form data", error);
    return apiResponse.badRequest("Invalid form data");
  }

  const filePart = formData.get("file");
  if (!(filePart instanceof Blob) || filePart.size === 0) {
    return apiResponse.badRequest("Missing uploaded file");
  }

  const kind = resolveKind(formData.get("kind"));

  const maxSize = MAX_FILE_SIZE_MB[kind] ?? 200;
  if (filePart.size > maxSize * 1024 * 1024) {
    return apiResponse.badRequest(
      kind === "video"
        ? `视频文件过大，请上传不超过 ${maxSize}MB 的文件`
        : `音频文件过大，请上传不超过 ${maxSize}MB 的文件`,
    );
  }

  const contentType =
    filePart.type || (kind === "video" ? "video/mp4" : "audio/mpeg");
  const extension = inferExtension(
    contentType,
    kind === "video" ? "mp4" : "mp3",
  );

  const key = generateR2Key({
    fileName: `${kind}-${Date.now()}.${extension}`,
    path: kind === "video" ? "lip-sync/videos" : "lip-sync/audios",
  });

  try {
    const arrayBuffer = await filePart.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await serverUploadFile({
      data: buffer,
      contentType,
      key,
    });

    return apiResponse.success({
      url: uploadResult.url,
      key: uploadResult.key,
      kind,
      size: filePart.size,
      contentType,
    });
  } catch (error) {
    console.error("[lip-sync-upload] failed to upload to R2", error);
    return apiResponse.serverError("文件上传失败，请稍后重试");
  }
}

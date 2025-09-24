import { apiResponse } from "@/lib/api-response";
import { generateR2Key, serverUploadFile } from "@/lib/cloudflare/r2";
import { createClient } from "@/lib/supabase/server";
import { Buffer } from "buffer";
import { NextRequest } from "next/server";

type UploadKind = "primary" | "intro" | "outro" | "tail";

const ALLOWED_KINDS = new Set<UploadKind>(["primary", "intro", "outro", "tail"]);

function resolveKind(input: FormDataEntryValue | null): UploadKind {
  if (typeof input !== "string") {
    return "primary";
  }

  return ALLOWED_KINDS.has(input as UploadKind) ? (input as UploadKind) : "primary";
}

function inferExtension(contentType: string): string {
  const type = contentType.toLowerCase();
  if (type.includes("png")) return "png";
  if (type.includes("jpeg") || type.includes("jpg")) return "jpg";
  if (type.includes("webp")) return "webp";
  if (type.includes("gif")) return "gif";
  return "png";
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
    console.error("[image-to-video-upload] failed to parse form data", error);
    return apiResponse.badRequest("Invalid form data");
  }

  const filePart = formData.get("file");
  if (!(filePart instanceof Blob) || filePart.size === 0) {
    return apiResponse.badRequest("Missing uploaded file");
  }

  const kind = resolveKind(formData.get("kind"));

  if (filePart.size > 25 * 1024 * 1024) {
    return apiResponse.badRequest("图片过大，请上传不超过 25MB 的文件");
  }

  const contentType = filePart.type || "image/png";
  const extension = inferExtension(contentType);

  const key = generateR2Key({
    fileName: `${kind}-${Date.now()}.${extension}`,
    path: "image-to-videos",
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
    });
  } catch (error) {
    console.error("[image-to-video-upload] failed to upload to R2", error);
    return apiResponse.serverError("图片上传失败，请稍后重试");
  }
}

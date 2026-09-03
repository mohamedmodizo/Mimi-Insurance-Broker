import path from "node:path";
import { buildStoredName, sha256, storeAttachmentBytes } from "@/lib/attachmentStorage";

const allowedTypes = new Map<string, string[]>([
  ["image/jpeg", [".jpg", ".jpeg"]],
  ["image/png", [".png"]],
  ["image/webp", [".webp"]],
  ["video/mp4", [".mp4"]],
  ["application/pdf", [".pdf"]],
  ["application/msword", [".doc"]],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", [".docx"]]
]);

const maxBytes = 20 * 1024 * 1024;

export type StoredUpload = {
  originalName: string;
  storedName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  storagePath: string;
  category: string;
};

export async function validateAndStoreUpload(
  file: File,
  category: string,
  brokerId: string,
  uploadSessionId: string
): Promise<StoredUpload> {
  const originalName = file.name || "upload";
  const mimeType = file.type || "application/octet-stream";
  const extension = path.extname(originalName).toLowerCase();
  const allowedExtensions = allowedTypes.get(mimeType);

  if (!allowedExtensions || !allowedExtensions.includes(extension)) {
    throw new Error("This file type is not allowed. Please upload photos, videos, PDFs, or Word documents.");
  }

  if (originalName.replace(extension, "").includes(".")) {
    throw new Error("Files with double extensions are not accepted for security reasons.");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.byteLength > maxBytes) {
    throw new Error("The file is too large. The current limit is 20 MB per file.");
  }

  const storedName = buildStoredName(originalName);
  const storagePath = await storeAttachmentBytes({
    bytes,
    mimeType,
    storedName,
    brokerId,
    uploadSessionId
  });

  return {
    originalName,
    storedName,
    mimeType,
    sizeBytes: bytes.byteLength,
    sha256: sha256(bytes),
    storagePath,
    category
  };
}

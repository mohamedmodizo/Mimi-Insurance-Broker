import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { get, put } from "@vercel/blob";
import { getUploadStorageRoot } from "@/lib/storagePaths";

const blobPrefix = "vercel-blob:";
const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

export type StoredAttachmentContent = {
  body: BodyInit;
  etag?: string;
};

export function buildStoredName(originalName: string): string {
  const extension = path.extname(originalName).toLowerCase();
  return `${Date.now()}-${randomBytes(8).toString("hex")}${extension}`;
}

export function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export async function storeAttachmentBytes(input: {
  bytes: Buffer;
  mimeType: string;
  storedName: string;
  brokerId: string;
  uploadSessionId: string;
}): Promise<string> {
  if (blobToken) {
    const pathname = ["insurance-portal", input.brokerId, input.uploadSessionId, input.storedName].join("/");
    const blob = await put(pathname, input.bytes, {
      access: "private",
      addRandomSuffix: false,
      contentType: input.mimeType,
      token: blobToken
    });
    return `${blobPrefix}${blob.pathname}`;
  }

  const uploadDirectory = getUploadStorageRoot();
  await mkdir(uploadDirectory, { recursive: true });
  const storagePath = path.join(uploadDirectory, input.storedName);
  await writeFile(storagePath, input.bytes, { flag: "wx" });
  return storagePath;
}

export async function readAttachmentContent(storagePath: string): Promise<StoredAttachmentContent> {
  if (storagePath.startsWith(blobPrefix)) {
    if (!blobToken) {
      throw new Error("Blob storage is not configured.");
    }

    const pathname = storagePath.slice(blobPrefix.length);
    const result = await get(pathname, { access: "private", token: blobToken });
    if (!result || result.statusCode !== 200) {
      throw new Error("Attachment file was not found.");
    }

    return {
      body: result.stream,
      etag: result.blob.etag
    };
  }

  const storageRoot = getUploadStorageRoot();
  const filePath = path.resolve(storagePath);
  if (!filePath.startsWith(storageRoot)) {
    throw new Error("Attachment storage path is invalid.");
  }

  return { body: await readFile(filePath) };
}

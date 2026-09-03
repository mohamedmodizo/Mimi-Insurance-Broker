import path from "node:path";

const defaultUploadStorageRoot = path.join(process.cwd(), "work", "storage", "uploads");

export function getUploadStorageRoot(): string {
  const configuredRoot = process.env.UPLOAD_STORAGE_DIR;
  return configuredRoot ? path.resolve(/* turbopackIgnore: true */ configuredRoot) : defaultUploadStorageRoot;
}

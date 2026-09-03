import { NextRequest } from "next/server";
import { validatePortalToken } from "@/lib/portalAccess";
import { prisma } from "@/lib/prisma";
import { validateAndStoreUpload } from "@/lib/uploadSecurity";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const token = String(formData.get("token") ?? "");
  const uploadSessionId = String(formData.get("uploadSessionId") ?? "");
  const category = String(formData.get("category") ?? "Supporting evidence");
  const accessLink = await validatePortalToken(token);

  if (!accessLink) {
    return Response.json({ error: "This portal link is invalid or expired." }, { status: 401 });
  }

  if (!uploadSessionId || uploadSessionId.length < 8) {
    return Response.json({ error: "Upload session is missing." }, { status: 400 });
  }

  const files = formData.getAll("files").filter((item): item is File => item instanceof File);
  if (files.length === 0) {
    return Response.json({ error: "No files were received." }, { status: 400 });
  }

  try {
    const records = [];
    for (const file of files) {
      const stored = await validateAndStoreUpload(file, category, accessLink.brokerId, uploadSessionId);
      const attachment = await prisma.attachment.create({
        data: {
          brokerId: accessLink.brokerId,
          clientId: accessLink.clientId,
          uploadSessionId,
          originalName: stored.originalName,
          storedName: stored.storedName,
          mimeType: stored.mimeType,
          sizeBytes: stored.sizeBytes,
          sha256: stored.sha256,
          category: stored.category,
          status: "RECEIVED",
          storagePath: stored.storagePath,
          uploadedByClient: true
        }
      });
      records.push({
        id: attachment.id,
        name: attachment.originalName,
        sizeBytes: attachment.sizeBytes,
        category: attachment.category
      });
    }

    return Response.json({ attachments: records });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Upload failed." }, { status: 400 });
  }
}

import { NextRequest } from "next/server";
import { requireBrokerApiContext } from "@/lib/authz";
import { readAttachmentContent } from "@/lib/attachmentStorage";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { context, error } = await requireBrokerApiContext();
  if (error) return error;
  const { id } = await params;

  const attachment = await prisma.attachment.findFirst({
    where: {
      id,
      case: { brokerId: context.brokerId }
    }
  });

  if (!attachment) return Response.json({ error: "Attachment not found." }, { status: 404 });

  let content;
  try {
    content = await readAttachmentContent(attachment.storagePath);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Attachment file is unavailable." }, { status: 404 });
  }

  const headers: Record<string, string> = {
    "Content-Type": attachment.mimeType,
    "Content-Disposition": `attachment; filename="${attachment.originalName.replace(/"/g, "")}"`,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff"
  };
  if (content.etag) headers.ETag = content.etag;

  return new Response(content.body, {
    headers: {
      ...headers
    }
  });
}

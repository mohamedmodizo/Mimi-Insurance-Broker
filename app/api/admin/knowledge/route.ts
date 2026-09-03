import { NextRequest } from "next/server";
import { z } from "zod";
import { requireBrokerApiContext } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

const documentSchema = z.object({
  title: z.string().min(3),
  category: z.string().min(2),
  content: z.string().min(10),
  insurerId: z.string().optional().nullable(),
  tags: z.array(z.string()).default([])
});

export async function GET() {
  const { context, error } = await requireBrokerApiContext();
  if (error) return error;

  const [documents, insurers] = await Promise.all([
    prisma.knowledgeDocument.findMany({
      where: { brokerId: context.brokerId },
      include: { insurer: true },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.insurer.findMany({ where: { brokerId: context.brokerId }, orderBy: { name: "asc" } })
  ]);

  return Response.json({ documents, insurers });
}

export async function POST(request: NextRequest) {
  const { context, error } = await requireBrokerApiContext();
  if (error) return error;

  const parsed = documentSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "Check the knowledge base document fields." }, { status: 400 });
  }

  const document = await prisma.knowledgeDocument.create({
    data: {
      brokerId: context.brokerId,
      title: parsed.data.title,
      category: parsed.data.category,
      content: parsed.data.content,
      insurerId: parsed.data.insurerId || undefined,
      tagsJson: JSON.stringify(parsed.data.tags),
      status: "APPROVED"
    }
  });

  return Response.json({ document }, { status: 201 });
}

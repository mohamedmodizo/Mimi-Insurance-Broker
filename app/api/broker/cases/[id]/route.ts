import { CaseStatus, TaskStatus } from "@prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";
import { addAuditLog } from "@/lib/audit";
import { requireBrokerApiContext } from "@/lib/authz";
import { getCaseDetail } from "@/lib/caseQueries";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  status: z.nativeEnum(CaseStatus).optional(),
  note: z.string().max(3000).optional(),
  taskUpdates: z.array(z.object({ id: z.string(), status: z.nativeEnum(TaskStatus) })).optional()
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { context, error } = await requireBrokerApiContext();
  if (error) return error;
  const { id } = await params;

  const detail = await getCaseDetail(context.brokerId, id);
  if (!detail) return Response.json({ error: "Case not found." }, { status: 404 });

  return Response.json({ case: detail });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { context, error } = await requireBrokerApiContext();
  if (error) return error;
  const { id } = await params;
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid update." }, { status: 400 });
  }

  const serviceCase = await prisma.serviceCase.findFirst({ where: { id, brokerId: context.brokerId } });
  if (!serviceCase) return Response.json({ error: "Case not found." }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    if (parsed.data.status) {
      await tx.serviceCase.update({
        where: { id },
        data: {
          status: parsed.data.status,
          completedAt: ["COMPLETED", "CLOSED"].includes(parsed.data.status) ? new Date() : null
        }
      });
    }

    if (parsed.data.note?.trim()) {
      await tx.brokerNote.create({
        data: {
          caseId: id,
          authorId: context.user.id,
          body: parsed.data.note.trim()
        }
      });
    }

    if (parsed.data.taskUpdates?.length) {
      for (const task of parsed.data.taskUpdates) {
        await tx.task.updateMany({
          where: { id: task.id, caseId: id },
          data: {
            status: task.status,
            completedAt: task.status === "DONE" ? new Date() : null
          }
        });
      }
    }
  });

  await addAuditLog({
    caseId: id,
    actorUserId: context.user.id,
    actorType: context.user.role,
    action: "Broker updated case",
    details: parsed.data
  });

  const detail = await getCaseDetail(context.brokerId, id);
  return Response.json({ case: detail });
}

import { prisma } from "@/lib/prisma";
import { stringifyJson } from "@/lib/json";

export async function addAuditLog(input: {
  caseId?: string;
  actorUserId?: string;
  actorType: "CLIENT" | "AI" | "BROKER" | "SYSTEM" | "STAFF" | "ADMIN";
  action: string;
  details?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  return prisma.auditLog.create({
    data: {
      caseId: input.caseId,
      actorUserId: input.actorUserId,
      actorType: input.actorType,
      action: input.action,
      detailsJson: stringifyJson(input.details ?? {}),
      ipAddress: input.ipAddress ?? undefined,
      userAgent: input.userAgent ?? undefined
    }
  });
}

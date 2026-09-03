import { ClaimType, RequestType } from "@prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";
import { createServiceCase } from "@/lib/caseService";
import { officeHoursMessage } from "@/lib/config";
import { getCaseDetail } from "@/lib/caseQueries";
import { validatePortalToken } from "@/lib/portalAccess";
import { prisma } from "@/lib/prisma";

const createCaseSchema = z.object({
  token: z.string().min(12),
  requestType: z.nativeEnum(RequestType),
  claimType: z.nativeEnum(ClaimType).optional(),
  client: z.object({
    fullName: z.string().min(2),
    phone: z.string().min(5),
    email: z.string().email().optional().or(z.literal("")),
    nationalId: z.string().optional(),
    customerNumber: z.string().optional(),
    policyNumber: z.string().optional(),
    insuranceCompany: z.string().optional(),
    communicationPreference: z.string().optional()
  }),
  answers: z.record(z.string(), z.unknown()),
  uploadedAttachmentIds: z.array(z.string()).default([]),
  conversation: z.array(
    z.object({
      senderRole: z.enum(["CLIENT", "AI", "SYSTEM"]),
      content: z.string().min(1)
    })
  ),
  clientRequest: z.string().optional()
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createCaseSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Please check the required information.", details: parsed.error.flatten() }, { status: 400 });
  }

  const accessLink = await validatePortalToken(parsed.data.token);
  if (!accessLink) {
    return Response.json({ error: "This portal link is invalid or expired." }, { status: 401 });
  }

  const serviceCase = await createServiceCase({
    brokerId: accessLink.brokerId,
    tokenId: accessLink.id,
    ...parsed.data,
    client: {
      ...parsed.data.client,
      email: parsed.data.client.email || undefined
    }
  });

  return Response.json({
    reference: serviceCase.reference,
    caseId: serviceCase.id,
    status: serviceCase.status,
    priority: serviceCase.priority,
    missingInfo: JSON.parse(serviceCase.missingInfoJson) as string[],
    confirmationMessage: officeHoursMessage(serviceCase.afterHours),
    documentsReceived: serviceCase.attachments.length
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token") ?? "";
  const reference = searchParams.get("reference") ?? "";
  const phoneOrEmail = searchParams.get("identity") ?? "";

  const accessLink = await validatePortalToken(token);
  if (!accessLink) {
    return Response.json({ error: "This portal link is invalid or expired." }, { status: 401 });
  }

  const serviceCase = await prisma.serviceCase.findFirst({
    where: {
      brokerId: accessLink.brokerId,
      reference,
      OR: [{ client: { phone: phoneOrEmail } }, { client: { email: phoneOrEmail } }]
    }
  });

  if (!serviceCase) {
    return Response.json({ error: "No matching request was found. Check the reference and contact detail." }, { status: 404 });
  }

  const detail = await getCaseDetail(accessLink.brokerId, serviceCase.id);
  return Response.json({
    reference: detail?.reference,
    title: detail?.title,
    status: detail?.status,
    priority: detail?.priority,
    createdAt: detail?.createdAt,
    documents: detail?.attachments.map((attachment) => ({
      name: attachment.originalName,
      category: attachment.category,
      receivedAt: attachment.createdAt
    })),
    tasksRequiringClient: detail?.tasks.filter((task) => task.title.toLowerCase().includes("missing"))
  });
}

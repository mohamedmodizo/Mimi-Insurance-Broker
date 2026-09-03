import {
  AttachmentStatus,
  CaseStatus,
  ClaimType,
  NotificationChannel,
  NotificationStatus,
  Priority,
  RequestType
} from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { addAuditLog } from "@/lib/audit";
import { getEssentialMissingInfo } from "@/lib/claimQuestions";
import { getOfficeHours, isWithinOfficeHours } from "@/lib/config";
import { parseJson, stringifyJson } from "@/lib/json";
import { prisma } from "@/lib/prisma";
import { generateReference } from "@/lib/reference";
import { buildBrokerSummary } from "@/lib/summary";
import { buildTasks } from "@/lib/taskExtraction";

export type ClientIdentityInput = {
  fullName: string;
  phone: string;
  email?: string;
  nationalId?: string;
  customerNumber?: string;
  policyNumber?: string;
  insuranceCompany?: string;
  communicationPreference?: string;
};

export type ConversationMessageInput = {
  senderRole: "CLIENT" | "AI" | "SYSTEM";
  content: string;
};

export type CreateCaseInput = {
  brokerId: string;
  tokenId?: string;
  requestType: RequestType;
  claimType?: ClaimType;
  client: ClientIdentityInput;
  answers: Record<string, unknown>;
  uploadedAttachmentIds: string[];
  conversation: ConversationMessageInput[];
  clientRequest?: string;
};

export async function createServiceCase(input: CreateCaseInput) {
  const broker = await prisma.broker.findUnique({
    where: { id: input.brokerId },
    include: {
      user: true,
      insurers: true,
      communicationPreferences: true
    }
  });

  if (!broker) {
    throw new Error("Broker profile not found.");
  }

  const afterHours = !isWithinOfficeHours(broker);
  const matchedInsurer = await matchInsurer(input.brokerId, input.client.insuranceCompany);
  const attachmentCount = input.uploadedAttachmentIds.length;
  const missingInfo =
    input.requestType === "CLAIM" && input.claimType
      ? getEssentialMissingInfo(input.claimType, input.client, input.answers, attachmentCount)
      : getGenericMissingInfo(input);
  const priority = determinePriority(input, missingInfo, afterHours);
  const status = priority === "URGENT" ? "URGENT" : "AWAITING_BROKER_REVIEW";
  const submittedAt = new Date();
  const reference = await getUniqueReference(input.requestType);
  const attachmentRecords = await prisma.attachment.findMany({
    where: { id: { in: input.uploadedAttachmentIds } }
  });
  const attachmentLabels = attachmentRecords.map((attachment) => attachment.originalName);

  const aiSummary = buildBrokerSummary({
    clientName: input.client.fullName,
    requestType: input.requestType,
    claimType: input.claimType,
    submittedAt,
    answers: input.answers,
    attachmentLabels,
    missingInfo,
    priority,
    clientRequest: input.clientRequest
  });

  const tasks = buildTasks({
    requestType: input.requestType,
    claimType: input.claimType,
    missingInfo,
    attachmentCount,
    priority
  });

  const result = await prisma.$transaction(async (tx) => {
    const client = await findOrCreateClient(tx, input.brokerId, input.client);
    const policy = await findOrCreatePolicy(tx, {
      brokerId: input.brokerId,
      clientId: client.id,
      insurerId: matchedInsurer?.id,
      policyNumber: input.client.policyNumber,
      insuranceType: input.claimType ?? input.answers.insuranceType,
      productName: inferProductName(input)
    });

    const serviceCase = await tx.serviceCase.create({
      data: {
        reference,
        brokerId: input.brokerId,
        clientId: client.id,
        policyId: policy?.id,
        insurerId: matchedInsurer?.id,
        requestType: input.requestType,
        claimType: input.claimType,
        title: buildCaseTitle(input),
        description: String(input.answers.eventDescription ?? input.clientRequest ?? "Client assistance request"),
        priority,
        status,
        aiSummary,
        missingInfoJson: stringifyJson(missingInfo),
        submittedFormDataJson: stringifyJson({ client: input.client, answers: input.answers }),
        afterHours
      }
    });

    if (input.requestType === "CLAIM" && input.claimType) {
      await tx.claim.create({
        data: {
          caseId: serviceCase.id,
          claimType: input.claimType,
          incidentDate: toDate(input.answers.incidentDate),
          incidentLocation: toOptionalString(input.answers.incidentLocation),
          eventDescription: String(input.answers.eventDescription ?? ""),
          involvedSubject: toOptionalString(input.answers.involvedSubject),
          injuriesReported: toOptionalBoolean(input.answers.injuriesReported),
          emergencyServices: toOptionalBoolean(input.answers.emergencyServices),
          policeContacted: toOptionalBoolean(input.answers.policeContacted),
          policeReference: toOptionalString(input.answers.policeReference),
          thirdPartiesInvolved: toOptionalBoolean(input.answers.thirdPartiesInvolved),
          thirdPartyDetailsJson: stringifyJson(input.answers.thirdPartyDetails ?? []),
          estimatedDamage: toOptionalString(input.answers.estimatedDamage),
          dynamicAnswersJson: stringifyJson(input.answers)
        }
      });
    }

    await tx.attachment.updateMany({
      where: { id: { in: input.uploadedAttachmentIds } },
      data: {
        caseId: serviceCase.id,
        clientId: client.id,
        brokerId: input.brokerId,
        status: AttachmentStatus.VALIDATED
      }
    });

    const conversation = await tx.conversation.create({
      data: {
        caseId: serviceCase.id,
        clientId: client.id,
        endedAt: submittedAt,
        aiSummary,
        messages: {
          create: input.conversation.map((message) => ({
            senderRole: message.senderRole,
            content: message.content
          }))
        }
      }
    });

    await tx.message.create({
      data: {
        conversationId: conversation.id,
        senderRole: "SYSTEM",
        content: `Case ${reference} created. Priority ${priority}. Status ${status}.`
      }
    });

    await tx.task.createMany({
      data: tasks.map((task) => ({
        caseId: serviceCase.id,
        title: task.title,
        detail: task.detail,
        priority: task.priority
      }))
    });

    await tx.notification.createMany({
      data: buildNotifications({
        brokerEmail: broker.user.email,
        client,
        serviceCase,
        priority,
        attachmentCount,
        afterHours,
        brokerPreferences: broker.communicationPreferences
      })
    });

    if (input.tokenId) {
      await tx.clientAccessLink.update({
        where: { id: input.tokenId },
        data: { usedAt: submittedAt, clientId: client.id }
      });
    }

    await tx.auditLog.createMany({
      data: [
        {
          caseId: serviceCase.id,
          actorType: "CLIENT",
          action: "Client opened portal and submitted request",
          detailsJson: stringifyJson({ requestType: input.requestType, claimType: input.claimType })
        },
        {
          caseId: serviceCase.id,
          actorType: "AI",
          action: "AI generated broker summary",
          detailsJson: stringifyJson({ missingInfo, taskCount: tasks.length })
        },
        {
          caseId: serviceCase.id,
          actorType: "SYSTEM",
          action: "Broker notifications queued",
          detailsJson: stringifyJson({ afterHours, priority, officeHours: getOfficeHours(broker) })
        }
      ]
    });

    return tx.serviceCase.findUniqueOrThrow({
      where: { id: serviceCase.id },
      include: {
        client: true,
        insurer: true,
        attachments: true,
        tasks: true,
        conversations: { include: { messages: true } },
        notifications: true,
        auditLogs: { orderBy: { createdAt: "asc" } }
      }
    });
  });

  return result;
}

export async function createQuestionFollowUp(input: {
  brokerId: string;
  client: Partial<ClientIdentityInput>;
  question: string;
  answer: string;
}) {
  const broker = await prisma.broker.findUnique({ where: { id: input.brokerId }, include: { user: true } });
  if (!broker) throw new Error("Broker profile not found.");

  const reference = await getUniqueReference("POLICY_QUESTION");
  const client = await prisma.client.create({
    data: {
      brokerId: input.brokerId,
      fullName: input.client.fullName || "Unidentified client",
      phone: input.client.phone || "Not provided",
      email: input.client.email,
      nationalId: input.client.nationalId,
      customerNumber: input.client.customerNumber
    }
  });

  const aiSummary = buildBrokerSummary({
    clientName: client.fullName,
    requestType: "POLICY_QUESTION",
    submittedAt: new Date(),
    answers: { question: input.question, assistantAnswer: input.answer },
    attachmentLabels: [],
    missingInfo: [],
    priority: "NORMAL",
    clientRequest: "Client asked a policy-specific or unapproved question requiring broker review."
  });

  const serviceCase = await prisma.serviceCase.create({
    data: {
      reference,
      brokerId: input.brokerId,
      clientId: client.id,
      requestType: "POLICY_QUESTION",
      title: "Policy question requiring broker confirmation",
      description: input.question,
      priority: "NORMAL",
      status: "AWAITING_BROKER_REVIEW",
      aiSummary,
      conversations: {
        create: {
          endedAt: new Date(),
          aiSummary,
          messages: {
            create: [
              { senderRole: "CLIENT", content: input.question },
              { senderRole: "AI", content: input.answer }
            ]
          }
        }
      },
      tasks: {
        create: {
          title: "Review and answer policy question",
          detail: "The assistant avoided giving a final coverage or policy decision. Review the client's question and respond.",
          priority: "NORMAL"
        }
      },
      notifications: {
        create: {
          channel: "IN_APP",
          recipient: broker.user.email,
          subject: `Policy question requires review: ${reference}`,
          body: input.question,
          status: "QUEUED"
        }
      }
    },
    include: {
      client: true,
      tasks: true
    }
  });

  await addAuditLog({
    caseId: serviceCase.id,
    actorType: "AI",
    action: "AI escalated policy question",
    details: { question: input.question }
  });

  return serviceCase;
}

async function getUniqueReference(requestType: RequestType): Promise<string> {
  for (let attempts = 0; attempts < 5; attempts += 1) {
    const reference = await generateReference(requestType);
    const exists = await prisma.serviceCase.findUnique({ where: { reference } });
    if (!exists) return reference;
  }
  throw new Error("Could not allocate a case reference.");
}

async function matchInsurer(brokerId: string, insurerName?: string) {
  if (!insurerName) return null;
  const insurers = await prisma.insurer.findMany({ where: { brokerId } });
  return (
    insurers.find((insurer) => insurer.name.toLowerCase() === insurerName.toLowerCase()) ??
    insurers.find((insurer) => insurer.name.toLowerCase().includes(insurerName.toLowerCase())) ??
    null
  );
}

async function findOrCreateClient(
  tx: Prisma.TransactionClient,
  brokerId: string,
  input: ClientIdentityInput
) {
  const existing = await tx.client.findFirst({
    where: {
      brokerId,
      OR: [
        { phone: input.phone },
        ...(input.email ? [{ email: input.email }] : []),
        ...(input.customerNumber ? [{ customerNumber: input.customerNumber }] : []),
        ...(input.nationalId ? [{ nationalId: input.nationalId }] : [])
      ]
    }
  });

  if (existing) {
    return tx.client.update({
      where: { id: existing.id },
      data: {
        fullName: input.fullName || existing.fullName,
        phone: input.phone || existing.phone,
        email: input.email || existing.email,
        nationalId: input.nationalId || existing.nationalId,
        customerNumber: input.customerNumber || existing.customerNumber,
        communicationPreference: input.communicationPreference || existing.communicationPreference
      }
    });
  }

  return tx.client.create({
    data: {
      brokerId,
      fullName: input.fullName,
      phone: input.phone,
      email: input.email,
      nationalId: input.nationalId,
      customerNumber: input.customerNumber,
      communicationPreference: input.communicationPreference || "SMS"
    }
  });
}

async function findOrCreatePolicy(
  tx: Prisma.TransactionClient,
  input: {
    brokerId: string;
    clientId: string;
    insurerId?: string | null;
    policyNumber?: string;
    insuranceType?: unknown;
    productName: string;
  }
) {
  if (!input.policyNumber && !input.insurerId) return null;

  const existing = input.policyNumber
    ? await tx.policy.findFirst({
        where: {
          brokerId: input.brokerId,
          policyNumber: input.policyNumber
        }
      })
    : null;

  if (existing) return existing;

  return tx.policy.create({
    data: {
      brokerId: input.brokerId,
      clientId: input.clientId,
      insurerId: input.insurerId ?? undefined,
      policyNumber: input.policyNumber,
      productName: input.productName,
      insuranceType: String(input.insuranceType ?? input.productName)
    }
  });
}

function buildNotifications(input: {
  brokerEmail: string;
  client: { email: string | null; phone: string; communicationPreference: string; fullName: string };
  serviceCase: { id: string; reference: string; title: string };
  priority: Priority;
  attachmentCount: number;
  afterHours: boolean;
  brokerPreferences: Array<{
    channel: NotificationChannel;
    enabled: boolean;
    urgentOnlyAfterHours: boolean;
    destination: string;
  }>;
}) {
  const brokerStatus =
    input.afterHours &&
    input.priority !== "URGENT" &&
    input.brokerPreferences.some((preference) => preference.urgentOnlyAfterHours)
      ? NotificationStatus.MUTED
      : NotificationStatus.QUEUED;

  const brokerDestinations = input.brokerPreferences.filter((preference) => preference.enabled);
  const brokerNotifications =
    brokerDestinations.length > 0
      ? brokerDestinations.map((preference) => ({
          caseId: input.serviceCase.id,
          channel: preference.channel,
          recipient: preference.destination,
          subject: `${input.priority === "URGENT" ? "Urgent case" : "New request"} received: ${input.serviceCase.reference}`,
          body: `${input.serviceCase.title}\nClient: ${input.client.fullName}\nDocuments: ${input.attachmentCount}\nCase: ${input.serviceCase.reference}`,
          status:
            input.afterHours && input.priority !== "URGENT" && preference.urgentOnlyAfterHours
              ? NotificationStatus.MUTED
              : brokerStatus
        }))
      : [
          {
            caseId: input.serviceCase.id,
            channel: NotificationChannel.EMAIL,
            recipient: input.brokerEmail,
            subject: `New request received: ${input.serviceCase.reference}`,
            body: `${input.serviceCase.title}\nClient: ${input.client.fullName}\nDocuments: ${input.attachmentCount}`,
            status: brokerStatus
          }
        ];

  const clientChannel =
    input.client.communicationPreference === "EMAIL" && input.client.email
      ? NotificationChannel.EMAIL
      : NotificationChannel.SMS;

  return [
    ...brokerNotifications,
    {
      caseId: input.serviceCase.id,
      channel: clientChannel,
      recipient: clientChannel === "EMAIL" ? input.client.email ?? input.client.phone : input.client.phone,
      subject: `Submission received: ${input.serviceCase.reference}`,
      body: `Your information has been received successfully.\nReference: ${input.serviceCase.reference}\nDocuments received: ${input.attachmentCount}\nYour broker will review your submission.`,
      status: NotificationStatus.QUEUED
    }
  ];
}

function determinePriority(input: CreateCaseInput, missingInfo: string[], afterHours: boolean): Priority {
  if (input.requestType === "EMERGENCY") return "URGENT";
  if (input.answers.medicalEmergency === true) return "URGENT";
  if (input.answers.injuriesReported === true && input.requestType === "CLAIM") return "HIGH";
  if (input.answers.thirdPartiesInvolved === true && input.claimType === "MOTOR") return "HIGH";
  if (input.requestType === "CLAIM" && afterHours) return "HIGH";
  if (missingInfo.length > 3) return "HIGH";
  return "NORMAL";
}

function getGenericMissingInfo(input: CreateCaseInput): string[] {
  const missing = [];
  if (!input.client.fullName) missing.push("Client full name");
  if (!input.client.phone) missing.push("Client phone number");
  if (!input.clientRequest && !input.answers.eventDescription && !input.answers.question) {
    missing.push("Description of assistance needed");
  }
  return missing;
}

function buildCaseTitle(input: CreateCaseInput): string {
  if (input.requestType === "CLAIM" && input.claimType) {
    return `${input.claimType.replace(/_/g, " ")} claim`;
  }
  return input.requestType.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function inferProductName(input: CreateCaseInput): string {
  if (input.claimType) return `${input.claimType.replace(/_/g, " ")} insurance`;
  return input.requestType.replace(/_/g, " ").toLowerCase();
}

function toDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function toOptionalString(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  return String(value);
}

function toOptionalBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

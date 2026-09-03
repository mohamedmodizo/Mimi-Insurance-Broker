import { CaseStatus, Priority, RequestType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/json";

export async function getDashboardSummary(brokerId: string) {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    newRequests,
    newClaims,
    urgentCases,
    documentsReceived,
    formsAwaitingReview,
    clientQuestions,
    callbacks,
    dueToday,
    overdue,
    recentlyCompleted,
    afterHoursRequests,
    questionsResolved,
    questionsEscalated,
    cases
  ] = await Promise.all([
    prisma.serviceCase.count({ where: { brokerId, status: { in: ["NEW", "AWAITING_BROKER_REVIEW"] } } }),
    prisma.serviceCase.count({ where: { brokerId, requestType: "CLAIM", createdAt: { gte: dayAgo } } }),
    prisma.serviceCase.count({ where: { brokerId, OR: [{ priority: "URGENT" }, { status: "URGENT" }] } }),
    prisma.attachment.count({ where: { brokerId, createdAt: { gte: dayAgo } } }),
    prisma.formSubmission.count({ where: { case: { brokerId }, confirmedAt: null } }),
    prisma.serviceCase.count({ where: { brokerId, requestType: "POLICY_QUESTION", status: { notIn: ["COMPLETED", "CLOSED"] } } }),
    prisma.serviceCase.count({ where: { brokerId, requestType: "CALLBACK", status: { notIn: ["COMPLETED", "CLOSED"] } } }),
    prisma.task.count({
      where: {
        case: { brokerId },
        status: { in: ["OPEN", "IN_PROGRESS"] },
        dueAt: { gte: todayStart, lt: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000) }
      }
    }),
    prisma.task.count({
      where: {
        case: { brokerId },
        status: { in: ["OPEN", "IN_PROGRESS"] },
        dueAt: { lt: now }
      }
    }),
    prisma.serviceCase.count({ where: { brokerId, status: { in: ["COMPLETED", "CLOSED"] }, updatedAt: { gte: dayAgo } } }),
    prisma.serviceCase.count({ where: { brokerId, afterHours: true, createdAt: { gte: dayAgo } } }),
    prisma.conversation.count({
      where: {
        case: { brokerId },
        messages: { some: { senderRole: "AI", content: { contains: "general guidance only" } } },
        createdAt: { gte: dayAgo }
      }
    }),
    prisma.serviceCase.count({ where: { brokerId, requestType: "POLICY_QUESTION", createdAt: { gte: dayAgo } } }),
    prisma.serviceCase.findMany({
      where: { brokerId, status: { notIn: ["COMPLETED", "CLOSED"] } },
      include: { client: true, insurer: true, tasks: true, attachments: true },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 8
    })
  ]);

  return {
    cards: {
      newRequests,
      newClaims,
      urgentCases,
      documentsReceived,
      formsAwaitingReview,
      clientQuestions,
      callbacks,
      dueToday,
      overdue,
      recentlyCompleted
    },
    morning: {
      clientsContacted: new Set(cases.map((item) => item.clientId)).size,
      newClaims,
      documentsReceived,
      questionsResolved,
      questionsEscalated,
      callbacks,
      urgentCases,
      afterHoursRequests
    },
    priorityCases: cases.map((item) => ({
      id: item.id,
      reference: item.reference,
      title: item.title,
      clientName: item.client.fullName,
      status: item.status,
      priority: item.priority,
      createdAt: item.createdAt,
      attachmentCount: item.attachments.length,
      openTaskCount: item.tasks.filter((task) => task.status !== "DONE").length
    }))
  };
}

export async function listCases(
  brokerId: string,
  filters: {
    status?: CaseStatus;
    priority?: Priority;
    requestType?: RequestType;
    q?: string;
  }
) {
  const cases = await prisma.serviceCase.findMany({
    where: {
      brokerId,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.priority ? { priority: filters.priority } : {}),
      ...(filters.requestType ? { requestType: filters.requestType } : {}),
      ...(filters.q
        ? {
            OR: [
              { reference: { contains: filters.q } },
              { title: { contains: filters.q } },
              { description: { contains: filters.q } },
              { client: { fullName: { contains: filters.q } } },
              { client: { phone: { contains: filters.q } } }
            ]
          }
        : {})
    },
    include: {
      client: true,
      insurer: true,
      tasks: true,
      attachments: true
    },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return cases.map((serviceCase) => ({
    ...serviceCase,
    missingInfo: parseJson<string[]>(serviceCase.missingInfoJson, [])
  }));
}

export async function getCaseDetail(brokerId: string, caseId: string) {
  const serviceCase = await prisma.serviceCase.findFirst({
    where: { brokerId, id: caseId },
    include: {
      client: true,
      insurer: true,
      policy: true,
      claim: true,
      attachments: true,
      tasks: { orderBy: { createdAt: "asc" } },
      conversations: {
        include: { messages: { orderBy: { createdAt: "asc" } } },
        orderBy: { createdAt: "asc" }
      },
      brokerNotes: { include: { author: true }, orderBy: { createdAt: "desc" } },
      notifications: { orderBy: { createdAt: "desc" } },
      auditLogs: { include: { actor: true }, orderBy: { createdAt: "asc" } }
    }
  });

  if (!serviceCase) return null;

  return {
    ...serviceCase,
    missingInfo: parseJson<string[]>(serviceCase.missingInfoJson, []),
    submittedFormData: parseJson<Record<string, unknown>>(serviceCase.submittedFormDataJson, {}),
    claimAnswers: serviceCase.claim ? parseJson<Record<string, unknown>>(serviceCase.claim.dynamicAnswersJson, {}) : {}
  };
}

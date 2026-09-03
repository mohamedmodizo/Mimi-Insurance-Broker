import { CaseStatus, RequestType } from "@prisma/client";
import { BrokerDashboard } from "@/components/BrokerDashboard";
import { BrokerNav } from "@/components/BrokerNav";
import { requireBrokerContext } from "@/lib/authz";
import { CaseListFilters, getDashboardSummary, listCases } from "@/lib/caseQueries";
import { prisma } from "@/lib/prisma";

export default async function BrokerPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; q?: string; view?: string }>;
}) {
  const context = await requireBrokerContext();
  const broker = await prisma.broker.findUniqueOrThrow({ where: { id: context.brokerId } });
  const params = await searchParams;
  const status = params.status && Object.values(CaseStatus).includes(params.status as CaseStatus) ? (params.status as CaseStatus) : undefined;
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const viewFilters: CaseListFilters = getDashboardViewFilters(params.view, dayAgo);
  const [summary, cases] = await Promise.all([
    getDashboardSummary(context.brokerId),
    listCases(context.brokerId, { ...viewFilters, status, q: params.q })
  ]);

  return (
    <>
      <BrokerNav agencyName={broker.agencyName} />
      <BrokerDashboard summary={summary} cases={cases} />
    </>
  );
}

function getDashboardViewFilters(view: string | undefined, dayAgo: Date): CaseListFilters {
  const activeStatuses = [
    CaseStatus.NEW,
    CaseStatus.AWAITING_BROKER_REVIEW,
    CaseStatus.AWAITING_CLIENT_INFORMATION,
    CaseStatus.AWAITING_INSURER,
    CaseStatus.IN_PROGRESS,
    CaseStatus.URGENT
  ];

  switch (view) {
    case "new-requests":
      return { statuses: [CaseStatus.NEW, CaseStatus.AWAITING_BROKER_REVIEW] };
    case "new-claims":
      return { requestType: RequestType.CLAIM, createdSince: dayAgo };
    case "urgent":
      return { urgent: true };
    case "documents":
      return { attachmentsCreatedSince: dayAgo };
    case "questions":
      return { requestType: RequestType.POLICY_QUESTION, statuses: activeStatuses };
    case "callbacks":
      return { requestType: RequestType.CALLBACK, statuses: activeStatuses };
    case "due-today":
      return { taskDue: "today" };
    case "overdue":
      return { taskDue: "overdue" };
    case "forms":
      return { formAwaitingReview: true };
    case "recently-completed":
      return { statuses: [CaseStatus.COMPLETED, CaseStatus.CLOSED], updatedSince: dayAgo };
    default:
      return {};
  }
}

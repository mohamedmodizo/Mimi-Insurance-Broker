import { CaseStatus } from "@prisma/client";
import { BrokerDashboard } from "@/components/BrokerDashboard";
import { BrokerNav } from "@/components/BrokerNav";
import { requireBrokerContext } from "@/lib/authz";
import { getDashboardSummary, listCases } from "@/lib/caseQueries";
import { prisma } from "@/lib/prisma";

export default async function BrokerPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const context = await requireBrokerContext();
  const broker = await prisma.broker.findUniqueOrThrow({ where: { id: context.brokerId } });
  const params = await searchParams;
  const status = params.status && Object.values(CaseStatus).includes(params.status as CaseStatus) ? (params.status as CaseStatus) : undefined;
  const [summary, cases] = await Promise.all([
    getDashboardSummary(context.brokerId),
    listCases(context.brokerId, { status, q: params.q })
  ]);

  return (
    <>
      <BrokerNav agencyName={broker.agencyName} />
      <BrokerDashboard summary={summary} cases={cases} />
    </>
  );
}

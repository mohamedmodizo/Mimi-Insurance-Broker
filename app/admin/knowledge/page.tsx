import { BrokerNav } from "@/components/BrokerNav";
import { KnowledgeAdmin } from "@/components/KnowledgeAdmin";
import { requireBrokerContext } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export default async function KnowledgePage() {
  const context = await requireBrokerContext();
  const broker = await prisma.broker.findUniqueOrThrow({ where: { id: context.brokerId } });

  return (
    <>
      <BrokerNav agencyName={broker.agencyName} />
      <KnowledgeAdmin />
    </>
  );
}

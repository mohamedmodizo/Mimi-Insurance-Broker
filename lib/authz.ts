import { redirect } from "next/navigation";
import { getCurrentUser, userCanAccessBrokerArea } from "@/lib/security";
import { prisma } from "@/lib/prisma";

export async function getBrokerContextOrNull() {
  const user = await getCurrentUser();
  if (!user || !userCanAccessBrokerArea(user.role)) return null;

  if (user.brokerProfile) {
    return { user, brokerId: user.brokerProfile.id };
  }

  if (user.staffProfile) {
    return { user, brokerId: user.staffProfile.brokerId };
  }

  const broker = await prisma.broker.findFirst();
  return broker ? { user, brokerId: broker.id } : null;
}

export async function requireBrokerContext() {
  const context = await getBrokerContextOrNull();
  if (!context) redirect("/broker/login");
  return context;
}

export async function requireBrokerApiContext() {
  const context = await getBrokerContextOrNull();
  if (!context) {
    return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) as Response, context: null };
  }
  return { error: null, context };
}

import { notFound } from "next/navigation";
import { ClientPortal } from "@/components/ClientPortal";
import { getEmergencyConfig } from "@/lib/config";
import { validatePortalToken } from "@/lib/portalAccess";

export default async function PortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const accessLink = await validatePortalToken(token);
  if (!accessLink) notFound();

  return (
    <ClientPortal
      token={token}
      brokerName={accessLink.broker.agencyName}
      emergencyConfig={getEmergencyConfig(accessLink.broker)}
      initialClient={
        accessLink.client
          ? {
              fullName: accessLink.client.fullName,
              phone: accessLink.client.phone,
              email: accessLink.client.email ?? "",
              nationalId: accessLink.client.nationalId ?? "",
              communicationPreference: accessLink.client.communicationPreference
            }
          : null
      }
    />
  );
}

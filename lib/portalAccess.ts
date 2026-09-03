import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/security";

export async function validatePortalToken(token: string) {
  if (!token || token.length < 12) return null;

  const accessLink = await prisma.clientAccessLink.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      broker: {
        include: {
          user: true,
          communicationPreferences: true,
          insurers: true
        }
      },
      client: true
    }
  });

  if (!accessLink || accessLink.revokedAt || accessLink.expiresAt < new Date()) {
    return null;
  }

  return accessLink;
}

import { prisma } from "@/lib/prisma";
import { createSession, setSessionCookie } from "@/lib/security";

export async function POST() {
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_DEMO_LOGIN !== "true") {
    return Response.json({ error: "Demo login is disabled in production." }, { status: 403 });
  }

  const email = (process.env.BROKER_DEMO_EMAIL ?? "broker@example.com").toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.active || user.role !== "BROKER") {
    return Response.json({ error: "Demo broker account is not available. Run pnpm db:seed." }, { status: 404 });
  }

  const session = await createSession(user.id);
  await setSessionCookie(session.token, session.expiresAt);
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  return Response.json({ ok: true });
}

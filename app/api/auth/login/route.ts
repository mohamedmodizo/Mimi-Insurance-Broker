import { Role } from "@prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";
import { isRateLimited } from "@/lib/rateLimit";
import { prisma } from "@/lib/prisma";
import { createSession, setSessionCookie, verifyPassword, verifyTotp } from "@/lib/security";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  otp: z.string().min(6).max(8)
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "local";
  if (isRateLimited(`login:${ip}`, 8, 15 * 60 * 1000)) {
    return Response.json({ error: "Too many login attempts. Try again later." }, { status: 429 });
  }

  const parsed = loginSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "Enter your email, password, and MFA code." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  const allowedRoles: Role[] = ["BROKER", "STAFF", "ADMIN"];
  if (
    !user ||
    !user.active ||
    !allowedRoles.includes(user.role) ||
    !user.passwordHash ||
    !user.passwordSalt ||
    !verifyPassword(parsed.data.password, user.passwordHash, user.passwordSalt) ||
    !user.totpSecret ||
    !verifyTotp(user.totpSecret, parsed.data.otp)
  ) {
    return Response.json({ error: "Invalid login details." }, { status: 401 });
  }

  const session = await createSession(user.id);
  await setSessionCookie(session.token, session.expiresAt);
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  return Response.json({ ok: true });
}

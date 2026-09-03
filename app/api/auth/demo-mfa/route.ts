import { NextRequest } from "next/server";
import { isRateLimited } from "@/lib/rateLimit";
import { generateTotp } from "@/lib/security";

export async function GET(request: NextRequest) {
  const enabled = process.env.NODE_ENV !== "production" || process.env.ENABLE_DEMO_MFA_HELPER === "true";
  if (!enabled) {
    return Response.json({ error: "Demo MFA code generation is disabled." }, { status: 403 });
  }

  const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "local";
  if (isRateLimited(`demo-mfa:${ip}`, 12, 60 * 1000)) {
    return Response.json({ error: "Too many MFA code requests. Try again shortly." }, { status: 429 });
  }

  const now = Date.now();
  const periodSeconds = 30;
  const expiresInSeconds = periodSeconds - (Math.floor(now / 1000) % periodSeconds);
  const code = generateTotp(process.env.BROKER_DEMO_TOTP_SECRET ?? "JBSWY3DPEHPK3PXP", now);

  return Response.json(
    { code, expiresInSeconds },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}

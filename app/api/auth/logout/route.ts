import { destroyCurrentSession } from "@/lib/security";

export async function POST() {
  await destroyCurrentSession();
  return Response.json({ ok: true });
}

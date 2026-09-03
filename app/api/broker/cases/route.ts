import { CaseStatus, Priority, RequestType } from "@prisma/client";
import { NextRequest } from "next/server";
import { requireBrokerApiContext } from "@/lib/authz";
import { listCases } from "@/lib/caseQueries";

export async function GET(request: NextRequest) {
  const { context, error } = await requireBrokerApiContext();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const cases = await listCases(context.brokerId, {
    status: enumOrUndefined(CaseStatus, searchParams.get("status")),
    priority: enumOrUndefined(Priority, searchParams.get("priority")),
    requestType: enumOrUndefined(RequestType, searchParams.get("requestType")),
    q: searchParams.get("q") ?? undefined
  });

  return Response.json({ cases });
}

function enumOrUndefined<T extends Record<string, string>>(source: T, value: string | null) {
  if (!value) return undefined;
  return Object.values(source).includes(value) ? (value as T[keyof T]) : undefined;
}

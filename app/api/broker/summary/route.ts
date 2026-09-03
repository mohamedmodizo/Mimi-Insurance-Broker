import { getDashboardSummary } from "@/lib/caseQueries";
import { requireBrokerApiContext } from "@/lib/authz";

export async function GET() {
  const { context, error } = await requireBrokerApiContext();
  if (error) return error;

  const summary = await getDashboardSummary(context.brokerId);
  return Response.json(summary);
}

import { RequestType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const prefixes: Record<RequestType, string> = {
  CLAIM: "CLM",
  DOCUMENT_UPLOAD: "DOC",
  FORM_COMPLETION: "FRM",
  POLICY_QUESTION: "QUE",
  POLICY_CHANGE: "CHG",
  QUOTE: "QTE",
  CALLBACK: "CBK",
  EMERGENCY: "URG",
  OTHER: "SRV"
};

export async function generateReference(requestType: RequestType): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = prefixes[requestType] ?? "SRV";
  const start = new Date(year, 0, 1);
  const sequence = (await prisma.serviceCase.count({ where: { createdAt: { gte: start } } })) + 1;
  return `${prefix}-${year}-${String(sequence).padStart(5, "0")}`;
}

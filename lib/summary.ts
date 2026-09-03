import { ClaimType, Priority, RequestType } from "@prisma/client";
import { claimTypeLabel } from "@/lib/claimQuestions";

export function buildBrokerSummary(input: {
  clientName: string;
  requestType: RequestType;
  claimType?: ClaimType | null;
  submittedAt: Date;
  answers: Record<string, unknown>;
  attachmentLabels: string[];
  missingInfo: string[];
  priority: Priority;
  clientRequest?: string;
}): string {
  const lines = [
    `CLIENT: ${input.clientName}`,
    `REQUEST: ${input.requestType === "CLAIM" ? claimTypeLabel(input.claimType) : readableRequestType(input.requestType)}`,
    `DATE: ${input.submittedAt.toLocaleDateString("en-GB")}`,
    `TIME: ${input.submittedAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`,
    "",
    "SUMMARY:",
    summarizeAnswers(input.answers),
    "",
    "DOCUMENTS UPLOADED:",
    input.attachmentLabels.length ? input.attachmentLabels.map((label) => `- ${label}`).join("\n") : "- None uploaded during this session",
    "",
    "CLIENT REQUEST:",
    input.clientRequest || "Client asked the broker to review and advise on the next steps.",
    "",
    "AI ACTIONS:",
    "- Collected preliminary client and request information",
    "- Checked for missing essential information",
    "- Created a service case and broker task list",
    "",
    "BROKER ACTION REQUIRED:",
    buildActionRequired(input),
    "",
    `PRIORITY: ${input.priority}`
  ];

  return lines.join("\n");
}

function summarizeAnswers(answers: Record<string, unknown>): string {
  const priorityFields = [
    "eventDescription",
    "incidentDate",
    "incidentLocation",
    "involvedSubject",
    "injuriesReported",
    "policeContacted",
    "policeReference",
    "thirdPartiesInvolved",
    "estimatedDamage",
    "supportNeeded"
  ];

  const lines = priorityFields
    .filter((field) => answers[field] !== undefined && answers[field] !== "")
    .map((field) => `- ${readableField(field)}: ${formatAnswer(answers[field])}`);

  const dynamic = Object.entries(answers)
    .filter(([field, value]) => !priorityFields.includes(field) && value !== undefined && value !== "")
    .slice(0, 8)
    .map(([field, value]) => `- ${readableField(field)}: ${formatAnswer(value)}`);

  return [...lines, ...dynamic].join("\n") || "- Client provided a general request for broker assistance.";
}

function buildActionRequired(input: {
  requestType: RequestType;
  missingInfo: string[];
  claimType?: ClaimType | null;
}): string {
  const actions = [];
  if (input.requestType === "CLAIM") {
    actions.push("- Confirm policy status and applicable insurer procedure");
    actions.push("- Review coverage and reporting requirements before advising the client");
    actions.push("- Notify insurer or prepare claim submission if appropriate");
  } else {
    actions.push("- Review the captured request");
    actions.push("- Respond to the client or assign the next action");
  }
  if (input.missingInfo.length > 0) {
    actions.push(`- Follow up missing information: ${input.missingInfo.join("; ")}`);
  }
  return actions.join("\n");
}

function readableRequestType(type: RequestType): string {
  return type
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function readableField(field: string): string {
  return field.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
}

function formatAnswer(value: unknown): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

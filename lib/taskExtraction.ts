import { ClaimType, Priority, RequestType } from "@prisma/client";
import { claimTypeLabel } from "@/lib/claimQuestions";

export type TaskDraft = {
  title: string;
  detail: string;
  priority: Priority;
};

export function buildTasks(input: {
  requestType: RequestType;
  claimType?: ClaimType | null;
  missingInfo: string[];
  attachmentCount: number;
  priority: Priority;
}): TaskDraft[] {
  const tasks: TaskDraft[] = [];

  if (input.requestType === "CLAIM") {
    tasks.push({
      title: `Review ${claimTypeLabel(input.claimType)} claim details`,
      detail: "Confirm the incident facts, client details, policy number, insurer, and any urgent next steps.",
      priority: input.priority
    });

    tasks.push({
      title: "Confirm policy and insurer notification requirements",
      detail: "Check policy status, insurer reporting procedure, excess/deductible rules, and claim form requirements.",
      priority: input.priority
    });
  }

  if (input.attachmentCount > 0) {
    tasks.push({
      title: `Review ${input.attachmentCount} uploaded file${input.attachmentCount === 1 ? "" : "s"}`,
      detail: "Verify document relevance, readability, file category, and whether more evidence is required.",
      priority: input.priority
    });
  }

  if (input.missingInfo.length > 0) {
    tasks.push({
      title: "Follow up on missing information",
      detail: `Missing: ${input.missingInfo.join("; ")}`,
      priority: input.priority === "URGENT" ? "URGENT" : "HIGH"
    });
  }

  if (input.requestType === "POLICY_QUESTION") {
    tasks.push({
      title: "Answer client policy question",
      detail: "Review the question against the client's policy and approved broker guidance before responding.",
      priority: input.priority
    });
  }

  if (input.requestType === "CALLBACK") {
    tasks.push({
      title: "Call client back",
      detail: "Contact the client using their preferred phone number and record the outcome.",
      priority: input.priority
    });
  }

  if (input.requestType === "QUOTE") {
    tasks.push({
      title: "Prepare quotation follow-up",
      detail: "Review requested cover, gather any missing rating information, and identify suitable insurer options.",
      priority: input.priority
    });
  }

  if (input.requestType === "POLICY_CHANGE") {
    tasks.push({
      title: "Review requested policy change",
      detail: "Confirm instructions, insurer requirements, effective date, and whether client consent is complete.",
      priority: input.priority
    });
  }

  if (input.requestType === "EMERGENCY") {
    tasks.unshift({
      title: "Urgent emergency review",
      detail: "Check whether immediate human intervention, insurer assistance, or emergency contact escalation is required.",
      priority: "URGENT"
    });
  }

  if (tasks.length === 0) {
    tasks.push({
      title: "Review client request",
      detail: "Read the captured request, decide next steps, and respond to the client.",
      priority: input.priority
    });
  }

  return tasks;
}

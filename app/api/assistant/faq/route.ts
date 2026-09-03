import { NextRequest } from "next/server";
import { z } from "zod";
import { createQuestionFollowUp } from "@/lib/caseService";
import { answerFromKnowledgeBase } from "@/lib/knowledge";
import { validatePortalToken } from "@/lib/portalAccess";

const faqSchema = z.object({
  token: z.string().min(12),
  question: z.string().min(3).max(1200),
  client: z
    .object({
      fullName: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      nationalId: z.string().optional(),
      customerNumber: z.string().optional()
    })
    .optional()
});

export async function POST(request: NextRequest) {
  const parsed = faqSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "Please enter a clear question." }, { status: 400 });
  }

  const accessLink = await validatePortalToken(parsed.data.token);
  if (!accessLink) {
    return Response.json({ error: "This portal link is invalid or expired." }, { status: 401 });
  }

  const answer = await answerFromKnowledgeBase(parsed.data.question);
  let followUpReference: string | null = null;

  if (answer.requiresBrokerReview) {
    const followUp = await createQuestionFollowUp({
      brokerId: accessLink.brokerId,
      client: {
        ...parsed.data.client,
        fullName: parsed.data.client?.fullName || accessLink.client?.fullName,
        phone: parsed.data.client?.phone || accessLink.client?.phone,
        email: parsed.data.client?.email || accessLink.client?.email || undefined
      },
      question: parsed.data.question,
      answer: answer.answer
    });
    followUpReference = followUp.reference;
  }

  return Response.json({
    ...answer,
    followUpReference
  });
}

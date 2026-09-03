import { prisma } from "@/lib/prisma";
import { requiresBrokerConfirmation, safeEscalationMessage } from "@/lib/safety";

export type KnowledgeAnswer = {
  answer: string;
  sources: Array<{ title: string; category: string }>;
  requiresBrokerReview: boolean;
};

const stopWords = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "to",
  "of",
  "for",
  "in",
  "on",
  "my",
  "is",
  "are",
  "do",
  "does",
  "how",
  "what",
  "when",
  "where",
  "can",
  "i"
]);

export async function answerFromKnowledgeBase(question: string): Promise<KnowledgeAnswer> {
  const needsReview = requiresBrokerConfirmation(question);
  if (needsReview) {
    return {
      answer: safeEscalationMessage(),
      sources: [],
      requiresBrokerReview: true
    };
  }

  const docs = await prisma.knowledgeDocument.findMany({
    where: { status: "APPROVED" },
    orderBy: { updatedAt: "desc" },
    take: 50
  });

  const terms = tokenize(question);
  const scored = docs
    .map((doc) => ({
      doc,
      score: scoreDocument(`${doc.title} ${doc.category} ${doc.content}`, terms)
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (scored.length === 0) {
    return {
      answer:
        "I do not have an approved answer for that yet. I have recorded it for your broker to review so you do not receive uncertain insurance advice.",
      sources: [],
      requiresBrokerReview: true
    };
  }

  const primary = scored[0].doc;
  return {
    answer: buildPlainLanguageAnswer(primary.content),
    sources: scored.map(({ doc }) => ({ title: doc.title, category: doc.category })),
    requiresBrokerReview: false
  };
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((term) => term.length > 2 && !stopWords.has(term));
}

function scoreDocument(text: string, terms: string[]): number {
  const haystack = text.toLowerCase();
  return terms.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0);
}

function buildPlainLanguageAnswer(content: string): string {
  const firstParagraph = content
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .find(Boolean);

  if (!firstParagraph) {
    return "The approved knowledge base has an entry for this topic, but it needs more detail before I can answer clearly.";
  }

  return `${firstParagraph}\n\nThis is general guidance only. Your broker can confirm how it applies to your specific policy or claim.`;
}

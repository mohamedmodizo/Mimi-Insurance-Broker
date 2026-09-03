const policySpecificPatterns = [
  /\bmy policy\b/i,
  /\bcovered\b/i,
  /\bwill (the )?insurer pay\b/i,
  /\bhow much\b.*\bpay\b/i,
  /\bclaim approved\b/i,
  /\breject(ed|ion)?\b/i,
  /\bliab(le|ility)\b/i,
  /\binterpret\b.*\bpolicy\b/i,
  /\bcompensat(e|ion)\b/i
];

export function requiresBrokerConfirmation(question: string): boolean {
  return policySpecificPatterns.some((pattern) => pattern.test(question));
}

export function safeEscalationMessage(): string {
  return "I can record this question for your broker to review. I don't want to give you incorrect information about your specific policy.";
}

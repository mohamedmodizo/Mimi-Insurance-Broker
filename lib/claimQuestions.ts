import type { ClaimType } from "@prisma/client";

export type ClaimQuestion = {
  id: string;
  label: string;
  input: "text" | "textarea" | "date" | "select" | "boolean";
  required: boolean;
  help?: string;
  options?: string[];
};

export const claimCategories: Array<{ value: ClaimType; label: string }> = [
  { value: "MOTOR", label: "Motor insurance" },
  { value: "MEDICAL", label: "Medical/health" },
  { value: "PROPERTY", label: "Property/home" },
  { value: "FIRE", label: "Fire" },
  { value: "THEFT", label: "Theft" },
  { value: "TRAVEL", label: "Travel" },
  { value: "PERSONAL_ACCIDENT", label: "Personal accident" },
  { value: "BUSINESS", label: "Business/commercial" },
  { value: "LIABILITY", label: "Liability" },
  { value: "MARINE_CARGO", label: "Marine/cargo" },
  { value: "OTHER", label: "Other" }
];

export const clientQuestions: ClaimQuestion[] = [
  { id: "fullName", label: "What is your full name?", input: "text", required: true },
  { id: "phone", label: "What phone number should your broker use?", input: "text", required: true },
  { id: "email", label: "What is your email address?", input: "text", required: false },
  {
    id: "nationalId",
    label: "National ID or customer number, if you have it",
    input: "text",
    required: false
  },
  { id: "policyNumber", label: "Policy number, if known", input: "text", required: false },
  { id: "insuranceCompany", label: "Which insurance company is this with?", input: "text", required: false }
];

const commonClaimQuestions: ClaimQuestion[] = [
  { id: "eventDescription", label: "What happened?", input: "textarea", required: true },
  { id: "incidentDate", label: "When did it happen?", input: "date", required: true },
  { id: "incidentLocation", label: "Where did it happen?", input: "text", required: true },
  {
    id: "involvedSubject",
    label: "What property, vehicle, person, shipment, or item was involved?",
    input: "text",
    required: true
  },
  { id: "injuriesReported", label: "Was anyone injured?", input: "boolean", required: true },
  {
    id: "emergencyServices",
    label: "Were police, ambulance, fire brigade, or other emergency services contacted?",
    input: "boolean",
    required: false
  },
  {
    id: "thirdPartiesInvolved",
    label: "Were any third parties involved?",
    input: "boolean",
    required: false
  },
  { id: "estimatedDamage", label: "Estimated damage or amount claimed, if known", input: "text", required: false }
];

const typeSpecificQuestions: Record<ClaimType, ClaimQuestion[]> = {
  MOTOR: [
    { id: "vehicleRegistration", label: "What is the vehicle registration number?", input: "text", required: true },
    { id: "driverName", label: "Who was driving?", input: "text", required: true },
    { id: "driverLicence", label: "Does the driver have a valid driving licence?", input: "boolean", required: true },
    { id: "policeContacted", label: "Were police contacted?", input: "boolean", required: true },
    {
      id: "policeReference",
      label: "Police abstract/report/reference number, if available",
      input: "text",
      required: false
    },
    {
      id: "repairerDetails",
      label: "Do you already have garage, assessor, or towing details?",
      input: "textarea",
      required: false
    }
  ],
  MEDICAL: [
    { id: "patientName", label: "Who received or needs treatment?", input: "text", required: true },
    { id: "hospitalName", label: "Which hospital, clinic, or provider is involved?", input: "text", required: true },
    { id: "treatmentDate", label: "Date of treatment or admission", input: "date", required: false },
    { id: "medicalEmergency", label: "Is this still an active medical emergency?", input: "boolean", required: true },
    { id: "invoiceAvailable", label: "Do you have invoices, receipts, or medical reports?", input: "boolean", required: false }
  ],
  PROPERTY: [
    { id: "propertyAddress", label: "What is the property address?", input: "text", required: true },
    { id: "damagedAreas", label: "Which areas or items were damaged?", input: "textarea", required: true },
    { id: "causeKnown", label: "Do you know what caused the loss or damage?", input: "textarea", required: false }
  ],
  FIRE: [
    { id: "fireBrigadeContacted", label: "Was the fire brigade contacted?", input: "boolean", required: true },
    { id: "propertyAddress", label: "Where did the fire occur?", input: "text", required: true },
    { id: "fireExtent", label: "What areas or items were affected by fire, smoke, or water?", input: "textarea", required: true }
  ],
  THEFT: [
    { id: "policeContacted", label: "Were police notified?", input: "boolean", required: true },
    { id: "policeReference", label: "Police report/reference number, if available", input: "text", required: false },
    { id: "stolenItems", label: "What was stolen?", input: "textarea", required: true },
    { id: "entryDamage", label: "Was there forced entry or damage?", input: "boolean", required: false }
  ],
  TRAVEL: [
    { id: "travelDates", label: "What were your travel dates?", input: "text", required: true },
    { id: "destination", label: "Destination or route", input: "text", required: true },
    { id: "travelIssue", label: "Is this about medical, baggage, cancellation, delay, or another issue?", input: "text", required: true }
  ],
  PERSONAL_ACCIDENT: [
    { id: "injuredPerson", label: "Who was injured?", input: "text", required: true },
    { id: "accidentActivity", label: "What was the person doing when the accident happened?", input: "textarea", required: true },
    { id: "medicalProvider", label: "Which medical provider was consulted?", input: "text", required: false }
  ],
  BUSINESS: [
    { id: "businessName", label: "Business name", input: "text", required: true },
    { id: "affectedOperation", label: "Which business activity, premises, stock, or equipment is affected?", input: "textarea", required: true },
    { id: "businessInterruption", label: "Has business operation been interrupted?", input: "boolean", required: false }
  ],
  LIABILITY: [
    { id: "claimantDetails", label: "Who is making or may make a claim against you?", input: "textarea", required: true },
    { id: "allegation", label: "What are they alleging happened?", input: "textarea", required: true },
    { id: "formalDemand", label: "Have you received a demand letter, summons, or formal notice?", input: "boolean", required: false }
  ],
  MARINE_CARGO: [
    { id: "shipmentDetails", label: "Shipment, vessel, airway bill, or consignment details", input: "textarea", required: true },
    { id: "cargoDescription", label: "What cargo was affected?", input: "textarea", required: true },
    { id: "carrierNotified", label: "Has the carrier, port, or clearing agent been notified?", input: "boolean", required: false }
  ],
  OTHER: [
    { id: "supportNeeded", label: "What help do you need from your broker?", input: "textarea", required: true }
  ]
};

export function getClaimQuestions(claimType: ClaimType): ClaimQuestion[] {
  return [...commonClaimQuestions, ...(typeSpecificQuestions[claimType] ?? [])];
}

export function getEssentialMissingInfo(
  claimType: ClaimType,
  client: Record<string, unknown>,
  answers: Record<string, unknown>,
  attachmentCount: number
): string[] {
  const missing: string[] = [];

  for (const question of clientQuestions) {
    if (question.required && isBlank(client[question.id])) {
      missing.push(question.label);
    }
  }

  for (const question of getClaimQuestions(claimType)) {
    if (question.required && isBlank(answers[question.id])) {
      missing.push(question.label);
    }
  }

  if (attachmentCount === 0) {
    missing.push("At least one supporting document or photo, if available");
  }

  return missing;
}

export function claimTypeLabel(type: ClaimType | null | undefined): string {
  return claimCategories.find((category) => category.value === type)?.label ?? "Insurance assistance";
}

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || String(value).trim() === "";
}

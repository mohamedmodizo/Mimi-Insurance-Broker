import { mkdir } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { hashPassword, hashToken } from "./auth-crypto";

const prisma = new PrismaClient();

const demoEmail = (process.env.BROKER_DEMO_EMAIL ?? "broker@example.com").toLowerCase();
const demoPassword = process.env.BROKER_DEMO_PASSWORD ?? "BrokerDemo!2026";
const demoTotpSecret = process.env.BROKER_DEMO_TOTP_SECRET ?? "JBSWY3DPEHPK3PXP";
const demoPortalToken = "demo-secure-link-2026";
const agencyName = "Mimi Insurance Agency";

async function main() {
  await mkdir(path.join(process.cwd(), "work", "storage", "uploads"), { recursive: true });

  const salt = "local-demo-password-salt";
  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    create: {
      email: demoEmail,
      name: "Demo Broker",
      phone: "+254700000000",
      role: "BROKER",
      passwordHash: hashPassword(demoPassword, salt),
      passwordSalt: salt,
      totpSecret: demoTotpSecret
    },
    update: {
      role: "BROKER",
      active: true,
      passwordHash: hashPassword(demoPassword, salt),
      passwordSalt: salt,
      totpSecret: demoTotpSecret
    }
  });

  const brokerConfig = {
    agencyName,
    country: "Kenya",
    timezone: "Africa/Nairobi",
    officeHoursJson: JSON.stringify({ days: [1, 2, 3, 4, 5], open: "08:30", close: "17:00" }),
    emergencyConfigJson: JSON.stringify({
      generalEmergency: "999 / 112",
      police: "999 / 112",
      ambulance: "999 / 112",
      motorAssistance: "+254 700 111 222",
      medicalAssistance: "+254 700 333 444",
      notes: [
        "In an immediate danger or medical emergency, contact local emergency services first.",
        "Motor clients should avoid admitting liability and should collect police and third-party details where safe."
      ]
    })
  };

  const broker = await prisma.broker.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      ...brokerConfig
    },
    update: brokerConfig
  });

  await upsertCommunicationPreference({
    brokerId: broker.id,
    channel: "IN_APP",
    destination: demoEmail,
    enabled: true,
    urgentOnlyAfterHours: false
  });
  await upsertCommunicationPreference({
    brokerId: broker.id,
    channel: "EMAIL",
    destination: demoEmail,
    enabled: true,
    urgentOnlyAfterHours: true
  });

  const shield = await upsertInsurer({
    brokerId: broker.id,
    name: "Shield General Insurance",
    claimsEmail: "claims@shield.example",
    claimsTelephone: "+254 700 555 111",
    emergencyAssistance: "+254 700 555 999",
    website: "https://example.com/shield",
    claimProcedure:
      "Notify Shield General as soon as practical. Provide policy number, incident description, photos, police abstract where applicable, repair estimates, and completed claim form.",
    requiredDocumentsJson: JSON.stringify([
      "Completed claim form",
      "Police abstract for motor theft/accident where applicable",
      "Photos of damage",
      "Driver licence for motor claims",
      "Repair quotation or invoice"
    ]),
    productsJson: JSON.stringify(["Motor private", "Motor commercial", "Home", "Business package"])
  });

  const afya = await upsertInsurer({
    brokerId: broker.id,
    name: "Afya Health Assurance",
    claimsEmail: "medicalclaims@afya.example",
    claimsTelephone: "+254 700 222 111",
    emergencyAssistance: "+254 700 222 999",
    website: "https://example.com/afya",
    claimProcedure:
      "For reimbursement claims, submit provider invoice, receipt, medical report, prescription where relevant, member details, and bank information. For emergencies, use the insurer assistance line first.",
    requiredDocumentsJson: JSON.stringify(["Invoice", "Receipt", "Medical report", "Prescription", "Member card or ID"]),
    productsJson: JSON.stringify(["Medical", "Group medical", "Travel medical"])
  });

  await Promise.all([
    upsertKnowledgeDocument({
      brokerId: broker.id,
      insurerId: shield.id,
      title: "Motor accident first steps",
      category: "Claims procedure",
      content:
        "If you are involved in a motor accident, first check whether anyone is injured and contact emergency services if needed. Where safe, take photos of the scene and damage, exchange details with other parties, record police information, avoid admitting liability, and submit the details and documents through this portal."
    }),
    upsertKnowledgeDocument({
      brokerId: broker.id,
      title: "Documents normally required for a claim",
      category: "Claims documents",
      content:
        "Common claim documents include a completed claim form, photos of the damage or evidence, invoices or repair estimates, receipts, police reports where required, identification documents, policy number, and any insurer-specific forms. The exact list depends on the insurer and claim type."
    }),
    upsertKnowledgeDocument({
      brokerId: broker.id,
      title: "What an excess or deductible means",
      category: "General insurance FAQ",
      content:
        "An excess or deductible is the part of a claim that the policyholder may need to bear before or when the insurer settles the claim. The amount and when it applies depend on the policy wording and insurer rules."
    }),
    upsertKnowledgeDocument({
      brokerId: broker.id,
      title: "Comprehensive motor insurance general meaning",
      category: "General insurance FAQ",
      content:
        "Comprehensive motor insurance generally provides wider protection than third-party-only cover and may include accidental damage, theft, fire, and third-party liability. Specific benefits, limits, exclusions, and excesses must be checked against the actual policy schedule and wording."
    }),
    upsertKnowledgeDocument({
      brokerId: broker.id,
      insurerId: afya.id,
      title: "Medical reimbursement claim documents",
      category: "Medical claims",
      content:
        "For a medical reimbursement claim, clients should normally submit the medical invoice, receipt or proof of payment, medical report or diagnosis notes, prescriptions where relevant, member or policy details, and bank payment information if reimbursement is requested."
    }),
    upsertKnowledgeDocument({
      brokerId: broker.id,
      title: "Policy change requests",
      category: "Service procedure",
      content:
        "For policy changes such as adding a vehicle, changing contact details, increasing cover, or adding an insured person, provide the policy number, requested change, effective date, supporting documents, and your confirmation that the broker may submit the instruction to the insurer."
    }),
    upsertKnowledgeDocument({
      brokerId: broker.id,
      title: "After-hours handling policy",
      category: "Office policy",
      content:
        "After-hours requests are safely recorded in the portal and queued for broker review. Urgent emergency workflows provide configured emergency and insurer assistance contacts. The portal does not promise exact response times unless the broker has configured them."
    })
  ]);

  await upsertFormTemplate({
    brokerId: broker.id,
    name: "Policy Change Request",
    description: "Reusable client instruction template for common policy amendments.",
    schemaJson: JSON.stringify({
      fields: [
        { id: "policyNumber", label: "Policy number", required: false },
        { id: "changeType", label: "Type of change requested", required: true },
        { id: "effectiveDate", label: "Requested effective date", required: true },
        { id: "details", label: "Details of the change", required: true },
        { id: "consent", label: "I confirm these instructions are correct", required: true }
      ]
    })
  });

  await prisma.clientAccessLink.upsert({
    where: { tokenHash: hashToken(demoPortalToken) },
    create: {
      brokerId: broker.id,
      tokenHash: hashToken(demoPortalToken),
      purpose: "CLIENT_ASSISTANCE",
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    },
    update: {
      brokerId: broker.id,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      revokedAt: null
    }
  });

  console.log(`Seeded broker account: ${demoEmail}`);
  console.log(`Demo portal link token: ${demoPortalToken}`);
}

async function upsertInsurer(input: {
  brokerId: string;
  name: string;
  claimsEmail: string;
  claimsTelephone: string;
  emergencyAssistance: string;
  website: string;
  claimProcedure: string;
  requiredDocumentsJson: string;
  productsJson: string;
}) {
  const existing = await prisma.insurer.findFirst({ where: { brokerId: input.brokerId, name: input.name } });
  if (existing) {
    return prisma.insurer.update({
      where: { id: existing.id },
      data: input
    });
  }

  return prisma.insurer.create({ data: input });
}

async function upsertCommunicationPreference(input: {
  brokerId: string;
  channel: "EMAIL" | "SMS" | "WHATSAPP" | "IN_APP" | "PUSH";
  enabled: boolean;
  urgentOnlyAfterHours: boolean;
  destination: string;
}) {
  const existing = await prisma.communicationPreference.findFirst({
    where: { brokerId: input.brokerId, channel: input.channel, destination: input.destination }
  });

  if (existing) {
    return prisma.communicationPreference.update({
      where: { id: existing.id },
      data: {
        enabled: input.enabled,
        urgentOnlyAfterHours: input.urgentOnlyAfterHours,
        destination: input.destination
      }
    });
  }

  return prisma.communicationPreference.create({ data: input });
}

async function upsertKnowledgeDocument(input: {
  brokerId: string;
  insurerId?: string;
  title: string;
  category: string;
  content: string;
}) {
  const existing = await prisma.knowledgeDocument.findFirst({
    where: { brokerId: input.brokerId, title: input.title }
  });

  if (existing) {
    return prisma.knowledgeDocument.update({
      where: { id: existing.id },
      data: {
        insurerId: input.insurerId,
        category: input.category,
        content: input.content,
        status: "APPROVED"
      }
    });
  }

  return prisma.knowledgeDocument.create({ data: input });
}

async function upsertFormTemplate(input: {
  brokerId: string;
  name: string;
  description: string;
  schemaJson: string;
}) {
  const existing = await prisma.formTemplate.findFirst({
    where: { brokerId: input.brokerId, name: input.name }
  });

  if (existing) {
    return prisma.formTemplate.update({
      where: { id: existing.id },
      data: {
        description: input.description,
        schemaJson: input.schemaJson,
        active: true
      }
    });
  }

  return prisma.formTemplate.create({ data: input });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

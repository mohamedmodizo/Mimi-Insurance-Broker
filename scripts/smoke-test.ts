import { generateTotp } from "./auth-crypto";

const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
const token = "demo-secure-link-2026";

async function main() {
  const upload = await uploadTestDocument();
  const claim = await createClaim(upload.attachments[0].id);
  const faq = await askFaq();
  const login = await loginBroker();
  const dashboard = await fetchBrokerDashboard(login.cookie);

  console.log(
    JSON.stringify(
      {
        upload: upload.attachments.map((attachment: { name: string }) => attachment.name),
        claimReference: claim.reference,
        claimStatus: claim.status,
        claimPriority: claim.priority,
        documentsReceived: claim.documentsReceived,
        faqAnswer: typeof faq.answer === "string" && faq.answer.length > 40,
        brokerLoginOk: login.ok === true,
        brokerDashboardRendered: dashboard.includes("Since you were away")
      },
      null,
      2
    )
  );
}

async function uploadTestDocument() {
  const form = new FormData();
  form.append("token", token);
  form.append("uploadSessionId", crypto.randomUUID());
  form.append("category", "Police report");
  form.append(
    "files",
    new File([Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF")], "smoke-police-report.pdf", {
      type: "application/pdf"
    })
  );

  const response = await fetch(`${baseUrl}/api/uploads`, { method: "POST", body: form });
  const payload = await response.json();
  if (!response.ok) throw new Error(`Upload failed: ${JSON.stringify(payload)}`);
  return payload;
}

async function createClaim(attachmentId: string) {
  const response = await fetch(`${baseUrl}/api/client/cases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token,
      requestType: "CLAIM",
      claimType: "MOTOR",
      client: {
        fullName: "John Smoke Test",
        phone: "+254700111222",
        email: "john.smoke@example.com",
        policyNumber: "MTR-DEMO-001",
        insuranceCompany: "Shield General Insurance",
        communicationPreference: "EMAIL"
      },
      answers: {
        eventDescription: "Vehicle was involved in a minor accident after office hours.",
        incidentDate: "2026-08-31T22:47",
        incidentLocation: "Nairobi",
        involvedSubject: "Toyota demo vehicle KAA 000A",
        injuriesReported: false,
        emergencyServices: false,
        thirdPartiesInvolved: true,
        estimatedDamage: "Unknown",
        vehicleRegistration: "KAA 000A",
        driverName: "John Smoke Test",
        driverLicence: true,
        policeContacted: true,
        policeReference: "OB-SMOKE-001"
      },
      uploadedAttachmentIds: [attachmentId],
      conversation: [
        { senderRole: "AI", content: "Welcome to Mimi Insurance Broker 24/7 Client Assistance." },
        { senderRole: "CLIENT", content: "I need to report a motor accident." }
      ],
      clientRequest: "Please contact the insurer and advise on the next steps."
    })
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(`Claim creation failed: ${JSON.stringify(payload)}`);
  return payload;
}

async function askFaq() {
  const response = await fetch(`${baseUrl}/api/assistant/faq`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token,
      question: "What documents are normally required for a motor claim?",
      client: { fullName: "John Smoke Test", phone: "+254700111222" }
    })
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(`FAQ failed: ${JSON.stringify(payload)}`);
  return payload;
}

async function loginBroker() {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.BROKER_DEMO_EMAIL ?? "broker@example.com",
      password: process.env.BROKER_DEMO_PASSWORD ?? "BrokerDemo!2026",
      otp: generateTotp(process.env.BROKER_DEMO_TOTP_SECRET ?? "JBSWY3DPEHPK3PXP")
    })
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(`Broker login failed: ${JSON.stringify(payload)}`);
  return {
    ...payload,
    cookie: response.headers.get("set-cookie") ?? ""
  };
}

async function fetchBrokerDashboard(cookie: string) {
  const response = await fetch(`${baseUrl}/broker`, {
    headers: { cookie }
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Broker dashboard failed: ${response.status}`);
  return text;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

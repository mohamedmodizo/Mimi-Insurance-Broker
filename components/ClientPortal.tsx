"use client";

import type { ClaimType, RequestType } from "@prisma/client";
import {
  AlertTriangle,
  BadgeCheck,
  CalendarClock,
  FileCheck2,
  FileText,
  HeartPulse,
  HelpCircle,
  MessageSquareText,
  PhoneCall,
  RefreshCw,
  ShieldCheck,
  UploadCloud
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { claimCategories, clientQuestions, getClaimQuestions, getEssentialMissingInfo } from "@/lib/claimQuestions";
import type { EmergencyConfig } from "@/lib/config";

type PortalMode =
  | "home"
  | "claim-category"
  | "claim-client"
  | "claim-questions"
  | "claim-upload"
  | "claim-review"
  | "confirmation"
  | "faq"
  | "simple-request"
  | "document-upload"
  | "check-request"
  | "emergency";

type UploadedAttachment = {
  id: string;
  name: string;
  sizeBytes: number;
  category: string;
};

type ChatMessage = {
  senderRole: "CLIENT" | "AI" | "SYSTEM";
  content: string;
};

type ClientIdentity = {
  fullName: string;
  phone: string;
  email: string;
  nationalId: string;
  policyNumber: string;
  insuranceCompany: string;
  communicationPreference: string;
};

type Confirmation = {
  reference: string;
  status: string;
  priority: string;
  missingInfo: string[];
  documentsReceived: number;
  confirmationMessage: string;
};

const blankClient: ClientIdentity = {
  fullName: "",
  phone: "",
  email: "",
  nationalId: "",
  policyNumber: "",
  insuranceCompany: "",
  communicationPreference: "SMS"
};

const actionItems: Array<{
  label: string;
  description: string;
  mode: PortalMode;
  requestType?: RequestType;
  icon: typeof ShieldCheck;
}> = [
  { label: "Report a Claim", description: "Accident, theft, medical, property, or other claim", mode: "claim-category", icon: ShieldCheck },
  { label: "Upload Documents", description: "Send photos, reports, invoices, forms, or evidence", mode: "document-upload", requestType: "DOCUMENT_UPLOAD", icon: UploadCloud },
  { label: "Complete a Form", description: "Give instructions one question at a time", mode: "simple-request", requestType: "FORM_COMPLETION", icon: FileText },
  { label: "Ask About My Insurance", description: "General FAQs and broker-reviewed policy questions", mode: "faq", icon: HelpCircle },
  { label: "Request a Policy Change", description: "Add, remove, or update policy details", mode: "simple-request", requestType: "POLICY_CHANGE", icon: RefreshCw },
  { label: "Request a Quote", description: "Ask for new or revised insurance pricing", mode: "simple-request", requestType: "QUOTE", icon: FileCheck2 },
  { label: "Request a Callback", description: "Leave a clear message for your broker", mode: "simple-request", requestType: "CALLBACK", icon: PhoneCall },
  { label: "Emergency Assistance", description: "Urgent guidance and emergency contacts", mode: "emergency", requestType: "EMERGENCY", icon: AlertTriangle }
];

export function ClientPortal({
  token,
  brokerName,
  emergencyConfig,
  initialClient
}: {
  token: string;
  brokerName: string;
  emergencyConfig: EmergencyConfig;
  initialClient?: Partial<ClientIdentity> | null;
}) {
  const [mode, setMode] = useState<PortalMode>("home");
  const [claimType, setClaimType] = useState<ClaimType>("MOTOR");
  const [client, setClient] = useState<ClientIdentity>({ ...blankClient, ...initialClient });
  const [claimAnswers, setClaimAnswers] = useState<Record<string, unknown>>({});
  const [simpleRequestType, setSimpleRequestType] = useState<RequestType>("CALLBACK");
  const [simpleDescription, setSimpleDescription] = useState("");
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [uploadSessionId] = useState(() => crypto.randomUUID());
  const [chat, setChat] = useState<ChatMessage[]>([
    {
      senderRole: "AI",
      content: `Welcome to ${brokerName} 24/7 Client Assistance. I can help you report a claim, submit documents, complete forms, answer general insurance questions, or leave instructions for your broker. What would you like help with?`
    }
  ]);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const draftKey = `insurance-portal-draft:${token}`;

  useEffect(() => {
    const saved = window.localStorage.getItem(draftKey);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as {
        client?: ClientIdentity;
        claimType?: ClaimType;
        claimAnswers?: Record<string, unknown>;
        attachments?: UploadedAttachment[];
      };
      setClient((current) => ({ ...current, ...parsed.client }));
      setClaimType(parsed.claimType ?? "MOTOR");
      setClaimAnswers(parsed.claimAnswers ?? {});
      setAttachments(parsed.attachments ?? []);
    } catch {
      window.localStorage.removeItem(draftKey);
    }
  }, [draftKey]);

  useEffect(() => {
    window.localStorage.setItem(draftKey, JSON.stringify({ client, claimType, claimAnswers, attachments }));
  }, [attachments, claimAnswers, claimType, client, draftKey]);

  const missingInfo = useMemo(
    () => getEssentialMissingInfo(claimType, client, claimAnswers, attachments.length),
    [attachments.length, claimAnswers, claimType, client]
  );

  function chooseAction(item: (typeof actionItems)[number]) {
    setMode(item.mode);
    if (item.requestType) setSimpleRequestType(item.requestType);
    addAiMessage(nextPromptForMode(item.mode, item.requestType));
  }

  function addClientMessage(content: string) {
    setChat((messages) => [...messages, { senderRole: "CLIENT", content }]);
  }

  function addAiMessage(content: string) {
    setChat((messages) => [...messages, { senderRole: "AI", content }]);
  }

  async function submitCase(requestType: RequestType, extraAnswers: Record<string, unknown> = {}) {
    setSubmitting(true);
    try {
      const response = await fetch("/api/client/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          requestType,
          claimType: requestType === "CLAIM" ? claimType : undefined,
          client,
          answers: requestType === "CLAIM" ? claimAnswers : extraAnswers,
          uploadedAttachmentIds: attachments.map((attachment) => attachment.id),
          conversation: chat,
          clientRequest:
            requestType === "CLAIM"
              ? "Client reported a claim and asked the broker to advise on next steps."
              : simpleDescription || String(extraAnswers.eventDescription ?? "")
        })
      });

      const payload = (await response.json()) as Confirmation & { error?: string };
      if (!response.ok) throw new Error(payload.error || "The request could not be submitted.");
      setConfirmation(payload);
      setMode("confirmation");
      addAiMessage(`Your information has been received successfully. Reference: ${payload.reference}.`);
      window.localStorage.removeItem(draftKey);
    } catch (error) {
      addAiMessage(error instanceof Error ? error.message : "The request could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="client-app">
      <section className="client-chat-band">
        <div className="client-shell">
          <div className="assistant-panel" aria-label="Assistant conversation">
            <div className="brand-row">
              <div className="brand-mark" aria-hidden="true">
                <ShieldCheck size={26} />
              </div>
              <div>
                <p className="eyebrow">24/7 client assistance</p>
                <h1>{brokerName}</h1>
              </div>
            </div>

            <div className="chat-log">
              {chat.slice(-5).map((message, index) => (
                <div className={`message ${message.senderRole.toLowerCase()}`} key={`${message.senderRole}-${index}`}>
                  {message.content}
                </div>
              ))}
            </div>
          </div>

          <div className="workflow-panel">
            {mode === "home" && <HomeActions onChoose={chooseAction} />}
            {mode === "claim-category" && (
              <ClaimCategory
                claimType={claimType}
                onSelect={(value) => {
                  setClaimType(value);
                  addClientMessage(claimCategories.find((item) => item.value === value)?.label ?? value);
                  setMode("claim-client");
                  addAiMessage("I will collect the basics first, then only ask questions relevant to this claim type.");
                }}
                onBack={() => setMode("home")}
              />
            )}
            {mode === "claim-client" && (
              <QuestionFlow
                title="Your Details"
                questions={clientQuestions}
                values={client}
                onChange={(id, value) => setClient((current) => ({ ...current, [id]: value }))}
                onDone={() => {
                  addClientMessage("Client details provided.");
                  setMode("claim-questions");
                  addAiMessage("Thank you. Now I will ask about what happened.");
                }}
                onBack={() => setMode("claim-category")}
              />
            )}
            {mode === "claim-questions" && (
              <QuestionFlow
                title={`${claimCategories.find((item) => item.value === claimType)?.label} Claim`}
                questions={getClaimQuestions(claimType)}
                values={claimAnswers}
                onChange={(id, value) => setClaimAnswers((current) => ({ ...current, [id]: value }))}
                onDone={() => {
                  addClientMessage("Claim details provided.");
                  setMode("claim-upload");
                  addAiMessage("You can upload photos, videos, reports, receipts, invoices, licences, forms, or other evidence now.");
                }}
                onBack={() => setMode("claim-client")}
              />
            )}
            {mode === "claim-upload" && (
              <UploadStep
                token={token}
                uploadSessionId={uploadSessionId}
                attachments={attachments}
                onUploaded={(items) => setAttachments((current) => [...current, ...items])}
                onBack={() => setMode("claim-questions")}
                onNext={() => setMode("claim-review")}
              />
            )}
            {mode === "claim-review" && (
              <ReviewClaim
                claimType={claimType}
                client={client}
                answers={claimAnswers}
                attachments={attachments}
                missingInfo={missingInfo}
                isSubmitting={isSubmitting}
                onBack={() => setMode("claim-upload")}
                onSubmit={() => submitCase("CLAIM")}
              />
            )}
            {mode === "faq" && <FaqPanel token={token} client={client} onBack={() => setMode("home")} />}
            {mode === "simple-request" && (
              <SimpleRequestPanel
                requestType={simpleRequestType}
                client={client}
                description={simpleDescription}
                isSubmitting={isSubmitting}
                onClientChange={setClient}
                onDescriptionChange={setSimpleDescription}
                onBack={() => setMode("home")}
                onSubmit={() =>
                  submitCase(simpleRequestType, {
                    eventDescription: simpleDescription,
                    requestType: simpleRequestType
                  })
                }
              />
            )}
            {mode === "document-upload" && (
              <DocumentUploadPanel
                token={token}
                uploadSessionId={uploadSessionId}
                client={client}
                attachments={attachments}
                description={simpleDescription}
                isSubmitting={isSubmitting}
                onClientChange={setClient}
                onDescriptionChange={setSimpleDescription}
                onUploaded={(items) => setAttachments((current) => [...current, ...items])}
                onBack={() => setMode("home")}
                onSubmit={() =>
                  submitCase("DOCUMENT_UPLOAD", {
                    eventDescription: simpleDescription || "Client submitted documents for broker review."
                  })
                }
              />
            )}
            {mode === "check-request" && <CheckRequest token={token} onBack={() => setMode("home")} />}
            {mode === "emergency" && (
              <EmergencyPanel
                emergencyConfig={emergencyConfig}
                client={client}
                description={simpleDescription}
                isSubmitting={isSubmitting}
                onClientChange={setClient}
                onDescriptionChange={setSimpleDescription}
                onBack={() => setMode("home")}
                onSubmit={() =>
                  submitCase("EMERGENCY", {
                    eventDescription: simpleDescription,
                    emergencyServices: true
                  })
                }
              />
            )}
            {mode === "confirmation" && confirmation && <ConfirmationPanel confirmation={confirmation} onCheck={() => setMode("check-request")} />}
          </div>
        </div>
      </section>
      {mode === "home" && (
        <div className="secondary-actions">
          <button className="ghost-button" onClick={() => setMode("check-request")} type="button">
            Check an existing request
          </button>
          <button
            className="ghost-button"
            onClick={() => {
              setSimpleRequestType("OTHER");
              setMode("simple-request");
            }}
            type="button"
          >
            Other insurance assistance
          </button>
        </div>
      )}
    </main>
  );
}

function HomeActions({ onChoose }: { onChoose: (item: (typeof actionItems)[number]) => void }) {
  return (
    <div>
      <p className="panel-kicker">How can I help?</p>
      <div className="action-grid">
        {actionItems.map((item) => {
          const Icon = item.icon;
          return (
            <button className="action-tile" key={item.label} onClick={() => onChoose(item)} type="button">
              <span className="tile-icon" aria-hidden="true">
                <Icon size={24} />
              </span>
              <span>
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ClaimCategory({
  claimType,
  onSelect,
  onBack
}: {
  claimType: ClaimType;
  onSelect: (value: ClaimType) => void;
  onBack: () => void;
}) {
  return (
    <div>
      <PanelHeader title="What type of claim is this?" onBack={onBack} />
      <div className="choice-list">
        {claimCategories.map((category) => (
          <button
            className={`choice-button ${claimType === category.value ? "selected" : ""}`}
            key={category.value}
            onClick={() => onSelect(category.value)}
            type="button"
          >
            {category.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function QuestionFlow({
  title,
  questions,
  values,
  onChange,
  onDone,
  onBack
}: {
  title: string;
  questions: ReturnType<typeof getClaimQuestions>;
  values: Record<string, unknown>;
  onChange: (id: string, value: unknown) => void;
  onDone: () => void;
  onBack: () => void;
}) {
  const [index, setIndex] = useState(0);
  const question = questions[index];
  const value = values[question.id];
  const canContinue = !question.required || (value !== undefined && value !== "");
  const progress = Math.round(((index + 1) / questions.length) * 100);

  function next() {
    if (index < questions.length - 1) {
      setIndex(index + 1);
    } else {
      onDone();
    }
  }

  return (
    <div>
      <PanelHeader title={title} onBack={index === 0 ? onBack : () => setIndex(index - 1)} />
      <div className="progress-track" aria-label={`Progress ${progress}%`}>
        <span style={{ width: `${progress}%` }} />
      </div>
      <p className="question-count">
        Question {index + 1} of {questions.length}
      </p>
      <label className="question-label" htmlFor={question.id}>
        {question.label}
      </label>
      {question.help && <p className="help-text">{question.help}</p>}
      <QuestionInput question={question} value={value} onChange={(nextValue) => onChange(question.id, nextValue)} />
      <div className="button-row">
        <button className="primary-button" disabled={!canContinue} onClick={next} type="button">
          {index === questions.length - 1 ? "Continue" : "Next"}
        </button>
        {!question.required && (
          <button className="text-button" onClick={next} type="button">
            Skip
          </button>
        )}
      </div>
    </div>
  );
}

function QuestionInput({
  question,
  value,
  onChange
}: {
  question: ReturnType<typeof getClaimQuestions>[number];
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  if (question.input === "boolean") {
    return (
      <div className="segmented">
        <button className={value === true ? "active" : ""} onClick={() => onChange(true)} type="button">
          Yes
        </button>
        <button className={value === false ? "active" : ""} onClick={() => onChange(false)} type="button">
          No
        </button>
      </div>
    );
  }

  if (question.input === "textarea") {
    return (
      <textarea
        className="text-field"
        id={question.id}
        onChange={(event) => onChange(event.target.value)}
        rows={5}
        value={String(value ?? "")}
      />
    );
  }

  return (
    <input
      className="text-field"
      id={question.id}
      onChange={(event) => onChange(event.target.value)}
      type={question.input === "date" ? "datetime-local" : "text"}
      value={String(value ?? "")}
    />
  );
}

function UploadStep({
  token,
  uploadSessionId,
  attachments,
  onUploaded,
  onBack,
  onNext
}: {
  token: string;
  uploadSessionId: string;
  attachments: UploadedAttachment[];
  onUploaded: (items: UploadedAttachment[]) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div>
      <PanelHeader title="Upload Evidence" onBack={onBack} />
      <p className="panel-copy">Upload photos, videos, PDFs, police reports, medical reports, receipts, licences, invoices, or forms.</p>
      <Uploader token={token} uploadSessionId={uploadSessionId} onUploaded={onUploaded} />
      <AttachmentList attachments={attachments} />
      <div className="button-row">
        <button className="primary-button" onClick={onNext} type="button">
          Review Submission
        </button>
        <button className="text-button" onClick={onNext} type="button">
          I do not have files now
        </button>
      </div>
    </div>
  );
}

function Uploader({
  token,
  uploadSessionId,
  onUploaded
}: {
  token: string;
  uploadSessionId: string;
  onUploaded: (items: UploadedAttachment[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");

  function upload(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    setProgress(0);
    const data = new FormData();
    data.append("token", token);
    data.append("uploadSessionId", uploadSessionId);
    data.append("category", "Supporting evidence");
    Array.from(files).forEach((file) => data.append("files", file));

    const request = new XMLHttpRequest();
    request.open("POST", "/api/uploads");
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) setProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () => {
      setProgress(null);
      const payload = JSON.parse(request.responseText || "{}") as { attachments?: UploadedAttachment[]; error?: string };
      if (request.status >= 200 && request.status < 300 && payload.attachments) {
        onUploaded(payload.attachments);
        if (inputRef.current) inputRef.current.value = "";
      } else {
        setError(payload.error || "Upload failed.");
      }
    };
    request.onerror = () => {
      setProgress(null);
      setError("Upload failed. Check your connection and try again.");
    };
    request.send(data);
  }

  return (
    <div className="upload-box">
      <input
        accept=".jpg,.jpeg,.png,.webp,.mp4,.pdf,.doc,.docx"
        className="visually-hidden"
        multiple
        onChange={(event) => upload(event.target.files)}
        ref={inputRef}
        type="file"
      />
      <button className="upload-button" onClick={() => inputRef.current?.click()} type="button">
        <UploadCloud size={22} />
        Choose Files
      </button>
      {progress !== null && (
        <div className="progress-track upload-progress" aria-label={`Upload progress ${progress}%`}>
          <span style={{ width: `${progress}%` }} />
        </div>
      )}
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}

function ReviewClaim({
  claimType,
  client,
  answers,
  attachments,
  missingInfo,
  isSubmitting,
  onBack,
  onSubmit
}: {
  claimType: ClaimType;
  client: ClientIdentity;
  answers: Record<string, unknown>;
  attachments: UploadedAttachment[];
  missingInfo: string[];
  isSubmitting: boolean;
  onBack: () => void;
  onSubmit: () => void;
}) {
  return (
    <div>
      <PanelHeader title="Confirm Details" onBack={onBack} />
      <SummaryBlock title="Client" rows={[["Name", client.fullName], ["Phone", client.phone], ["Email", client.email || "Not provided"]]} />
      <SummaryBlock
        title="Claim"
        rows={[
          ["Type", claimCategories.find((item) => item.value === claimType)?.label ?? claimType],
          ["What happened", String(answers.eventDescription ?? "")],
          ["When", String(answers.incidentDate ?? "")],
          ["Where", String(answers.incidentLocation ?? "")]
        ]}
      />
      <AttachmentList attachments={attachments} />
      {missingInfo.length > 0 && (
        <div className="warning-box">
          <AlertTriangle size={20} />
          <div>
            <strong>I still need:</strong>
            <ul>
              {missingInfo.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p>You can submit now and your broker will see these as follow-up items.</p>
          </div>
        </div>
      )}
      <button className="primary-button full-width" disabled={isSubmitting} onClick={onSubmit} type="button">
        {isSubmitting ? "Submitting..." : "Submit to Broker"}
      </button>
    </div>
  );
}

function FaqPanel({ token, client, onBack }: { token: string; client: ClientIdentity; onBack: () => void }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<Array<{ title: string; category: string }>>([]);
  const [followUpReference, setFollowUpReference] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function ask(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setAnswer("");
    setFollowUpReference(null);
    const response = await fetch("/api/assistant/faq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, question, client })
    });
    const payload = (await response.json()) as {
      answer?: string;
      sources?: Array<{ title: string; category: string }>;
      followUpReference?: string | null;
      error?: string;
    };
    setLoading(false);
    setAnswer(payload.answer || payload.error || "I could not answer that question.");
    setSources(payload.sources ?? []);
    setFollowUpReference(payload.followUpReference ?? null);
  }

  return (
    <form onSubmit={ask}>
      <PanelHeader title="Ask About Insurance" onBack={onBack} />
      <p className="panel-copy">Ask general questions. Coverage, payment, liability, or final policy interpretation will be sent to your broker for confirmation.</p>
      <textarea
        className="text-field"
        onChange={(event) => setQuestion(event.target.value)}
        placeholder="Example: What documents are normally required for a motor claim?"
        rows={5}
        value={question}
      />
      <button className="primary-button full-width" disabled={loading || question.trim().length < 3} type="submit">
        {loading ? "Checking approved guidance..." : "Ask"}
      </button>
      {answer && (
        <div className="answer-box">
          <MessageSquareText size={22} />
          <div>
            <p>{answer}</p>
            {sources.length > 0 && (
              <p className="source-text">Sources: {sources.map((source) => `${source.title} (${source.category})`).join(", ")}</p>
            )}
            {followUpReference && <p className="source-text">Broker follow-up created: {followUpReference}</p>}
          </div>
        </div>
      )}
    </form>
  );
}

function SimpleRequestPanel({
  requestType,
  client,
  description,
  isSubmitting,
  onClientChange,
  onDescriptionChange,
  onBack,
  onSubmit
}: {
  requestType: RequestType;
  client: ClientIdentity;
  description: string;
  isSubmitting: boolean;
  onClientChange: (client: ClientIdentity) => void;
  onDescriptionChange: (value: string) => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  return (
    <div>
      <PanelHeader title={requestLabel(requestType)} onBack={onBack} />
      <ClientMiniForm client={client} onChange={onClientChange} />
      <label className="question-label" htmlFor="simple-description">
        What should your broker know?
      </label>
      <textarea
        className="text-field"
        id="simple-description"
        onChange={(event) => onDescriptionChange(event.target.value)}
        rows={5}
        value={description}
      />
      <button className="primary-button full-width" disabled={isSubmitting || !client.fullName || !client.phone || !description.trim()} onClick={onSubmit} type="button">
        {isSubmitting ? "Submitting..." : "Submit Request"}
      </button>
    </div>
  );
}

function DocumentUploadPanel({
  token,
  uploadSessionId,
  client,
  attachments,
  description,
  isSubmitting,
  onClientChange,
  onDescriptionChange,
  onUploaded,
  onBack,
  onSubmit
}: {
  token: string;
  uploadSessionId: string;
  client: ClientIdentity;
  attachments: UploadedAttachment[];
  description: string;
  isSubmitting: boolean;
  onClientChange: (client: ClientIdentity) => void;
  onDescriptionChange: (value: string) => void;
  onUploaded: (items: UploadedAttachment[]) => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  return (
    <div>
      <PanelHeader title="Upload Documents" onBack={onBack} />
      <ClientMiniForm client={client} onChange={onClientChange} />
      <label className="question-label" htmlFor="upload-description">
        What are these documents for?
      </label>
      <textarea
        className="text-field"
        id="upload-description"
        onChange={(event) => onDescriptionChange(event.target.value)}
        rows={4}
        value={description}
      />
      <Uploader token={token} uploadSessionId={uploadSessionId} onUploaded={onUploaded} />
      <AttachmentList attachments={attachments} />
      <button
        className="primary-button full-width"
        disabled={isSubmitting || !client.fullName || !client.phone || attachments.length === 0}
        onClick={onSubmit}
        type="button"
      >
        {isSubmitting ? "Submitting..." : "Submit Documents"}
      </button>
    </div>
  );
}

function EmergencyPanel({
  emergencyConfig,
  client,
  description,
  isSubmitting,
  onClientChange,
  onDescriptionChange,
  onBack,
  onSubmit
}: {
  emergencyConfig: EmergencyConfig;
  client: ClientIdentity;
  description: string;
  isSubmitting: boolean;
  onClientChange: (client: ClientIdentity) => void;
  onDescriptionChange: (value: string) => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  return (
    <div>
      <PanelHeader title="Emergency Assistance" onBack={onBack} />
      <div className="emergency-box">
        <HeartPulse size={24} />
        <div>
          <strong>This portal is not an emergency service.</strong>
          <p>In immediate danger or a medical emergency, contact local emergency services first.</p>
          <p>Emergency: {emergencyConfig.generalEmergency || "Use your local emergency number"}</p>
          {emergencyConfig.motorAssistance && <p>Motor assistance: {emergencyConfig.motorAssistance}</p>}
          {emergencyConfig.medicalAssistance && <p>Medical assistance: {emergencyConfig.medicalAssistance}</p>}
        </div>
      </div>
      <ul className="plain-list">
        <li>Check whether everyone is safe.</li>
        <li>Contact emergency services where necessary.</li>
        <li>Do not admit liability.</li>
        <li>Take photographs where it is safe to do so.</li>
        <li>Exchange relevant details with other parties.</li>
      </ul>
      <ClientMiniForm client={client} onChange={onClientChange} />
      <label className="question-label" htmlFor="emergency-description">
        Tell your broker what happened
      </label>
      <textarea
        className="text-field"
        id="emergency-description"
        onChange={(event) => onDescriptionChange(event.target.value)}
        rows={5}
        value={description}
      />
      <button className="danger-button full-width" disabled={isSubmitting || !client.fullName || !client.phone || !description.trim()} onClick={onSubmit} type="button">
        {isSubmitting ? "Submitting..." : "Record Urgent Case"}
      </button>
    </div>
  );
}

function CheckRequest({ token, onBack }: { token: string; onBack: () => void }) {
  const [reference, setReference] = useState("");
  const [identity, setIdentity] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  async function check(event: FormEvent) {
    event.preventDefault();
    setError("");
    setResult(null);
    const response = await fetch(
      `/api/client/cases?token=${encodeURIComponent(token)}&reference=${encodeURIComponent(reference)}&identity=${encodeURIComponent(identity)}`
    );
    const payload = (await response.json()) as Record<string, unknown> & { error?: string };
    if (!response.ok) {
      setError(payload.error || "Request not found.");
      return;
    }
    setResult(payload);
  }

  return (
    <form onSubmit={check}>
      <PanelHeader title="Check Existing Request" onBack={onBack} />
      <label className="question-label" htmlFor="reference">
        Reference number
      </label>
      <input className="text-field" id="reference" onChange={(event) => setReference(event.target.value)} value={reference} />
      <label className="question-label" htmlFor="identity">
        Phone or email used in the request
      </label>
      <input className="text-field" id="identity" onChange={(event) => setIdentity(event.target.value)} value={identity} />
      <button className="primary-button full-width" disabled={!reference || !identity} type="submit">
        Check Status
      </button>
      {error && <p className="error-text">{error}</p>}
      {result && (
        <div className="answer-box">
          <CalendarClock size={22} />
          <div>
            <strong>{String(result.reference)}</strong>
            <p>Status: {String(result.status)}</p>
            <p>Priority: {String(result.priority)}</p>
          </div>
        </div>
      )}
    </form>
  );
}

function ClientMiniForm({ client, onChange }: { client: ClientIdentity; onChange: (client: ClientIdentity) => void }) {
  return (
    <div className="mini-form">
      <label>
        Full name
        <input className="text-field" onChange={(event) => onChange({ ...client, fullName: event.target.value })} value={client.fullName} />
      </label>
      <label>
        Phone number
        <input className="text-field" onChange={(event) => onChange({ ...client, phone: event.target.value })} value={client.phone} />
      </label>
      <label>
        Email
        <input className="text-field" onChange={(event) => onChange({ ...client, email: event.target.value })} value={client.email} />
      </label>
      <label>
        Policy number, if known
        <input className="text-field" onChange={(event) => onChange({ ...client, policyNumber: event.target.value })} value={client.policyNumber} />
      </label>
    </div>
  );
}

function PanelHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="panel-header">
      <button className="back-button" onClick={onBack} type="button">
        Back
      </button>
      <h2>{title}</h2>
    </div>
  );
}

function AttachmentList({ attachments }: { attachments: UploadedAttachment[] }) {
  if (attachments.length === 0) return <p className="empty-state">No files uploaded yet.</p>;
  return (
    <div className="attachment-list">
      {attachments.map((attachment) => (
        <div className="attachment-row" key={attachment.id}>
          <FileCheck2 size={18} />
          <span>{attachment.name}</span>
          <small>{formatBytes(attachment.sizeBytes)}</small>
        </div>
      ))}
    </div>
  );
}

function SummaryBlock({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return (
    <div className="summary-block">
      <h3>{title}</h3>
      {rows.map(([label, value]) => (
        <div className="summary-row" key={label}>
          <span>{label}</span>
          <strong>{value || "Not provided"}</strong>
        </div>
      ))}
    </div>
  );
}

function ConfirmationPanel({ confirmation, onCheck }: { confirmation: Confirmation; onCheck: () => void }) {
  return (
    <div className="confirmation-panel">
      <BadgeCheck size={42} />
      <h2>Your information has been received successfully.</h2>
      <p>Reference: {confirmation.reference}</p>
      <p>Documents received: {confirmation.documentsReceived}</p>
      <p>{confirmation.confirmationMessage}</p>
      {confirmation.missingInfo.length > 0 && (
        <div className="warning-box">
          <AlertTriangle size={20} />
          <p>Your broker will follow up on missing items: {confirmation.missingInfo.join("; ")}</p>
        </div>
      )}
      <button className="primary-button full-width" onClick={onCheck} type="button">
        Check This Request Later
      </button>
    </div>
  );
}

function nextPromptForMode(mode: PortalMode, requestType?: RequestType): string {
  if (mode === "claim-category") return "Please choose the type of claim. I will only ask questions that fit that claim.";
  if (mode === "document-upload") return "I can receive the documents and attach them to a service case for your broker.";
  if (mode === "faq") return "Ask your question. I will answer from approved broker guidance and escalate anything policy-specific.";
  if (mode === "emergency") return "If anyone is in immediate danger, contact emergency services first. I can also record an urgent case for your broker.";
  return `I will record your ${requestLabel(requestType ?? "OTHER").toLowerCase()} and create a broker follow-up task.`;
}

function requestLabel(type: RequestType) {
  return type
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

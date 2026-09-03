# 24/7 Insurance Client Service & Claims Portal

## A. Product Specification

The platform is a secure mobile-first service desk for insurance brokers. A broker sends a revocable client portal link by WhatsApp, SMS, email, or another channel. The client opens the link and is guided by an assistant through common after-hours needs: reporting a claim, uploading documents, completing a form request, asking approved insurance questions, requesting a policy change, requesting a quote, requesting a callback, checking a previous request, or recording an emergency.

Every meaningful client interaction creates or updates a case. A case stores the client identity, policy and insurer information where known, the structured intake answers, uploaded evidence, AI conversation, broker summary, missing information, tasks, notifications, notes, status, priority, and audit history.

The assistant is intentionally constrained. It can answer approved general questions from the broker knowledge base, explain general insurance concepts, and guide clients through intake. It must not decide coverage, claim payment, legal liability, final policy interpretation, approval, rejection, or settlement value. Those items are escalated to the broker with a follow-up task.

## B. User Journeys

New claim:
1. Client opens secure link.
2. Client chooses `Report a Claim`.
3. Portal asks the claim category.
4. Portal collects client details.
5. Portal asks only relevant claim questions for the selected category.
6. Client uploads evidence.
7. Portal checks missing essentials and lets the client complete or submit anyway.
8. Portal creates a case, claim record, broker summary, tasks, notifications, and audit events.
9. Client receives a confirmation reference.

Existing claim:
1. Client chooses `Check an existing request`.
2. Client enters reference number plus phone or email.
3. Portal shows status, priority, received documents, and client-facing follow-up items.

Form completion:
1. Client chooses `Complete a Form`.
2. Assistant gathers identity and intended instruction.
3. MVP creates a form-completion case for broker review.
4. Phase 2 adds reusable template selection, phone-first question flow, PDF generation, signature capture, and downloads.

Policy question:
1. Client asks a question.
2. Assistant retrieves approved knowledge-base guidance.
3. General answers are returned with sources.
4. Coverage, liability, payment, and policy-interpretation questions create a broker review case.

Document submission:
1. Client chooses `Upload Documents`.
2. Client identifies themselves.
3. Client uploads allowed file types.
4. Files are validated, hashed, stored, and associated with the submitted case.
5. Broker sees the files in the case record.

Callback request:
1. Client chooses `Request a Callback`.
2. Client enters name, phone, optional policy number, and message.
3. Portal creates a callback case and broker task.

Emergency request:
1. Client chooses `Emergency Assistance`.
2. Portal states it is not an emergency service.
3. Portal displays configured emergency and insurer assistance contacts.
4. Portal records the urgent case and notifies the broker according to urgent notification settings.

Broker reviewing overnight requests:
1. Broker logs in with password and MFA.
2. Dashboard shows `Since You Were Away`.
3. Broker sees new claims, urgent cases, documents, questions, callbacks, due tasks, overdue tasks, and recently completed requests.
4. Broker opens the prioritized case list, reviews the summary first, then the conversation and documents if needed.
5. Broker updates tasks, adds notes, changes status, and creates an audit trail.

## C. System Architecture

Frontend:
- Next.js App Router.
- Responsive React client portal.
- Broker dashboard and admin screens.
- PWA manifest for installable mobile use.

Backend:
- Next.js route handlers for authenticated broker APIs and portal APIs.
- Domain services for case creation, task extraction, summaries, knowledge retrieval, file validation, sessions, and audit logging.

Database:
- MVP uses SQLite through Prisma.
- Production target is PostgreSQL using the same Prisma model shape.

Storage:
- MVP stores files under local secure storage with database metadata, hashes, MIME validation, and path checks.
- Production target is private object storage with signed broker/client download URLs, malware scanning, retention policies, and immutable audit metadata.

Authentication:
- Broker/staff/admin login uses password hashing, server-side sessions, HTTP-only cookies, rate limiting, and TOTP MFA.
- Client access uses revocable token links.
- Production should add customer portal authentication for returning clients.

AI:
- Retrieval-first assistant uses approved broker knowledge documents.
- Guardrails prevent coverage/payment/liability/final interpretation answers.
- Case summary and task extraction are structured and deterministic in the MVP.
- Production can add an LLM provider behind the same policy layer.

Notifications:
- MVP queues email/SMS/in-app/WhatsApp notification records.
- Production connects configured providers such as email, SMS, WhatsApp Business API, and push notifications.

## D. Database Schema

Core entities:
- `User`: broker, staff, admin, or client login identity.
- `Session`: server-side authenticated broker/admin sessions.
- `Broker`: brokerage profile, country, timezone, office hours, emergency config.
- `ClientAccessLink`: revocable secure portal link tied to broker and optionally client.
- `Client`: client identity and communication preference.
- `Staff`: staff permissions and assignments.
- `Insurer`: claims contacts, procedures, required documents, products, notes.
- `Policy`: client policy metadata and insurer relationship.
- `ServiceCase`: master ticket for all client submissions.
- `Claim`: claim-specific structured incident data.
- `Conversation` and `Message`: assistant/client/system transcript.
- `Attachment`: uploaded file metadata, hash, category, status, and storage path.
- `FormTemplate` and `FormSubmission`: reusable forms and captured answers.
- `Task`: actionable broker/staff follow-up items.
- `Notification`: queued/sent/muted broker and client notifications.
- `KnowledgeDocument`: approved FAQ/procedure/policy guidance for retrieval.
- `AuditLog`: append-style case and system history.
- `BrokerNote`: broker/staff notes.
- `CommunicationPreference`: notification channels and after-hours behavior.

Important relationships:
- Broker owns clients, staff, insurers, policies, knowledge documents, forms, cases, and notification preferences.
- Client owns policies, cases, conversations, attachments, and access links.
- Case belongs to broker and client, optionally insurer, policy, and assigned staff.
- Case has one claim for claim requests and many tasks, attachments, conversations, notifications, notes, and audit logs.
- Attachment download is authorized through the owning case and broker context.

## E. UI Screens

Client:
- Secure portal welcome with large action buttons.
- Claim category selection.
- Guided client identity questions.
- Guided claim questions that change by claim type.
- Upload screen with progress.
- Missing-information and confirmation screen.
- FAQ assistant with broker-controlled answers.
- Document upload flow.
- Callback/quote/policy-change/simple request flow.
- Emergency assistance screen.
- Existing request check screen.

Broker:
- MFA login.
- Dashboard summary cards.
- Since You Were Away screen.
- Prioritized task list.
- Filterable/searchable cases.
- Case detail with summary, structured answers, documents, conversation, notes, tasks, notifications, and audit trail.
- Case update panel.
- Admin knowledge-base screen.

## F. AI Architecture

Retrieval:
- Store only broker-approved documents in the knowledge base.
- Associate knowledge entries with insurers and products where applicable.
- Search approved content before answering.
- Return source titles/categories with each general answer.

Guardrails:
- Detect policy-specific, coverage, payment, liability, claim approval, rejection, settlement, and interpretation questions.
- Use the safe escalation wording: “I can record this question for your broker to review. I don't want to give you incorrect information about your specific policy.”
- Automatically create a broker follow-up case for escalated questions.

Structured outputs:
- Claim intake answers map to typed claim fields.
- Missing information is extracted before completion.
- Broker summaries use a consistent format.
- Task extraction turns conversations into reviewable work items.

Production LLM plan:
- Add a provider adapter with strict system prompts and structured output schemas.
- Use retrieval context only from approved knowledge.
- Log prompt context, model output, guardrail decisions, and escalations.
- Keep broker/insurer decisions outside the model.

## G. Security Architecture

Implemented in MVP:
- Password hashing with scrypt and per-user salt.
- TOTP MFA for broker login.
- HTTP-only same-site broker session cookies.
- Server-side session records with expiry.
- Login rate limiting.
- Revocable and expiring client access links.
- Role-aware broker API access.
- Attachment file type, extension, size, hash, and storage-path validation.
- Private attachment download through broker authorization.
- Case-level audit logging.
- No cross-client lookup without reference plus contact identity.

Production hardening:
- Enforce HTTPS/HSTS at the edge.
- Use managed PostgreSQL encryption at rest and field encryption for highly sensitive identifiers.
- Store documents in private object storage with malware scanning before release.
- Add WAF/rate limits, bot controls, backup/restore drills, data retention policies, and country-specific privacy controls.
- Add staff permission matrices, account lockout, device/session management, and admin audit review.

## H. MVP Implementation Plan

MVP delivered in this build:
1. Secure client link.
2. Client identification.
3. Assistant welcome and large mobile actions.
4. Claim intake with dynamic claim questions.
5. Document uploads with validation, progress, and case association.
6. General insurance FAQ answers from broker knowledge base.
7. Automatic case creation.
8. Broker summary.
9. Automatic task creation.
10. Broker dashboard.
11. Queued broker/client notifications.
12. Case management with notes, statuses, tasks, documents, conversation, and audit trail.
13. Client confirmation reference.
14. Admin knowledge base.
15. Audit history.

Phase 2:
- Returning client account login.
- Full reusable smart forms, PDF generation, client signature, and downloads.
- Provider integrations for email, SMS, WhatsApp, and push.
- Production object storage and malware scanning.
- Staff assignment queues and permission presets.
- Insurer-specific claim checklists.
- Multilingual client assistant.

Phase 3:
- Policy document ingestion with controlled retrieval.
- Advanced analytics and SLA reporting.
- Insurer API submissions where available.
- Client mobile push notifications.
- Workflow automation rules.
- Data residency and retention packs per operating country.
- Broker-branded white-label configuration.

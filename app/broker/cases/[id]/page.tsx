import Link from "next/link";
import { notFound } from "next/navigation";
import { CaseUpdateForm } from "@/components/CaseUpdateForm";
import { BrokerNav } from "@/components/BrokerNav";
import { requireBrokerContext } from "@/lib/authz";
import { getCaseDetail } from "@/lib/caseQueries";
import { prisma } from "@/lib/prisma";

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const context = await requireBrokerContext();
  const broker = await prisma.broker.findUniqueOrThrow({ where: { id: context.brokerId } });
  const { id } = await params;
  const serviceCase = await getCaseDetail(context.brokerId, id);
  if (!serviceCase) notFound();
  const submittedAnswers =
    typeof serviceCase.submittedFormData.answers === "object" && serviceCase.submittedFormData.answers !== null
      ? (serviceCase.submittedFormData.answers as Record<string, unknown>)
      : {};

  return (
    <>
      <BrokerNav agencyName={broker.agencyName} />
      <main className="case-detail-shell">
        <div className="two-column">
          <section className="case-detail-panel">
            <p className="eyebrow">Case {serviceCase.reference}</p>
            <h2>{serviceCase.title}</h2>
            <p className="panel-copy">
              {serviceCase.client.fullName} · {serviceCase.client.phone} · {serviceCase.requestType.replace(/_/g, " ")}
            </p>
            <div className="button-row">
              <span className={`badge status-${serviceCase.status}`}>{serviceCase.status.replace(/_/g, " ")}</span>
              <span className={`badge priority-${serviceCase.priority}`}>{serviceCase.priority}</span>
              {serviceCase.afterHours && <span className="badge">After hours</span>}
            </div>

            <h3>Broker Summary</h3>
            <pre className="summary-pre">{serviceCase.aiSummary}</pre>

            <h3>Submitted Answers</h3>
            <div className="summary-block">
              {Object.entries(submittedAnswers).map(([key, value]) => (
                <div className="summary-row" key={key}>
                  <span>{key.replace(/([A-Z])/g, " $1")}</span>
                  <strong>{String(value)}</strong>
                </div>
              ))}
            </div>

            <h3>Documents</h3>
            <div className="attachment-list">
              {serviceCase.attachments.length === 0 && <p className="empty-state">No files attached.</p>}
              {serviceCase.attachments.map((attachment) => (
                <Link className="attachment-row" href={`/api/broker/attachments/${attachment.id}`} key={attachment.id}>
                  <span>{attachment.originalName}</span>
                  <small>{attachment.category}</small>
                </Link>
              ))}
            </div>

            <h3>Conversation</h3>
            <div className="chat-log">
              {serviceCase.conversations.flatMap((conversation) =>
                conversation.messages.map((message) => (
                  <div className={`message ${message.senderRole.toLowerCase()}`} key={message.id}>
                    {message.content}
                  </div>
                ))
              )}
            </div>

            <h3>Audit Trail</h3>
            <div className="timeline">
              {serviceCase.auditLogs.map((event) => (
                <div className="timeline-item" key={event.id}>
                  <strong>{formatDate(event.createdAt)}</strong>
                  <p>{event.action}</p>
                  <small>{event.actor?.name ?? event.actorType}</small>
                </div>
              ))}
            </div>

            <h3>Broker Notes</h3>
            <div className="task-list">
              {serviceCase.brokerNotes.length === 0 && <p className="empty-state">No broker notes yet.</p>}
              {serviceCase.brokerNotes.map((note) => (
                <article className="task-item" key={note.id}>
                  <strong>{note.author.name}</strong>
                  <p>{note.body}</p>
                  <small>{formatDate(note.createdAt)}</small>
                </article>
              ))}
            </div>
          </section>

          <aside>
            {serviceCase.missingInfo.length > 0 && (
              <section className="broker-panel warning-box">
                <strong>Missing Information</strong>
                <ul>
                  {serviceCase.missingInfo.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            )}
            <CaseUpdateForm
              caseId={serviceCase.id}
              initialStatus={serviceCase.status}
              tasks={serviceCase.tasks.map((task) => ({ id: task.id, title: task.title, status: task.status }))}
            />
          </aside>
        </div>
      </main>
    </>
  );
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(value);
}

import Link from "next/link";
import { AlertTriangle, ClipboardList, FileStack, MessageSquareWarning, PhoneCall, ShieldCheck } from "lucide-react";

type DashboardSummary = {
  cards: Record<string, number>;
  morning: Record<string, number>;
  priorityCases: Array<{
    id: string;
    reference: string;
    title: string;
    clientName: string;
    status: string;
    priority: string;
    createdAt: Date;
    attachmentCount: number;
    openTaskCount: number;
  }>;
};

type CaseRow = {
  id: string;
  reference: string;
  title: string;
  requestType: string;
  status: string;
  priority: string;
  createdAt: Date;
  client: { fullName: string; phone: string };
  attachments: unknown[];
  tasks: Array<{ status: string }>;
};

const statLabels: Array<{ key: string; label: string; icon: typeof ShieldCheck; href: string }> = [
  { key: "newRequests", label: "New requests", icon: ClipboardList, href: "/broker?view=new-requests#cases" },
  { key: "newClaims", label: "New claims", icon: ShieldCheck, href: "/broker?view=new-claims#cases" },
  { key: "urgentCases", label: "Urgent", icon: AlertTriangle, href: "/broker?view=urgent#cases" },
  { key: "documentsReceived", label: "Documents received", icon: FileStack, href: "/broker?view=documents#cases" },
  { key: "clientQuestions", label: "Client questions", icon: MessageSquareWarning, href: "/broker?view=questions#cases" },
  { key: "callbacks", label: "Callbacks", icon: PhoneCall, href: "/broker?view=callbacks#cases" },
  { key: "dueToday", label: "Tasks due today", icon: ClipboardList, href: "/broker?view=due-today#cases" },
  { key: "overdue", label: "Overdue tasks", icon: AlertTriangle, href: "/broker?view=overdue#cases" },
  { key: "formsAwaitingReview", label: "Forms awaiting review", icon: FileStack, href: "/broker?view=forms#cases" },
  { key: "recentlyCompleted", label: "Recently completed", icon: ShieldCheck, href: "/broker?view=recently-completed#cases" }
];

export function BrokerDashboard({ summary, cases }: { summary: DashboardSummary; cases: CaseRow[] }) {
  return (
    <div className="dashboard-shell">
      <section className="broker-panel">
        <p className="eyebrow">Since you were away</p>
        <h2>Morning View</h2>
        <p className="panel-copy">
          While you were away: {summary.morning.clientsContacted} clients contacted the portal, {summary.morning.newClaims} new claims were reported,{" "}
          {summary.morning.documentsReceived} documents were received, {summary.morning.questionsResolved} questions were resolved automatically,{" "}
          {summary.morning.questionsEscalated} questions require review, {summary.morning.callbacks} clients requested callbacks, and{" "}
          {summary.morning.urgentCases} cases are urgent.
        </p>
      </section>

      <section className="stat-grid" aria-label="Dashboard summary">
        {statLabels.map((item) => {
          const Icon = item.icon;
          return (
            <Link className="stat-card" href={item.href} key={item.key} aria-label={`View ${item.label}`}>
              <small>
                <Icon size={15} /> {item.label}
              </small>
              <strong>{summary.cards[item.key] ?? 0}</strong>
            </Link>
          );
        })}
      </section>

      <section className="broker-panel" id="cases">
        <div className="panel-header">
          <h2>Prioritized Task List</h2>
        </div>
        <div className="task-list">
          {summary.priorityCases.length === 0 && <p className="empty-state">No open cases yet.</p>}
          {summary.priorityCases.map((item) => (
            <Link className="task-item" href={`/broker/cases/${item.id}`} key={item.id}>
              <strong>
                {item.reference} · {item.title}
              </strong>
              <span>{item.clientName}</span>
              <span>
                <span className={`badge priority-${item.priority}`}>{item.priority}</span> {item.openTaskCount} open tasks · {item.attachmentCount} files
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="broker-panel">
        <div className="panel-header">
          <h2>Cases</h2>
        </div>
        <form className="filter-row" action="/broker">
          <input className="text-field" name="q" placeholder="Search reference, client, phone, or description" />
          <select className="text-field" name="status">
            <option value="">Any status</option>
            <option value="AWAITING_BROKER_REVIEW">Awaiting broker review</option>
            <option value="URGENT">Urgent</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="AWAITING_CLIENT_INFORMATION">Awaiting client information</option>
            <option value="COMPLETED">Completed</option>
          </select>
          <button className="primary-button" type="submit">
            Filter
          </button>
        </form>
        <table className="case-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Client</th>
              <th>Request</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Files</th>
              <th>Open Tasks</th>
              <th>Received</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((serviceCase) => (
              <tr key={serviceCase.id}>
                <td>
                  <Link className="ghost-button" href={`/broker/cases/${serviceCase.id}`}>
                    {serviceCase.reference}
                  </Link>
                </td>
                <td>
                  {serviceCase.client.fullName}
                  <br />
                  <small>{serviceCase.client.phone}</small>
                </td>
                <td>{serviceCase.title}</td>
                <td>
                  <span className={`badge status-${serviceCase.status}`}>{serviceCase.status.replace(/_/g, " ")}</span>
                </td>
                <td className={`priority-${serviceCase.priority}`}>{serviceCase.priority}</td>
                <td>{serviceCase.attachments.length}</td>
                <td>{serviceCase.tasks.filter((task) => task.status !== "DONE").length}</td>
                <td>{formatDate(serviceCase.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(value);
}

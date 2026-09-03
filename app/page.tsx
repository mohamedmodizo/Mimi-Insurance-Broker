import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function HomePage() {
  return (
    <main className="entry-screen">
      <section className="entry-band">
        <div className="entry-content">
          <div className="brand-row">
            <div className="brand-mark" aria-hidden="true">
              <ShieldCheck size={28} />
            </div>
            <div>
              <p className="eyebrow">Insurance client service desk</p>
              <h1>24/7 Client Assistance Portal</h1>
            </div>
          </div>
          <p className="entry-copy">
            Clients can report claims, upload evidence, ask approved insurance questions, and leave after-hours instructions.
            Brokers get a clear morning dashboard with cases, tasks, summaries, documents, and audit history.
          </p>
          <div className="entry-actions">
            <Link className="primary-button" href="/access/demo-secure-link-2026">
              Open Combined Access
            </Link>
            <Link className="secondary-button" href="/broker/login">
              Broker Login
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

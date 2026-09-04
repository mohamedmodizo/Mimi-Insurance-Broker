import Link from "next/link";
import { BriefcaseBusiness, MessageCircle, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { validatePortalToken } from "@/lib/portalAccess";
import { InsurerBackdrop } from "@/components/InsurerBackdrop";

export default async function AccessPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const accessLink = await validatePortalToken(token);
  if (!accessLink) notFound();

  return (
    <main className="entry-screen">
      <section className="entry-band access-band">
        <InsurerBackdrop variant="campaign" />
        <div className="entry-content access-content">
          <div className="brand-row">
            <div className="brand-mark" aria-hidden="true">
              <ShieldCheck size={28} />
            </div>
            <div>
              <p className="eyebrow">24/7 insurance service desk</p>
              <h1>{accessLink.broker.agencyName}</h1>
            </div>
          </div>

          <p className="entry-copy">Choose how you want to continue.</p>

          <div className="access-grid" aria-label="Portal access options">
            <Link className="access-card" href={`/portal/${token}`}>
              <span className="tile-icon" aria-hidden="true">
                <MessageCircle size={24} />
              </span>
              <span>
                <strong>Client Portal</strong>
                <small>Report a claim, upload documents, ask a question, or request help.</small>
              </span>
            </Link>

            <Link className="access-card broker-access-card" href={`/broker/login?returnTo=${encodeURIComponent(`/access/${token}`)}`}>
              <span className="tile-icon" aria-hidden="true">
                <BriefcaseBusiness size={24} />
              </span>
              <span>
                <strong>Broker Login</strong>
                <small>Secure staff access for cases, tasks, documents, and follow-up.</small>
              </span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

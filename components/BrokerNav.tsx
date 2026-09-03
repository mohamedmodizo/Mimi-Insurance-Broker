"use client";

import Link from "next/link";
import { LogOut, ShieldCheck } from "lucide-react";

export function BrokerNav({ agencyName }: { agencyName: string }) {
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/broker/login";
  }

  return (
    <nav className="broker-nav">
      <Link className="brand-row" href="/broker">
        <div className="brand-mark" aria-hidden="true">
          <ShieldCheck size={24} />
        </div>
        <div>
          <p className="eyebrow">Broker workspace</p>
          <h1>{agencyName}</h1>
        </div>
      </Link>
      <div className="broker-nav-links">
        <Link className="ghost-button" href="/broker">
          Dashboard
        </Link>
        <Link className="ghost-button" href="/admin/knowledge">
          Knowledge Base
        </Link>
        <button className="ghost-button" onClick={logout} type="button">
          <LogOut size={18} /> Sign out
        </button>
      </div>
    </nav>
  );
}

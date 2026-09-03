"use client";

import { FormEvent, useEffect, useState } from "react";
import { BookOpenCheck } from "lucide-react";

type KnowledgeDocument = {
  id: string;
  title: string;
  category: string;
  content: string;
  updatedAt: string;
  insurer?: { name: string } | null;
};

type Insurer = {
  id: string;
  name: string;
};

export function KnowledgeAdmin() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [insurers, setInsurers] = useState<Insurer[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [insurerId, setInsurerId] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const response = await fetch("/api/admin/knowledge");
    const payload = (await response.json()) as { documents: KnowledgeDocument[]; insurers: Insurer[] };
    setDocuments(payload.documents ?? []);
    setInsurers(payload.insurers ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/admin/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, category, content, insurerId: insurerId || null, tags: [] })
    });
    if (!response.ok) {
      setMessage("Could not save document.");
      return;
    }
    setTitle("");
    setCategory("");
    setContent("");
    setInsurerId("");
    setMessage("Knowledge document approved and available to the assistant.");
    await load();
  }

  return (
    <div className="dashboard-shell">
      <section className="broker-panel">
        <p className="eyebrow">Admin</p>
        <h2>Broker Knowledge Base</h2>
        <p className="panel-copy">Approved entries are used by the assistant. Coverage decisions and final policy interpretations are still escalated.</p>
      </section>

      <div className="two-column">
        <form className="broker-panel" onSubmit={submit}>
          <h2>Add Approved Guidance</h2>
          <label className="question-label" htmlFor="kb-title">
            Title
          </label>
          <input className="text-field" id="kb-title" onChange={(event) => setTitle(event.target.value)} value={title} />
          <label className="question-label" htmlFor="kb-category">
            Category
          </label>
          <input className="text-field" id="kb-category" onChange={(event) => setCategory(event.target.value)} value={category} />
          <label className="question-label" htmlFor="kb-insurer">
            Insurer
          </label>
          <select className="text-field" id="kb-insurer" onChange={(event) => setInsurerId(event.target.value)} value={insurerId}>
            <option value="">General broker guidance</option>
            {insurers.map((insurer) => (
              <option key={insurer.id} value={insurer.id}>
                {insurer.name}
              </option>
            ))}
          </select>
          <label className="question-label" htmlFor="kb-content">
            Approved answer or procedure
          </label>
          <textarea className="text-field" id="kb-content" onChange={(event) => setContent(event.target.value)} rows={8} value={content} />
          {message && <p className="source-text">{message}</p>}
          <button className="primary-button full-width" disabled={!title || !category || content.length < 10} type="submit">
            Approve Guidance
          </button>
        </form>

        <section className="broker-panel">
          <h2>Approved Documents</h2>
          <div className="task-list">
            {documents.map((document) => (
              <article className="task-item" key={document.id}>
                <strong>
                  <BookOpenCheck size={16} /> {document.title}
                </strong>
                <span>{document.category}</span>
                <small>{document.insurer?.name ?? "General"}</small>
                <p>{document.content}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

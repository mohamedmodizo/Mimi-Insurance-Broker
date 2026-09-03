"use client";

import { FormEvent, useState } from "react";

const caseStatuses = [
  "NEW",
  "AWAITING_BROKER_REVIEW",
  "AWAITING_CLIENT_INFORMATION",
  "AWAITING_INSURER",
  "IN_PROGRESS",
  "URGENT",
  "COMPLETED",
  "CLOSED"
];

const taskStatuses = ["OPEN", "IN_PROGRESS", "DONE", "BLOCKED"];

export function CaseUpdateForm({
  caseId,
  initialStatus,
  tasks
}: {
  caseId: string;
  initialStatus: string;
  tasks: Array<{ id: string; title: string; status: string }>;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [note, setNote] = useState("");
  const [taskStates, setTaskStates] = useState<Record<string, string>>(
    Object.fromEntries(tasks.map((task) => [task.id, task.status]))
  );
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function save(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const response = await fetch(`/api/broker/cases/${caseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        note,
        taskUpdates: Object.entries(taskStates).map(([id, taskStatus]) => ({ id, status: taskStatus }))
      })
    });
    setLoading(false);
    if (!response.ok) {
      setMessage("Update failed.");
      return;
    }
    setNote("");
    setMessage("Saved.");
    window.location.reload();
  }

  return (
    <form className="broker-panel" onSubmit={save}>
      <h2>Broker Action</h2>
      <label className="question-label" htmlFor="case-status">
        Status
      </label>
      <select className="text-field" id="case-status" onChange={(event) => setStatus(event.target.value)} value={status}>
        {caseStatuses.map((item) => (
          <option key={item} value={item}>
            {item.replace(/_/g, " ")}
          </option>
        ))}
      </select>

      <div className="task-list">
        {tasks.map((task) => (
          <label className="task-item" key={task.id}>
            <strong>{task.title}</strong>
            <select
              className="text-field"
              onChange={(event) => setTaskStates((current) => ({ ...current, [task.id]: event.target.value }))}
              value={taskStates[task.id]}
            >
              {taskStatuses.map((item) => (
                <option key={item} value={item}>
                  {item.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <label className="question-label" htmlFor="broker-note">
        Add broker note
      </label>
      <textarea className="text-field" id="broker-note" onChange={(event) => setNote(event.target.value)} rows={4} value={note} />
      {message && <p className="source-text">{message}</p>}
      <button className="primary-button full-width" disabled={loading} type="submit">
        {loading ? "Saving..." : "Save Case Update"}
      </button>
    </form>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";

type Reminder = {
  id: string;
  title: string;
  message: string | null;
  dueAt: string;
  channel: "EMAIL" | "INAPP";
  sentAt: string | null;
  dismissedAt: string | null;
};

export default function RemindersPanel({ clientId, canSchedule }: { clientId: string; canSchedule: boolean }) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/reminders?clientId=${clientId}`, { cache: "no-store" });
    if (res.ok) setReminders((await res.json()).reminders);
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.currentTarget;
    const payload = { ...Object.fromEntries(new FormData(form).entries()), clientId };
    const res = await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({})))?.error ?? "Could not schedule");
      return;
    }
    form.reset();
    load();
  }

  async function dismiss(id: string) {
    await fetch(`/api/reminders/${id}`, { method: "PATCH" });
    load();
  }
  async function remove(id: string) {
    await fetch(`/api/reminders/${id}`, { method: "DELETE" });
    load();
  }

  const now = Date.now();

  return (
    <div className="space-y-5">
      {canSchedule && (
        <form onSubmit={add} className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Title</label>
            <input className="input" name="title" required placeholder="Don't forget leg day!" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Message</label>
            <textarea className="input" name="message" rows={2} placeholder="Optional details…" />
          </div>
          <div>
            <label className="label">When</label>
            <input className="input" name="dueAt" type="datetime-local" required />
          </div>
          <div>
            <label className="label">Channel</label>
            <select className="input" name="channel" defaultValue="INAPP">
              <option value="INAPP">In-app</option>
              <option value="EMAIL">Email</option>
            </select>
          </div>
          {error && <p className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <div className="sm:col-span-2">
            <button className="btn-primary" disabled={loading}>{loading ? "Scheduling…" : "Schedule reminder"}</button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {reminders.length === 0 && <p className="text-sm text-slate-400">No reminders.</p>}
        {reminders.map((r) => {
          const due = new Date(r.dueAt).getTime() <= now;
          const state = r.dismissedAt ? "dismissed" : r.sentAt ? "sent" : due ? "due" : "scheduled";
          return (
            <div key={r.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 p-3">
              <div>
                <div className="font-medium">{r.title}</div>
                {r.message && <div className="text-sm text-slate-600">{r.message}</div>}
                <div className="mt-1 text-xs text-slate-400">
                  {new Date(r.dueAt).toLocaleString()} · {r.channel === "EMAIL" ? "email" : "in-app"} ·{" "}
                  <span className="capitalize">{state}</span>
                </div>
              </div>
              <div className="flex shrink-0 gap-2 text-sm">
                {!canSchedule && !r.dismissedAt && due && (
                  <button className="text-brand hover:underline" onClick={() => dismiss(r.id)}>Got it</button>
                )}
                {canSchedule && (
                  <button className="text-red-500 hover:underline" onClick={() => remove(r.id)}>Delete</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddClientForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not add client");
      return;
    }
    form.reset();
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button className="btn-primary" onClick={() => setOpen(true)}>
        + Add client
      </button>
    );
  }

  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">New client</h3>
        <button className="text-sm text-slate-500 hover:text-slate-800" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Full name</label>
          <input className="input" name="name" required placeholder="Maria Lopez" />
        </div>
        <div>
          <label className="label">Email (their login)</label>
          <input className="input" name="email" type="email" required placeholder="maria@email.com" />
        </div>
        <div>
          <label className="label">Temporary password</label>
          <input className="input" name="password" type="text" required minLength={8} placeholder="min 8 chars" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Height (cm)</label>
            <input className="input" name="heightCm" type="number" step="0.1" placeholder="168" />
          </div>
          <div>
            <label className="label">Start weight (kg)</label>
            <input className="input" name="startWeight" type="number" step="0.1" placeholder="82" />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Notes</label>
          <textarea className="input" name="notes" rows={2} placeholder="Goals, injuries, preferences…" />
        </div>
        {error && <p className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <div className="sm:col-span-2">
          <button className="btn-primary" disabled={loading}>
            {loading ? "Adding…" : "Create client"}
          </button>
          <p className="mt-2 text-xs text-slate-500">
            Share the email + temporary password with your client so they can log in.
          </p>
        </div>
      </form>
    </div>
  );
}

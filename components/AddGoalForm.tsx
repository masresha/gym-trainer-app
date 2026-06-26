"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TYPES = [
  { value: "WEIGHT", label: "Bodyweight", unit: "kg" },
  { value: "STRENGTH", label: "Strength", unit: "kg" },
  { value: "ENDURANCE", label: "Endurance", unit: "km" },
  { value: "HABIT", label: "Habit", unit: "sessions/wk" },
  { value: "CUSTOM", label: "Custom", unit: "" },
];

export default function AddGoalForm({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unit, setUnit] = useState("kg");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.currentTarget;
    const payload = { ...Object.fromEntries(new FormData(form).entries()), clientId };
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not add goal");
      return;
    }
    form.reset();
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button className="btn-ghost text-sm" onClick={() => setOpen(true)}>
        + Add goal
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="label">Goal</label>
        <input className="input" name="title" required placeholder="Reach 74 kg bodyweight" />
      </div>
      <div>
        <label className="label">Type</label>
        <select
          className="input"
          name="type"
          defaultValue="WEIGHT"
          onChange={(e) => setUnit(TYPES.find((t) => t.value === e.target.value)?.unit ?? "")}
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Unit</label>
        <input className="input" name="unit" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="kg" />
      </div>
      <div>
        <label className="label">Start value</label>
        <input className="input" name="startValue" type="number" step="0.1" placeholder="82" />
      </div>
      <div>
        <label className="label">Current value</label>
        <input className="input" name="currentValue" type="number" step="0.1" placeholder="82" />
      </div>
      <div>
        <label className="label">Target value</label>
        <input className="input" name="targetValue" type="number" step="0.1" placeholder="74" />
      </div>
      <div>
        <label className="label">Target date</label>
        <input className="input" name="dueDate" type="date" />
      </div>
      {error && <p className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      <div className="sm:col-span-2 flex gap-2">
        <button className="btn-primary" disabled={loading}>{loading ? "Saving…" : "Save goal"}</button>
        <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </form>
  );
}

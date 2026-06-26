"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function AddProgressForm({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.currentTarget;
    const payload = { ...Object.fromEntries(new FormData(form).entries()), clientId };
    const res = await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save");
      return;
    }
    form.reset();
    (form.elements.namedItem("date") as HTMLInputElement).value = todayISO();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div>
        <label className="label">Date</label>
        <input className="input" name="date" type="date" defaultValue={todayISO()} />
      </div>
      <div>
        <label className="label">Weight (kg)</label>
        <input className="input" name="weight" type="number" step="0.1" placeholder="78.4" />
      </div>
      <div>
        <label className="label">Body fat (%)</label>
        <input className="input" name="bodyFatPct" type="number" step="0.1" placeholder="28" />
      </div>
      <div className="flex items-end">
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Saving…" : "Log"}
        </button>
      </div>
      {error && <p className="col-span-full rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
    </form>
  );
}

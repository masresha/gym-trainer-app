"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CompleteWorkoutButton({ workoutId }: { workoutId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(status: "COMPLETED" | "SKIPPED", e?: React.FormEvent<HTMLFormElement>) {
    e?.preventDefault();
    setBusy(true);
    const body: Record<string, unknown> = { status };
    if (e) {
      const fd = new FormData(e.currentTarget);
      body.perceivedRpe = fd.get("perceivedRpe") || undefined;
      body.clientNote = fd.get("clientNote") || undefined;
    }
    await fetch(`/api/workouts/${workoutId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <div className="flex gap-2">
        <button className="btn-primary text-sm" onClick={() => setOpen(true)}>Mark complete</button>
        <button className="btn-ghost text-sm" disabled={busy} onClick={() => submit("SKIPPED")}>Skip</button>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => submit("COMPLETED", e)} className="grid gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-3">
      <div>
        <label className="label">Effort (RPE 1–10)</label>
        <input className="input" name="perceivedRpe" type="number" min={1} max={10} placeholder="7" />
      </div>
      <div className="sm:col-span-2">
        <label className="label">How did it feel?</label>
        <input className="input" name="clientNote" placeholder="Squats felt easier than last week" />
      </div>
      <div className="sm:col-span-3 flex gap-2">
        <button className="btn-primary text-sm" disabled={busy}>Save & complete</button>
        <button type="button" className="btn-ghost text-sm" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </form>
  );
}

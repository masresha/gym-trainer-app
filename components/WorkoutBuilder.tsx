"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Ex = { name: string; sets: string; reps: string; weight: string; restSec: string; notes: string };

const emptyEx = (): Ex => ({ name: "", sets: "", reps: "", weight: "", restSec: "", notes: "" });

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function WorkoutBuilder({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Ex[]>([emptyEx()]);
  const [library, setLibrary] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    fetch("/api/library", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setLibrary((d.items ?? []).map((i: { name: string }) => i.name)));
  }, [open]);

  function updateEx(i: number, field: keyof Ex, val: string) {
    setExercises((prev) => prev.map((ex, idx) => (idx === i ? { ...ex, [field]: val } : ex)));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);

    const cleaned = exercises
      .filter((ex) => ex.name.trim())
      .map((ex) => ({
        name: ex.name.trim(),
        sets: ex.sets || undefined,
        reps: ex.reps || undefined,
        weight: ex.weight || undefined,
        restSec: ex.restSec || undefined,
        notes: ex.notes || undefined,
      }));

    if (cleaned.length === 0) {
      setError("Add at least one exercise with a name");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        title: fd.get("title"),
        description: fd.get("description"),
        scheduledFor: fd.get("scheduledFor"),
        exercises: cleaned,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not send workout");
      return;
    }
    form.reset();
    setExercises([emptyEx()]);
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button className="btn-primary text-sm" onClick={() => setOpen(true)}>
        + Send workout
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 space-y-4 rounded-xl bg-slate-50 p-4">
      <datalist id="exercise-library">
        {library.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="label">Workout title</label>
          <input className="input" name="title" required placeholder="Home Session — No Equipment" />
        </div>
        <div>
          <label className="label">Scheduled for</label>
          <input className="input" name="scheduledFor" type="date" defaultValue={todayISO()} required />
        </div>
        <div className="sm:col-span-3">
          <label className="label">Notes for client</label>
          <textarea className="input" name="description" rows={2} placeholder="3 rounds, minimal rest. Message me if anything hurts." />
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="label mb-0">Exercises</span>
        </div>
        <div className="space-y-2">
          {exercises.map((ex, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 rounded-lg bg-white p-2 ring-1 ring-slate-200">
              <input
                className="input col-span-12 sm:col-span-4"
                placeholder="Exercise name"
                list="exercise-library"
                value={ex.name}
                onChange={(e) => updateEx(i, "name", e.target.value)}
              />
              <input className="input col-span-3 sm:col-span-1" placeholder="Sets" value={ex.sets} onChange={(e) => updateEx(i, "sets", e.target.value)} />
              <input className="input col-span-3 sm:col-span-2" placeholder="Reps" value={ex.reps} onChange={(e) => updateEx(i, "reps", e.target.value)} />
              <input className="input col-span-3 sm:col-span-2" placeholder="kg" value={ex.weight} onChange={(e) => updateEx(i, "weight", e.target.value)} />
              <input className="input col-span-3 sm:col-span-2" placeholder="Rest s" value={ex.restSec} onChange={(e) => updateEx(i, "restSec", e.target.value)} />
              <button
                type="button"
                className="col-span-12 sm:col-span-1 text-sm text-red-500 hover:underline"
                onClick={() => setExercises((p) => (p.length > 1 ? p.filter((_, idx) => idx !== i) : p))}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="btn-ghost mt-2 text-sm"
          onClick={() => setExercises((p) => [...p, emptyEx()])}
        >
          + Add exercise
        </button>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button className="btn-primary" disabled={loading}>{loading ? "Sending…" : "Send to client"}</button>
        <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </form>
  );
}

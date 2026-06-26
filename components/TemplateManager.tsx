"use client";

import { useCallback, useEffect, useState } from "react";

type Ex = { name: string; sets: string; reps: string; weight: string; restSec: string };
const emptyEx = (): Ex => ({ name: "", sets: "", reps: "", weight: "", restSec: "" });

type Template = {
  id: string;
  title: string;
  description: string | null;
  exercises: { id: string; name: string; sets: number | null; reps: string | null; weight: number | null }[];
};

export default function TemplateManager() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [exercises, setExercises] = useState<Ex[]>([emptyEx()]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/templates", { cache: "no-store" });
    if (res.ok) setTemplates((await res.json()).templates);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function updateEx(i: number, field: keyof Ex, val: string) {
    setExercises((prev) => prev.map((ex, idx) => (idx === i ? { ...ex, [field]: val } : ex)));
  }

  async function create(e: React.FormEvent<HTMLFormElement>) {
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
      }));
    if (cleaned.length === 0) {
      setError("Add at least one exercise");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: fd.get("title"), description: fd.get("description"), exercises: cleaned }),
    });
    setLoading(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({})))?.error ?? "Could not save");
      return;
    }
    form.reset();
    setExercises([emptyEx()]);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this template?")) return;
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <form onSubmit={create} className="card h-fit space-y-3">
        <h3 className="font-semibold">New template</h3>
        <div>
          <label className="label">Title</label>
          <input className="input" name="title" required placeholder="Upper Body Hypertrophy" />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input" name="description" rows={2} placeholder="Tempo work, 2 min rest on compounds." />
        </div>
        <div>
          <span className="label">Exercises</span>
          <div className="space-y-2">
            {exercises.map((ex, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 rounded-lg bg-slate-50 p-2">
                <input className="input col-span-12 sm:col-span-5" placeholder="Name" value={ex.name} onChange={(e) => updateEx(i, "name", e.target.value)} />
                <input className="input col-span-3 sm:col-span-2" placeholder="Sets" value={ex.sets} onChange={(e) => updateEx(i, "sets", e.target.value)} />
                <input className="input col-span-3 sm:col-span-2" placeholder="Reps" value={ex.reps} onChange={(e) => updateEx(i, "reps", e.target.value)} />
                <input className="input col-span-3 sm:col-span-2" placeholder="kg" value={ex.weight} onChange={(e) => updateEx(i, "weight", e.target.value)} />
                <button type="button" className="col-span-3 sm:col-span-1 text-sm text-red-500" onClick={() => setExercises((p) => (p.length > 1 ? p.filter((_, idx) => idx !== i) : p))}>✕</button>
              </div>
            ))}
          </div>
          <button type="button" className="btn-ghost mt-2 text-sm" onClick={() => setExercises((p) => [...p, emptyEx()])}>+ Add exercise</button>
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <button className="btn-primary" disabled={loading}>{loading ? "Saving…" : "Save template"}</button>
      </form>

      <div className="space-y-3">
        {templates.length === 0 && <p className="text-sm text-slate-400">No templates yet. Build one to reuse across clients.</p>}
        {templates.map((t) => (
          <div key={t.id} className="card">
            <div className="flex items-start justify-between">
              <h4 className="font-semibold">{t.title}</h4>
              <button className="text-sm text-red-500 hover:underline" onClick={() => remove(t.id)}>Delete</button>
            </div>
            {t.description && <p className="mt-1 text-sm text-slate-600">{t.description}</p>}
            <ul className="mt-2 text-sm text-slate-500">
              {t.exercises.map((ex) => (
                <li key={ex.id}>• {ex.name}{ex.sets ? ` — ${ex.sets}×${ex.reps ?? ""}` : ""}{ex.weight ? ` @${ex.weight}kg` : ""}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-slate-400">Assign this to a client from their page → Workouts tab.</p>
          </div>
        ))}
      </div>
    </div>
  );
}

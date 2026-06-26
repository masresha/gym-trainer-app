"use client";

import { useCallback, useEffect, useState } from "react";

type Item = {
  id: string;
  name: string;
  category: string | null;
  videoUrl: string | null;
  description: string | null;
};

export default function LibraryManager() {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/library", { cache: "no-store" });
    if (res.ok) setItems((await res.json()).items);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    const res = await fetch("/api/library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({})))?.error ?? "Could not save");
      return;
    }
    form.reset();
    load();
  }

  async function remove(id: string) {
    if (!confirm("Remove this exercise from your library?")) return;
    await fetch(`/api/library/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      <form onSubmit={add} className="card h-fit space-y-3">
        <h3 className="font-semibold">Add exercise</h3>
        <div>
          <label className="label">Name</label>
          <input className="input" name="name" required placeholder="Barbell Back Squat" />
        </div>
        <div>
          <label className="label">Category</label>
          <input className="input" name="category" placeholder="Legs" />
        </div>
        <div>
          <label className="label">Video URL</label>
          <input className="input" name="videoUrl" type="url" placeholder="https://youtube.com/…" />
        </div>
        <div>
          <label className="label">Cues / description</label>
          <textarea className="input" name="description" rows={2} placeholder="Brace, knees out, controlled descent." />
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <button className="btn-primary" disabled={loading}>{loading ? "Saving…" : "Add to library"}</button>
      </form>

      <div className="space-y-3">
        {items.length === 0 && <p className="text-sm text-slate-400">Your library is empty. Add your first exercise.</p>}
        {items.map((it) => (
          <div key={it.id} className="card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">{it.name}</div>
                {it.category && <span className="badge bg-slate-100 text-slate-600 mt-1">{it.category}</span>}
              </div>
              <button className="text-sm text-red-500 hover:underline" onClick={() => remove(it.id)}>Delete</button>
            </div>
            {it.description && <p className="mt-2 text-sm text-slate-600">{it.description}</p>}
            {it.videoUrl && (
              <a href={it.videoUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-medium text-brand hover:underline">
                ▶ Watch demo video
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

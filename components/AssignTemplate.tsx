"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Template = { id: string; title: string };

export default function AssignTemplate({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateId, setTemplateId] = useState("");
  const [dates, setDates] = useState<string[]>([new Date().toISOString().slice(0, 10)]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetch("/api/templates", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { templates: [] }))
      .then((d) => {
        setTemplates(d.templates);
        if (d.templates[0]) setTemplateId(d.templates[0].id);
      });
  }, [open]);

  async function assign() {
    setError(null);
    const validDates = dates.filter(Boolean);
    if (!templateId) return setError("Pick a template");
    if (validDates.length === 0) return setError("Add at least one date");
    setLoading(true);
    const res = await fetch(`/api/templates/${templateId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, dates: validDates }),
    });
    setLoading(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({})))?.error ?? "Could not assign");
      return;
    }
    setOpen(false);
    setDates([new Date().toISOString().slice(0, 10)]);
    router.refresh();
  }

  if (!open) {
    return <button className="btn-ghost text-sm" onClick={() => setOpen(true)}>Assign from template</button>;
  }

  return (
    <div className="mt-3 space-y-3 rounded-xl bg-slate-50 p-4">
      {templates.length === 0 ? (
        <p className="text-sm text-slate-500">
          No templates yet. Create one on the <b>Templates</b> page first.
        </p>
      ) : (
        <>
          <div>
            <label className="label">Template</label>
            <select className="input" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Dates (one workout per date = a program)</label>
            <div className="space-y-2">
              {dates.map((d, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className="input"
                    type="date"
                    value={d}
                    onChange={(e) => setDates((prev) => prev.map((x, idx) => (idx === i ? e.target.value : x)))}
                  />
                  <button
                    type="button"
                    className="text-sm text-red-500"
                    onClick={() => setDates((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev))}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className="btn-ghost mt-2 text-sm" onClick={() => setDates((p) => [...p, ""])}>
              + Add date
            </button>
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        </>
      )}
      <div className="flex gap-2">
        {templates.length > 0 && (
          <button className="btn-primary" onClick={assign} disabled={loading}>
            {loading ? "Assigning…" : "Assign"}
          </button>
        )}
        <button className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";

type Photo = { id: string; url: string; takenAt: string; note: string | null };

export default function PhotoGallery({ clientId }: { clientId: string }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/photos?clientId=${clientId}`, { cache: "no-store" });
    if (res.ok) setPhotos((await res.json()).photos);
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  async function upload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("clientId", clientId);
    if (!(fd.get("file") instanceof File) || (fd.get("file") as File).size === 0) {
      setError("Choose an image first");
      return;
    }
    setUploading(true);
    const res = await fetch("/api/photos", { method: "POST", body: fd });
    setUploading(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({})))?.error ?? "Upload failed");
      return;
    }
    form.reset();
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this photo?")) return;
    await fetch(`/api/photos/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-5">
      <form onSubmit={upload} className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-[1fr_1fr_auto]">
        <div>
          <label className="label">Photo</label>
          <input className="input" name="file" type="file" accept="image/*" required />
        </div>
        <div>
          <label className="label">Note</label>
          <input className="input" name="note" placeholder="Front, week 8" />
        </div>
        <div className="flex items-end">
          <button className="btn-primary w-full" disabled={uploading}>{uploading ? "Uploading…" : "Upload"}</button>
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 sm:col-span-3">{error}</p>}
      </form>

      {photos.length === 0 ? (
        <p className="text-sm text-slate-400">No progress photos yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((p) => (
            <div key={p.id} className="group relative overflow-hidden rounded-xl ring-1 ring-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.note ?? "progress photo"} className="aspect-square w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 text-[11px] text-white">
                {new Date(p.takenAt).toLocaleDateString()}
                {p.note ? ` · ${p.note}` : ""}
              </div>
              <button
                onClick={() => remove(p.id)}
                className="absolute right-1 top-1 hidden rounded-full bg-white/90 px-2 py-0.5 text-xs text-red-600 group-hover:block"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";

type Sample = {
  id: string;
  date: string;
  steps: number | null;
  restingHr: number | null;
  sleepMinutes: number | null;
  activeCalories: number | null;
  source: string | null;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function HealthPanel({ clientId, canManageToken }: { clientId: string; canManageToken: boolean }) {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/health?clientId=${clientId}`, { cache: "no-store" });
    if (res.ok) setSamples((await res.json()).samples);
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  async function addManual(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const payload = { ...Object.fromEntries(new FormData(form).entries()), clientId };
    await fetch("/api/health", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    form.reset();
    load();
  }

  async function genToken() {
    const res = await fetch("/api/health/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId }),
    });
    if (res.ok) setToken((await res.json()).token);
  }

  const ingestUrl =
    typeof window !== "undefined" ? `${window.location.origin}/api/sync/health` : "/api/sync/health";

  return (
    <div className="space-y-5">
      {canManageToken && (
        <div className="rounded-xl bg-slate-50 p-4 text-sm">
          <div className="font-semibold">Connect a wearable / Apple Health</div>
          <p className="mt-1 text-slate-600">
            Generate a sync token, then point a bridge (Apple Health <b>Auto Export</b>, Terra, or a Fitbit
            relay) at the ingestion endpoint. True Apple Health needs a device-side exporter — this is the
            destination it forwards daily metrics to.
          </p>
          <button className="btn-ghost mt-3 text-sm" onClick={genToken}>
            {token ? "Regenerate token" : "Generate sync token"}
          </button>
          {token && (
            <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
{`curl -X POST ${ingestUrl} \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json" \\
  -d '{"samples":[{"date":"${todayISO()}","steps":8412,"restingHr":58,"sleepMinutes":437,"activeCalories":520,"source":"apple_health"}]}'`}
            </pre>
          )}
        </div>
      )}

      <form onSubmit={addManual} className="grid grid-cols-2 gap-2 sm:grid-cols-6">
        <input className="input col-span-2 sm:col-span-1" name="date" type="date" defaultValue={todayISO()} required />
        <input className="input" name="steps" type="number" placeholder="Steps" />
        <input className="input" name="restingHr" type="number" placeholder="Rest HR" />
        <input className="input" name="sleepMinutes" type="number" placeholder="Sleep (min)" />
        <input className="input" name="activeCalories" type="number" placeholder="Active kcal" />
        <button className="btn-primary" disabled={loading}>{loading ? "…" : "Log"}</button>
      </form>

      <div className="overflow-x-auto">
        {samples.length === 0 ? (
          <p className="text-sm text-slate-400">No health data yet. Log manually or connect a wearable.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="py-2">Date</th>
                <th>Steps</th>
                <th>Rest HR</th>
                <th>Sleep</th>
                <th>Active kcal</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {samples.map((s) => (
                <tr key={s.id}>
                  <td className="py-2">{new Date(s.date).toLocaleDateString()}</td>
                  <td>{s.steps?.toLocaleString() ?? "—"}</td>
                  <td>{s.restingHr ?? "—"}</td>
                  <td>{s.sleepMinutes != null ? `${Math.floor(s.sleepMinutes / 60)}h ${s.sleepMinutes % 60}m` : "—"}</td>
                  <td>{s.activeCalories ?? "—"}</td>
                  <td className="text-slate-400">{s.source ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

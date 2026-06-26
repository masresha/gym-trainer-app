"use client";

import { useCallback, useEffect, useState } from "react";

type Status = {
  token: string | null;
  connected: boolean;
  lastSyncedAt: string | null;
  lastSource: string | null;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="shrink-0 rounded-md bg-slate-200 px-2 py-1 text-xs font-medium hover:bg-slate-300"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard may be unavailable */
        }
      }}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export default function ConnectAppleWatch({ clientId }: { clientId: string }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const load = useCallback(async () => {
    const res = await fetch(`/api/health/token?clientId=${clientId}`, { cache: "no-store" });
    if (res.ok) setStatus(await res.json());
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  async function generate() {
    setBusy(true);
    await fetch("/api/health/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId }),
    });
    await load();
    setBusy(false);
  }

  async function disconnect() {
    if (!confirm("Disconnect Apple Watch? Your existing data stays, but new syncs will stop until you reconnect.")) return;
    setBusy(true);
    await fetch("/api/health/token", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId }),
    });
    await load();
    setBusy(false);
  }

  const ingestUrl = `${origin}/api/sync/health`;
  const token = status?.token ?? null;

  return (
    <div className="space-y-4">
      {/* Status banner */}
      <div
        className={`flex items-center justify-between rounded-xl px-4 py-3 ${
          status?.connected ? "bg-emerald-50 text-emerald-800" : "bg-slate-50 text-slate-600"
        }`}
      >
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${status?.connected ? "bg-emerald-500" : "bg-slate-300"}`} />
          <span className="font-medium">
            {status?.connected ? "Apple Watch connected" : token ? "Waiting for first sync…" : "Not connected"}
          </span>
        </div>
        {status?.lastSyncedAt && (
          <span className="text-sm">Last synced {timeAgo(status.lastSyncedAt)}</span>
        )}
      </div>

      {!token ? (
        <div>
          <p className="text-sm text-slate-600">
            Your Apple Watch syncs to the Apple Health app on your iPhone. A small bridge app forwards that
            data here automatically — no manual entry needed.
          </p>
          <button className="btn-primary mt-3" onClick={generate} disabled={busy}>
            {busy ? "Setting up…" : "Connect Apple Watch"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <ol className="space-y-3 text-sm">
            <li>
              <span className="font-semibold">1.</span> On your iPhone, install{" "}
              <a
                className="font-medium text-brand hover:underline"
                href="https://apps.apple.com/app/health-auto-export-json-csv/id1115567069"
                target="_blank"
                rel="noreferrer"
              >
                Health Auto Export — JSON+CSV
              </a>{" "}
              from the App Store and allow it to read Apple Health.
            </li>
            <li>
              <span className="font-semibold">2.</span> In the app, create an <b>Automation</b> → type{" "}
              <b>REST API</b>, and paste this URL:
              <div className="mt-1 flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 font-mono text-xs text-slate-100">
                <span className="overflow-x-auto">{ingestUrl}</span>
                <CopyButton value={ingestUrl} />
              </div>
            </li>
            <li>
              <span className="font-semibold">3.</span> Add a request <b>Header</b>:
              <div className="mt-1 flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 font-mono text-xs text-slate-100">
                <span className="overflow-x-auto">Authorization: Bearer {token}</span>
                <CopyButton value={`Bearer ${token}`} />
              </div>
              <p className="mt-1 text-xs text-slate-500">Keep this token private — it identifies your account.</p>
            </li>
            <li>
              <span className="font-semibold">4.</span> Choose metrics{" "}
              <b>Steps, Resting Heart Rate, Sleep Analysis, Active Energy</b>, set aggregation to{" "}
              <b>Daily</b>, format <b>JSON</b>, and schedule it to run automatically (e.g. every morning).
            </li>
          </ol>

          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
            <button className="btn-ghost text-sm" onClick={load} disabled={busy}>Refresh status</button>
            <button className="btn-ghost text-sm" onClick={generate} disabled={busy}>Regenerate token</button>
            <button className="btn-danger text-sm" onClick={disconnect} disabled={busy}>Disconnect</button>
          </div>
        </div>
      )}
    </div>
  );
}

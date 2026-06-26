"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GoalActions({
  goalId,
  currentValue,
  status,
}: {
  goalId: string;
  currentValue: number | null;
  status: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentValue ?? "");
  const [busy, setBusy] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    await fetch(`/api/goals/${goalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    setEditing(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm("Delete this goal?")) return;
    setBusy(true);
    await fetch(`/api/goals/${goalId}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          className="input w-24 py-1"
          type="number"
          step="0.1"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button
          className="btn-primary py-1"
          disabled={busy}
          onClick={() => patch({ currentValue: value })}
        >
          Save
        </button>
        <button className="text-sm text-slate-500" onClick={() => setEditing(false)}>Cancel</button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <button className="text-brand hover:underline" onClick={() => setEditing(true)} disabled={busy}>
        Update
      </button>
      {status !== "ACHIEVED" && (
        <button className="text-slate-500 hover:underline" onClick={() => patch({ status: "ACHIEVED" })} disabled={busy}>
          Mark achieved
        </button>
      )}
      <button className="text-red-500 hover:underline" onClick={remove} disabled={busy}>
        Delete
      </button>
    </div>
  );
}

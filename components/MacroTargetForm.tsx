"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Targets = {
  calorieTarget: number | null;
  proteinTarget: number | null;
  carbTarget: number | null;
  fatTarget: number | null;
};

export default function MacroTargetForm({ clientId, targets }: { clientId: string; targets: Targets }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const payload = { ...Object.fromEntries(new FormData(e.currentTarget).entries()), clientId };
    await fetch("/api/nutrition/targets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={save} className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      <div>
        <label className="label">Calories</label>
        <input className="input" name="calorieTarget" type="number" defaultValue={targets.calorieTarget ?? ""} placeholder="2200" />
      </div>
      <div>
        <label className="label">Protein (g)</label>
        <input className="input" name="proteinTarget" type="number" step="0.1" defaultValue={targets.proteinTarget ?? ""} placeholder="160" />
      </div>
      <div>
        <label className="label">Carbs (g)</label>
        <input className="input" name="carbTarget" type="number" step="0.1" defaultValue={targets.carbTarget ?? ""} placeholder="220" />
      </div>
      <div>
        <label className="label">Fat (g)</label>
        <input className="input" name="fatTarget" type="number" step="0.1" defaultValue={targets.fatTarget ?? ""} placeholder="70" />
      </div>
      <div className="flex items-end">
        <button className="btn-primary w-full" disabled={saving}>{saving ? "…" : saved ? "Saved ✓" : "Set targets"}</button>
      </div>
    </form>
  );
}

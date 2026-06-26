"use client";

import { useCallback, useEffect, useState } from "react";

type Entry = {
  id: string;
  meal: string | null;
  name: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
};

type Targets = {
  calorieTarget: number | null;
  proteinTarget: number | null;
  carbTarget: number | null;
  fatTarget: number | null;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function NutritionPanel({ clientId, targets }: { clientId: string; targets: Targets }) {
  const [date, setDate] = useState(todayISO());
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/nutrition?clientId=${clientId}&date=${date}`, { cache: "no-store" });
    if (res.ok) setEntries((await res.json()).entries);
  }, [clientId, date]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + (e.calories ?? 0),
      protein: acc.protein + (e.protein ?? 0),
      carbs: acc.carbs + (e.carbs ?? 0),
      fat: acc.fat + (e.fat ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const payload = { ...Object.fromEntries(new FormData(form).entries()), clientId, date };
    await fetch("/api/nutrition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    form.reset();
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/nutrition/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <label className="label mb-0">Day</label>
        <input className="input w-44" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MacroStat label="Calories" value={totals.calories} target={targets.calorieTarget} unit="kcal" />
        <MacroStat label="Protein" value={totals.protein} target={targets.proteinTarget} unit="g" />
        <MacroStat label="Carbs" value={totals.carbs} target={targets.carbTarget} unit="g" />
        <MacroStat label="Fat" value={totals.fat} target={targets.fatTarget} unit="g" />
      </div>

      <form onSubmit={add} className="grid grid-cols-2 gap-2 sm:grid-cols-6">
        <select className="input col-span-1" name="meal" defaultValue="breakfast">
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
          <option value="snack">Snack</option>
        </select>
        <input className="input col-span-1 sm:col-span-2" name="name" placeholder="Food" />
        <input className="input" name="calories" type="number" placeholder="kcal" />
        <input className="input" name="protein" type="number" step="0.1" placeholder="P (g)" />
        <input className="input" name="carbs" type="number" step="0.1" placeholder="C (g)" />
        <input className="input" name="fat" type="number" step="0.1" placeholder="F (g)" />
        <button className="btn-primary col-span-2 sm:col-span-6" disabled={loading}>{loading ? "Saving…" : "Add food"}</button>
      </form>

      <div className="divide-y divide-slate-100">
        {entries.length === 0 && <p className="py-4 text-sm text-slate-400">Nothing logged for this day.</p>}
        {entries.map((e) => (
          <div key={e.id} className="flex items-center justify-between py-2 text-sm">
            <div>
              <span className="font-medium">{e.name || e.meal || "Food"}</span>
              {e.meal && <span className="ml-2 text-xs text-slate-400">{e.meal}</span>}
            </div>
            <div className="flex items-center gap-3 text-slate-500">
              <span>{e.calories ?? 0} kcal · {e.protein ?? 0}P / {e.carbs ?? 0}C / {e.fat ?? 0}F</span>
              <button className="text-red-500 hover:underline" onClick={() => remove(e.id)}>✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MacroStat({ label, value, target, unit }: { label: string; value: number; target: number | null; unit: string }) {
  const pct = target ? Math.min(100, Math.round((value / target) * 100)) : null;
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-bold">
        {Math.round(value)}
        {target ? <span className="text-sm font-normal text-slate-400"> / {target}</span> : ""}{" "}
        <span className="text-xs font-normal text-slate-400">{unit}</span>
      </div>
      {pct != null && (
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div className={`h-full ${pct >= 100 ? "bg-amber-500" : "bg-brand"}`} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

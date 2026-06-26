"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export type RawEntry = { date: string; weight: number | null; bodyFatPct: number | null };
type Granularity = "daily" | "weekly" | "monthly";

function bucketKey(d: Date, g: Granularity): string {
  if (g === "daily") return d.toISOString().slice(0, 10);
  if (g === "monthly") return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  // weekly — ISO week (year-Www)
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (tmp.getUTCDay() + 6) % 7;
  tmp.setUTCDate(tmp.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 4));
  const week =
    1 + Math.round(((tmp.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function aggregate(entries: RawEntry[], g: Granularity) {
  const buckets = new Map<string, { weightSum: number; weightN: number; fatSum: number; fatN: number }>();
  for (const e of entries) {
    const key = bucketKey(new Date(e.date), g);
    const b = buckets.get(key) ?? { weightSum: 0, weightN: 0, fatSum: 0, fatN: 0 };
    if (e.weight != null) {
      b.weightSum += e.weight;
      b.weightN += 1;
    }
    if (e.bodyFatPct != null) {
      b.fatSum += e.bodyFatPct;
      b.fatN += 1;
    }
    buckets.set(key, b);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([label, b]) => ({
      label,
      weight: b.weightN ? +(b.weightSum / b.weightN).toFixed(1) : null,
      bodyFat: b.fatN ? +(b.fatSum / b.fatN).toFixed(1) : null,
    }));
}

export default function ProgressChart({ entries }: { entries: RawEntry[] }) {
  const [g, setG] = useState<Granularity>("weekly");
  const data = useMemo(() => aggregate(entries, g), [entries, g]);

  const hasData = data.some((d) => d.weight != null || d.bodyFat != null);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">Progress</h3>
        <div className="flex rounded-lg bg-slate-100 p-0.5 text-sm">
          {(["daily", "weekly", "monthly"] as Granularity[]).map((opt) => (
            <button
              key={opt}
              onClick={() => setG(opt)}
              className={`rounded-md px-3 py-1 capitalize ${
                g === opt ? "bg-white shadow-sm font-semibold" : "text-slate-500"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <p className="py-12 text-center text-sm text-slate-400">No measurements logged yet.</p>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" domain={["auto", "auto"]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="weight"
                name="Weight (kg)"
                stroke="#16a34a"
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="bodyFat"
                name="Body fat (%)"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

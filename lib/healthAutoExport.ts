// Parser for the "Health Auto Export" iOS app REST payload.
//
// That app reads Apple Watch / HealthKit data and POSTs JSON shaped like:
//   { "data": { "metrics": [ { "name": "step_count", "units": "count",
//        "data": [ { "date": "2026-06-26 00:00:00 +0000", "qty": 8412 } ] }, ... ] } }
//
// Heart rate / sleep points carry richer shapes (Min/Avg/Max, asleep hours, etc.).
// We normalise everything into one record per calendar day.

export type NormalizedSample = {
  day: string; // YYYY-MM-DD
  steps?: number;
  restingHr?: number;
  sleepMinutes?: number;
  activeCalories?: number;
};

type Point = Record<string, unknown>;

function dayOf(dateStr: unknown): string | null {
  if (typeof dateStr !== "string") return null;
  // Formats seen: "2026-06-26 00:00:00 +0000" or ISO "2026-06-26T..." — take the date part.
  const m = dateStr.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

function num(p: Point, ...keys: string[]): number | undefined {
  for (const k of keys) {
    const v = p[k];
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  }
  return undefined;
}

/** Returns null if the body is not a Health Auto Export payload. */
export function parseHealthAutoExport(body: unknown): NormalizedSample[] | null {
  const metrics = (body as { data?: { metrics?: unknown } })?.data?.metrics;
  if (!Array.isArray(metrics)) return null;

  const byDay = new Map<string, NormalizedSample>();
  const get = (day: string) => {
    let s = byDay.get(day);
    if (!s) {
      s = { day };
      byDay.set(day, s);
    }
    return s;
  };

  for (const metric of metrics) {
    const name = String((metric as Point)?.name ?? "").toLowerCase();
    const points = (metric as { data?: unknown })?.data;
    if (!Array.isArray(points)) continue;

    for (const p of points as Point[]) {
      const day = dayOf(p.date);
      if (!day) continue;
      const s = get(day);

      switch (name) {
        case "step_count": {
          const v = num(p, "qty", "Avg");
          if (v != null) s.steps = (s.steps ?? 0) + v;
          break;
        }
        case "active_energy":
        case "active_energy_burned": {
          const v = num(p, "qty", "Avg");
          if (v != null) s.activeCalories = (s.activeCalories ?? 0) + v;
          break;
        }
        case "resting_heart_rate": {
          const v = num(p, "qty", "Avg");
          if (v != null) s.restingHr = v;
          break;
        }
        case "sleep_analysis": {
          // Newer exports: hours in `asleep` / `totalSleep`; older: `qty`. Components: core/deep/rem.
          let hours = num(p, "asleep", "totalSleep", "qty");
          if (hours == null) {
            const core = num(p, "core") ?? 0;
            const deep = num(p, "deep") ?? 0;
            const rem = num(p, "rem") ?? 0;
            const sum = core + deep + rem;
            if (sum > 0) hours = sum;
          }
          if (hours != null) s.sleepMinutes = (s.sleepMinutes ?? 0) + Math.round(hours * 60);
          break;
        }
        default:
          break; // ignore metrics we don't track
      }
    }
  }

  // Round integer-ish fields.
  return [...byDay.values()].map((s) => ({
    day: s.day,
    steps: s.steps != null ? Math.round(s.steps) : undefined,
    restingHr: s.restingHr != null ? Math.round(s.restingHr) : undefined,
    sleepMinutes: s.sleepMinutes,
    activeCalories: s.activeCalories != null ? Math.round(s.activeCalories) : undefined,
  }));
}

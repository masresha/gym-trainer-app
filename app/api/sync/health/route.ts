import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { healthIngestSchema } from "@/lib/validation";
import { parseHealthAutoExport, type NormalizedSample } from "@/lib/healthAutoExport";

export const runtime = "nodejs";

/**
 * Public ingestion endpoint for Apple Watch / Apple Health data.
 *
 * Authenticate with the per-client sync token (shown on the client's
 * "Connect Apple Watch" screen):
 *   POST /api/sync/health
 *   Authorization: Bearer <healthSyncToken>
 *
 * Accepts two payload shapes:
 *   1. The "Health Auto Export" iOS app format: { data: { metrics: [...] } }
 *   2. A simple format: { samples: [ { date, steps, restingHr, sleepMinutes, activeCalories, source } ] }
 *
 * Upserts one row per day; only fields present in the payload are written, so a
 * later partial sync never wipes data from an earlier one.
 */
export async function POST(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : auth.trim();
  if (!token) return NextResponse.json({ error: "Missing sync token" }, { status: 401 });

  const client = await prisma.client.findUnique({ where: { healthSyncToken: token } });
  if (!client) return NextResponse.json({ error: "Invalid sync token" }, { status: 401 });

  const body = await req.json().catch(() => null);

  // Build a normalized "one record per day" list from whichever format we got.
  let normalized: { day: string; source: string; fields: Record<string, number> }[] = [];

  const hae = parseHealthAutoExport(body);
  if (hae) {
    normalized = hae.map((s: NormalizedSample) => ({ day: s.day, source: "apple_health", fields: pickFields(s) }));
  } else {
    const parsed = healthIngestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Unrecognized payload. Send Health Auto Export JSON or { samples: [...] }." },
        { status: 400 },
      );
    }
    normalized = parsed.data.samples.map((s) => ({
      day: dayOf(s.date),
      source: s.source ?? "import",
      fields: pickFields(s),
    }));
  }

  let upserted = 0;
  for (const { day, source, fields } of normalized) {
    if (Object.keys(fields).length === 0) continue;
    const date = new Date(`${day}T00:00:00.000Z`);
    await prisma.healthSample.upsert({
      where: { clientId_date_source: { clientId: client.id, date, source } },
      create: { clientId: client.id, date, source, ...fields },
      update: fields, // only provided metrics — never overwrites others with null
    });
    upserted++;
  }

  return NextResponse.json({ ok: true, upserted });
}

function dayOf(dateStr: string): string {
  const m = dateStr.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : new Date(dateStr).toISOString().slice(0, 10);
}

function pickFields(s: {
  steps?: number | null;
  restingHr?: number | null;
  sleepMinutes?: number | null;
  activeCalories?: number | null;
}): Record<string, number> {
  const out: Record<string, number> = {};
  if (s.steps != null) out.steps = s.steps;
  if (s.restingHr != null) out.restingHr = s.restingHr;
  if (s.sleepMinutes != null) out.sleepMinutes = s.sleepMinutes;
  if (s.activeCalories != null) out.activeCalories = s.activeCalories;
  return out;
}

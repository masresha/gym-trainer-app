import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSession } from "@/lib/guards";
import { getAccessibleClient } from "@/lib/data";
import { healthSampleSchema } from "@/lib/validation";
import { z } from "zod";

const manualBody = healthSampleSchema.extend({ clientId: z.string().min(1) });

// GET /api/health?clientId=...  — recent samples (trainer or that client).
export async function GET(req: Request) {
  const session = await apiSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = new URL(req.url).searchParams.get("clientId");
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });

  const client = await getAccessibleClient(session, clientId);
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const samples = await prisma.healthSample.findMany({
    where: { clientId },
    orderBy: { date: "desc" },
    take: 60,
  });
  return NextResponse.json({ samples });
}

// Manual entry (client or trainer) — same shape as the synced data.
export async function POST(req: Request) {
  const session = await apiSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = manualBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { clientId, date, ...metrics } = parsed.data;
  const client = await getAccessibleClient(session, clientId);
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const day = new Date(date);
  await prisma.healthSample.upsert({
    where: { clientId_date_source: { clientId, date: day, source: "manual" } },
    create: { clientId, date: day, source: "manual", ...numericMetrics(metrics) },
    update: numericMetrics(metrics),
  });
  return NextResponse.json({ ok: true });
}

function numericMetrics(m: {
  steps?: number;
  restingHr?: number;
  sleepMinutes?: number;
  activeCalories?: number;
}) {
  return {
    steps: m.steps ?? null,
    restingHr: m.restingHr ?? null,
    sleepMinutes: m.sleepMinutes ?? null,
    activeCalories: m.activeCalories ?? null,
  };
}

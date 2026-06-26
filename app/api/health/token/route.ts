import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { apiSession } from "@/lib/guards";
import { getAccessibleClient } from "@/lib/data";
import { z } from "zod";

export const runtime = "nodejs";

const idBody = z.object({ clientId: z.string().min(1) });

async function connectionStatus(clientId: string) {
  const last = await prisma.healthSample.findFirst({
    where: { clientId, source: { not: "manual" } },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true, source: true },
  });
  return { connected: !!last, lastSyncedAt: last?.createdAt ?? null, lastSource: last?.source ?? null };
}

// GET /api/health/token?clientId=...  — current token (owner sees their own) + sync status.
export async function GET(req: Request) {
  const session = await apiSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = new URL(req.url).searchParams.get("clientId");
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });

  const client = await getAccessibleClient(session, clientId);
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ token: client.healthSyncToken, ...(await connectionStatus(clientId)) });
}

// Generate (or rotate) the per-client sync token.
export async function POST(req: Request) {
  const session = await apiSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = idBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const client = await getAccessibleClient(session, parsed.data.clientId);
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const token = randomBytes(24).toString("hex");
  await prisma.client.update({ where: { id: client.id }, data: { healthSyncToken: token } });
  return NextResponse.json({ ok: true, token });
}

// Disconnect — clears the token so further pushes are rejected.
export async function DELETE(req: Request) {
  const session = await apiSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = idBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const client = await getAccessibleClient(session, parsed.data.clientId);
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.client.update({ where: { id: client.id }, data: { healthSyncToken: null } });
  return NextResponse.json({ ok: true });
}

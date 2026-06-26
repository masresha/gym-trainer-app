import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSession } from "@/lib/guards";
import { getAccessibleClient, getTrainerClient } from "@/lib/data";
import { reminderSchema } from "@/lib/validation";

// GET /api/reminders?clientId=...  — reminders for a client (trainer or that client).
export async function GET(req: Request) {
  const session = await apiSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = new URL(req.url).searchParams.get("clientId");
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });

  const client = await getAccessibleClient(session, clientId);
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const reminders = await prisma.reminder.findMany({
    where: { clientId },
    orderBy: { dueAt: "asc" },
  });
  return NextResponse.json({ reminders });
}

// Trainer schedules a reminder.
export async function POST(req: Request) {
  const session = await apiSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "TRAINER") return NextResponse.json({ error: "Trainers only" }, { status: 403 });

  const parsed = reminderSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const client = await getTrainerClient(session.userId, parsed.data.clientId);
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  await prisma.reminder.create({
    data: {
      clientId: parsed.data.clientId,
      trainerId: session.userId,
      title: parsed.data.title,
      message: parsed.data.message || null,
      dueAt: new Date(parsed.data.dueAt),
      channel: parsed.data.channel,
    },
  });
  return NextResponse.json({ ok: true });
}

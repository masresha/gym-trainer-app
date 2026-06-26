import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSession } from "@/lib/guards";

// PATCH dismisses an in-app reminder (the client acknowledging it).
export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  const session = await apiSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reminder = await prisma.reminder.findUnique({
    where: { id: params.id },
    include: { client: true },
  });
  if (!reminder) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed =
    reminder.client.userId === session.userId || reminder.trainerId === session.userId;
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.reminder.update({ where: { id: params.id }, data: { dismissedAt: new Date() } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await apiSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "TRAINER") return NextResponse.json({ error: "Trainers only" }, { status: 403 });

  const reminder = await prisma.reminder.findFirst({
    where: { id: params.id, trainerId: session.userId },
  });
  if (!reminder) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.reminder.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

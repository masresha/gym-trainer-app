import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSession } from "@/lib/guards";
import { completeWorkoutSchema } from "@/lib/validation";

// Client marks a workout complete/skipped. Trainer can delete.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await apiSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = await prisma.workoutPlan.findUnique({
    where: { id: params.id },
    include: { client: true },
  });
  if (!plan) return NextResponse.json({ error: "Workout not found" }, { status: 404 });

  // Only the client who owns it (or their trainer) may update.
  const isOwnerClient = plan.client.userId === session.userId;
  const isTrainer = plan.trainerId === session.userId;
  if (!isOwnerClient && !isTrainer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = completeWorkoutSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { status, perceivedRpe, clientNote } = parsed.data;
  await prisma.workoutPlan.update({
    where: { id: params.id },
    data: {
      status,
      completedAt: status === "COMPLETED" ? new Date() : null,
      perceivedRpe: perceivedRpe ?? null,
      clientNote: clientNote ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await apiSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "TRAINER") return NextResponse.json({ error: "Trainers only" }, { status: 403 });

  const plan = await prisma.workoutPlan.findFirst({
    where: { id: params.id, trainerId: session.userId },
  });
  if (!plan) return NextResponse.json({ error: "Workout not found" }, { status: 404 });

  await prisma.workoutPlan.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSession } from "@/lib/guards";
import { getTrainerClient } from "@/lib/data";
import { workoutSchema } from "@/lib/validation";
import { z } from "zod";

const createWorkoutBody = workoutSchema.extend({ clientId: z.string().min(1) });

// Trainer builds a workout plan and "sends" it to a client.
export async function POST(req: Request) {
  const session = await apiSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "TRAINER") return NextResponse.json({ error: "Trainers only" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = createWorkoutBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { clientId, title, description, scheduledFor, exercises } = parsed.data;

  const client = await getTrainerClient(session.userId, clientId);
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  await prisma.workoutPlan.create({
    data: {
      clientId,
      trainerId: session.userId,
      title,
      description: description ?? null,
      scheduledFor: new Date(scheduledFor),
      status: "SENT",
      exercises: {
        create: exercises.map((ex, i) => ({
          order: i,
          name: ex.name,
          sets: ex.sets ?? null,
          reps: ex.reps ?? null,
          weight: ex.weight ?? null,
          restSec: ex.restSec ?? null,
          notes: ex.notes ?? null,
        })),
      },
    },
  });

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSession } from "@/lib/guards";
import { templateSchema } from "@/lib/validation";

export async function GET() {
  const session = await apiSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "TRAINER") return NextResponse.json({ error: "Trainers only" }, { status: 403 });

  const templates = await prisma.workoutTemplate.findMany({
    where: { trainerId: session.userId },
    include: { exercises: { orderBy: { order: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ templates });
}

export async function POST(req: Request) {
  const session = await apiSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "TRAINER") return NextResponse.json({ error: "Trainers only" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = templateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { title, description, exercises } = parsed.data;
  await prisma.workoutTemplate.create({
    data: {
      trainerId: session.userId,
      title,
      description: description || null,
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

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSession } from "@/lib/guards";
import { z } from "zod";

const updateSchema = z.object({
  currentValue: z.coerce.number().optional(),
  targetValue: z.coerce.number().optional(),
  status: z.enum(["ACTIVE", "ACHIEVED", "ARCHIVED"]).optional(),
});

async function ownGoal(trainerUserId: string, goalId: string) {
  return prisma.goal.findFirst({
    where: { id: goalId, client: { trainerId: trainerUserId } },
  });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await apiSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "TRAINER") return NextResponse.json({ error: "Trainers only" }, { status: 403 });

  const goal = await ownGoal(session.userId, params.id);
  if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  await prisma.goal.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await apiSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "TRAINER") return NextResponse.json({ error: "Trainers only" }, { status: 403 });

  const goal = await ownGoal(session.userId, params.id);
  if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

  await prisma.goal.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

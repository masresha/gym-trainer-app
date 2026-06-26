import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSession } from "@/lib/guards";
import { getTrainerClient } from "@/lib/data";
import { goalSchema } from "@/lib/validation";
import { z } from "zod";

const createGoalBody = goalSchema.extend({ clientId: z.string().min(1) });

export async function POST(req: Request) {
  const session = await apiSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "TRAINER") return NextResponse.json({ error: "Trainers only" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = createGoalBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { clientId, dueDate, ...rest } = parsed.data;

  const client = await getTrainerClient(session.userId, clientId);
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  await prisma.goal.create({
    data: {
      clientId,
      title: rest.title,
      type: rest.type,
      startValue: rest.startValue ?? null,
      targetValue: rest.targetValue ?? null,
      currentValue: rest.currentValue ?? rest.startValue ?? null,
      unit: rest.unit ?? null,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });

  return NextResponse.json({ ok: true });
}

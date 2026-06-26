import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSession } from "@/lib/guards";
import { progressSchema } from "@/lib/validation";
import { z } from "zod";

const createProgressBody = progressSchema.extend({ clientId: z.string().min(1) });

// Add a measurement entry. Client logs their own; trainer logs for their client.
export async function POST(req: Request) {
  const session = await apiSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createProgressBody.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { clientId, date, weight, bodyFatPct, note } = parsed.data;
  if (weight == null && bodyFatPct == null) {
    return NextResponse.json({ error: "Enter a weight or body fat %" }, { status: 400 });
  }

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const allowed = client.userId === session.userId || client.trainerId === session.userId;
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.progressEntry.create({
    data: {
      clientId,
      date: date ? new Date(date) : new Date(),
      weight: weight ?? null,
      bodyFatPct: bodyFatPct ?? null,
      note: note ?? null,
    },
  });

  // Keep any WEIGHT goal's currentValue in sync with the latest weigh-in.
  if (weight != null) {
    const weightGoal = await prisma.goal.findFirst({
      where: { clientId, type: "WEIGHT", status: "ACTIVE" },
    });
    if (weightGoal) {
      await prisma.goal.update({ where: { id: weightGoal.id }, data: { currentValue: weight } });
    }
  }

  return NextResponse.json({ ok: true });
}

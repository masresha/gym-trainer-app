import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSession } from "@/lib/guards";
import { getTrainerClient } from "@/lib/data";
import { macroTargetSchema } from "@/lib/validation";
import { z } from "zod";

const body = macroTargetSchema.extend({ clientId: z.string().min(1) });

// Trainer sets a client's daily macro targets.
export async function POST(req: Request) {
  const session = await apiSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "TRAINER") return NextResponse.json({ error: "Trainers only" }, { status: 403 });

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { clientId, ...targets } = parsed.data;
  const client = await getTrainerClient(session.userId, clientId);
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  await prisma.client.update({
    where: { id: clientId },
    data: {
      calorieTarget: targets.calorieTarget ?? null,
      proteinTarget: targets.proteinTarget ?? null,
      carbTarget: targets.carbTarget ?? null,
      fatTarget: targets.fatTarget ?? null,
    },
  });
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSession } from "@/lib/guards";
import { getTrainerClient } from "@/lib/data";
import { assignTemplateSchema } from "@/lib/validation";

// Assign a template to a client across one or more dates.
// Multiple dates = a multi-session program built from the same template.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await apiSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "TRAINER") return NextResponse.json({ error: "Trainers only" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = assignTemplateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const template = await prisma.workoutTemplate.findFirst({
    where: { id: params.id, trainerId: session.userId },
    include: { exercises: { orderBy: { order: "asc" } } },
  });
  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  const client = await getTrainerClient(session.userId, parsed.data.clientId);
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  await prisma.$transaction(
    parsed.data.dates.map((d) =>
      prisma.workoutPlan.create({
        data: {
          clientId: client.id,
          trainerId: session.userId,
          title: template.title,
          description: template.description,
          scheduledFor: new Date(d),
          status: "SENT",
          exercises: {
            create: template.exercises.map((ex) => ({
              order: ex.order,
              name: ex.name,
              sets: ex.sets,
              reps: ex.reps,
              weight: ex.weight,
              restSec: ex.restSec,
              notes: ex.notes,
            })),
          },
        },
      }),
    ),
  );

  return NextResponse.json({ ok: true, created: parsed.data.dates.length });
}

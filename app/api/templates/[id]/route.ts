import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSession } from "@/lib/guards";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await apiSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "TRAINER") return NextResponse.json({ error: "Trainers only" }, { status: 403 });

  const tpl = await prisma.workoutTemplate.findFirst({
    where: { id: params.id, trainerId: session.userId },
  });
  if (!tpl) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.workoutTemplate.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

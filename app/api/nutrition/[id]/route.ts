import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSession } from "@/lib/guards";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await apiSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entry = await prisma.nutritionEntry.findUnique({
    where: { id: params.id },
    include: { client: true },
  });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed =
    entry.client.userId === session.userId || entry.client.trainerId === session.userId;
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.nutritionEntry.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

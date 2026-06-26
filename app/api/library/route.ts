import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSession } from "@/lib/guards";
import { libraryExerciseSchema } from "@/lib/validation";

export async function GET() {
  const session = await apiSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "TRAINER") return NextResponse.json({ error: "Trainers only" }, { status: 403 });

  const items = await prisma.exerciseLibrary.findMany({
    where: { trainerId: session.userId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const session = await apiSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "TRAINER") return NextResponse.json({ error: "Trainers only" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = libraryExerciseSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  await prisma.exerciseLibrary.create({
    data: {
      trainerId: session.userId,
      name: parsed.data.name,
      category: parsed.data.category || null,
      videoUrl: parsed.data.videoUrl || null,
      description: parsed.data.description || null,
    },
  });
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSession } from "@/lib/guards";
import { deleteImage } from "@/lib/storage";

export const runtime = "nodejs";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await apiSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const photo = await prisma.progressPhoto.findUnique({
    where: { id: params.id },
    include: { client: true },
  });
  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed =
    photo.client.userId === session.userId || photo.client.trainerId === session.userId;
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await deleteImage(photo.url);
  await prisma.progressPhoto.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

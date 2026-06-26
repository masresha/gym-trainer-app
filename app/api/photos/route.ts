import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { apiSession } from "@/lib/guards";
import { getAccessibleClient } from "@/lib/data";
import { saveImage } from "@/lib/storage";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);

export async function GET(req: Request) {
  const session = await apiSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = new URL(req.url).searchParams.get("clientId");
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });

  const client = await getAccessibleClient(session, clientId);
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const photos = await prisma.progressPhoto.findMany({
    where: { clientId },
    orderBy: { takenAt: "desc" },
  });
  return NextResponse.json({ photos });
}

export async function POST(req: Request) {
  const session = await apiSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });

  const clientId = String(form.get("clientId") ?? "");
  const note = (form.get("note") as string) || null;
  const takenAtRaw = form.get("takenAt") as string | null;
  const file = form.get("file");

  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  if (!ALLOWED.has(file.type)) return NextResponse.json({ error: "Only JPG, PNG, WEBP or HEIC images" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Image is larger than 8 MB" }, { status: 400 });

  const client = await getAccessibleClient(session, clientId);
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const fileName = `${randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const url = await saveImage({ clientId, fileName, bytes, contentType: file.type });

  await prisma.progressPhoto.create({
    data: {
      clientId,
      url,
      note,
      takenAt: takenAtRaw ? new Date(takenAtRaw) : new Date(),
    },
  });

  return NextResponse.json({ ok: true, url });
}

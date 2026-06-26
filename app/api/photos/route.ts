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
  // Browsers sometimes report HEIC/HEIF as empty or "application/octet-stream";
  // if the MIME isn't a recognized image, fall back to the file extension.
  const type = ALLOWED.has(file.type) ? file.type : guessTypeFromName(file.name);
  if (!ALLOWED.has(type)) {
    return NextResponse.json(
      { error: `Unsupported image type "${file.type || "unknown"}". Use JPG, PNG, WEBP or HEIC.` },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Image is larger than 8 MB" }, { status: 400 });

  const client = await getAccessibleClient(session, clientId);
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const ext = type.split("/")[1].replace("jpeg", "jpg").replace("heif", "heic");
    const fileName = `${randomUUID()}.${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    const url = await saveImage({ clientId, fileName, bytes, contentType: type });

    await prisma.progressPhoto.create({
      data: {
        clientId,
        url,
        note,
        takenAt: takenAtRaw ? new Date(takenAtRaw) : new Date(),
      },
    });

    return NextResponse.json({ ok: true, url });
  } catch (err) {
    // Surface the real cause instead of an opaque 500 (e.g. disk permission, blob token).
    const message = err instanceof Error ? err.message : "Upload failed";
    console.error("[photos] upload failed:", err);
    return NextResponse.json({ error: `Upload failed: ${message}` }, { status: 500 });
  }
}

function guessTypeFromName(name: string): string {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "heic" || ext === "heif") return "image/heic";
  return "";
}

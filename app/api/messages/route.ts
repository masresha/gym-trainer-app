import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSession } from "@/lib/guards";
import { getAccessibleClient } from "@/lib/data";
import { messageSchema } from "@/lib/validation";

// GET /api/messages?clientId=...  — the thread for one client (trainer or that client).
export async function GET(req: Request) {
  const session = await apiSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = new URL(req.url).searchParams.get("clientId");
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });

  const client = await getAccessibleClient(session, clientId);
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const messages = await prisma.message.findMany({
    where: { clientId },
    orderBy: { createdAt: "asc" },
    select: { id: true, body: true, senderId: true, createdAt: true },
  });

  // Mark messages from the other party as read.
  await prisma.message.updateMany({
    where: { clientId, senderId: { not: session.userId }, readAt: null },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ messages, me: session.userId });
}

export async function POST(req: Request) {
  const session = await apiSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const client = await getAccessibleClient(session, parsed.data.clientId);
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.message.create({
    data: { clientId: parsed.data.clientId, senderId: session.userId, body: parsed.data.body },
  });

  return NextResponse.json({ ok: true });
}

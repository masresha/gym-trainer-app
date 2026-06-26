import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiSession } from "@/lib/guards";
import { hashPassword } from "@/lib/auth";
import { createClientSchema } from "@/lib/validation";

// Trainer creates a client (and their login account).
export async function POST(req: Request) {
  const session = await apiSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "TRAINER") return NextResponse.json({ error: "Trainers only" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = createClientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { name, email, password, heightCm, startWeight, notes } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "That email is already in use" }, { status: 409 });
  }

  const client = await prisma.client.create({
    data: {
      trainer: { connect: { id: session.userId } },
      heightCm: heightCm ?? null,
      startWeight: startWeight ?? null,
      notes: notes ?? null,
      user: {
        create: {
          name,
          email: email.toLowerCase(),
          passwordHash: await hashPassword(password),
          role: Role.CLIENT,
        },
      },
    },
  });

  return NextResponse.json({ ok: true, clientId: client.id });
}

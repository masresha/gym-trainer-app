import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSession } from "@/lib/guards";
import { getAccessibleClient } from "@/lib/data";
import { nutritionSchema } from "@/lib/validation";

// GET /api/nutrition?clientId=...&date=YYYY-MM-DD  (date optional, defaults today)
export async function GET(req: Request) {
  const session = await apiSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const clientId = url.searchParams.get("clientId");
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });

  const client = await getAccessibleClient(session, clientId);
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const dayStr = url.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  const start = new Date(`${dayStr}T00:00:00`);
  const end = new Date(`${dayStr}T23:59:59.999`);

  const entries = await prisma.nutritionEntry.findMany({
    where: { clientId, date: { gte: start, lte: end } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ entries });
}

export async function POST(req: Request) {
  const session = await apiSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = nutritionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { clientId, date, ...rest } = parsed.data;
  const client = await getAccessibleClient(session, clientId);
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.nutritionEntry.create({
    data: {
      clientId,
      date: date ? new Date(date) : new Date(),
      meal: rest.meal ?? null,
      name: rest.name ?? null,
      calories: rest.calories ?? null,
      protein: rest.protein ?? null,
      carbs: rest.carbs ?? null,
      fat: rest.fat ?? null,
    },
  });
  return NextResponse.json({ ok: true });
}

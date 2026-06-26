import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

/**
 * Dispatches due reminders. Call on a schedule:
 *   - Vercel Cron (see vercel.json) sends a GET with header
 *     `Authorization: Bearer <CRON_SECRET>` automatically.
 *   - Or manually: POST with header `x-cron-secret: <CRON_SECRET>`.
 *
 * Auth: header must match env CRON_SECRET. If CRON_SECRET is unset, the endpoint
 * only runs outside production (dev convenience).
 */
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const bearer = req.headers.get("authorization") === `Bearer ${secret}`;
  const custom = req.headers.get("x-cron-secret") === secret;
  return bearer || custom;
}

async function dispatch() {
  const due = await prisma.reminder.findMany({
    where: { sentAt: null, dueAt: { lte: new Date() } },
    include: { client: { include: { user: true } } },
    take: 100,
  });

  let emailed = 0;
  for (const r of due) {
    if (r.channel === "EMAIL") {
      await sendEmail({ to: r.client.user.email, subject: r.title, text: r.message ?? r.title });
      emailed++;
    }
    await prisma.reminder.update({ where: { id: r.id }, data: { sentAt: new Date() } });
  }
  return { dispatched: due.length, emailed };
}

async function handle(req: Request) {
  if (!authorized(req)) {
    const reason = process.env.CRON_SECRET ? "Forbidden" : "CRON_SECRET not configured";
    return NextResponse.json({ error: reason }, { status: process.env.CRON_SECRET ? 403 : 500 });
  }
  return NextResponse.json({ ok: true, ...(await dispatch()) });
}

export const GET = handle;
export const POST = handle;

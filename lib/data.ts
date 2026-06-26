import "server-only";
import { prisma } from "@/lib/prisma";

/** Fetch a client that belongs to the given trainer, or null. */
export async function getTrainerClient(trainerUserId: string, clientId: string) {
  return prisma.client.findFirst({
    where: { id: clientId, trainerId: trainerUserId },
    include: { user: true },
  });
}

/** Resolve the Client row for a logged-in client user. */
export async function getClientByUserId(userId: string) {
  return prisma.client.findUnique({
    where: { userId },
    include: { user: true, trainer: true },
  });
}

/**
 * Return the client identified by clientId only if the session user may act on it —
 * either the owning client themselves or their trainer. Otherwise null.
 */
export async function getAccessibleClient(
  session: { userId: string; role: string },
  clientId: string,
) {
  const where =
    session.role === "TRAINER"
      ? { id: clientId, trainerId: session.userId }
      : { id: clientId, userId: session.userId };
  return prisma.client.findFirst({ where });
}

/** Progress percentage for a goal, clamped 0–100. Handles "lower is better" (e.g. weight loss). */
export function goalProgressPct(g: {
  startValue: number | null;
  currentValue: number | null;
  targetValue: number | null;
}): number | null {
  const { startValue, currentValue, targetValue } = g;
  if (startValue == null || currentValue == null || targetValue == null) return null;
  if (targetValue === startValue) return currentValue === targetValue ? 100 : 0;
  const pct = ((currentValue - startValue) / (targetValue - startValue)) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

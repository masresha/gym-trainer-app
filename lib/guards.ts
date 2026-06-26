import "server-only";
import { redirect } from "next/navigation";
import { getSession, type SessionPayload } from "@/lib/auth";

/** For server components/pages — redirects to /login if not signed in. */
export async function requireUser(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireTrainer(): Promise<SessionPayload> {
  const session = await requireUser();
  if (session.role !== "TRAINER") redirect("/me");
  return session;
}

export async function requireClient(): Promise<SessionPayload> {
  const session = await requireUser();
  if (session.role !== "CLIENT") redirect("/dashboard");
  return session;
}

/** For API route handlers — returns the session or null (caller returns 401). */
export async function apiSession(): Promise<SessionPayload | null> {
  return getSession();
}

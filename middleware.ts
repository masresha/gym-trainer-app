import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "gympt_session";

// Routes that require any authenticated user.
// NOTE: /api/sync/* is intentionally excluded — it authenticates via a per-client sync token.
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/clients",
  "/me",
  "/library",
  "/templates",
  "/api/clients",
  "/api/goals",
  "/api/workouts",
  "/api/progress",
  "/api/messages",
  "/api/library",
  "/api/templates",
  "/api/nutrition",
  "/api/reminders",
  "/api/photos",
  "/api/health",
];

async function isValid(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const secret = process.env.AUTH_SECRET;
  if (!secret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const needsAuth = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!needsAuth) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (await isValid(token)) return NextResponse.next();

  // API routes get a 401; page routes redirect to login.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/clients/:path*",
    "/me/:path*",
    "/library/:path*",
    "/templates/:path*",
    "/api/clients/:path*",
    "/api/goals/:path*",
    "/api/workouts/:path*",
    "/api/progress/:path*",
    "/api/messages/:path*",
    "/api/library/:path*",
    "/api/templates/:path*",
    "/api/nutrition/:path*",
    "/api/reminders/:path*",
    "/api/photos/:path*",
    "/api/health/:path*",
  ],
};

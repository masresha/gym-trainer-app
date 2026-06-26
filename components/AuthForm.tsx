"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignup = mode === "signup";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());

    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      return;
    }
    const dest = params.get("from") || (data.role === "TRAINER" ? "/dashboard" : "/me");
    router.replace(dest);
    router.refresh();
  }

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2 text-lg font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-white">C</span>
          CoachDeck
        </Link>
        <div className="card">
          <h1 className="text-xl font-bold">{isSignup ? "Create your trainer account" : "Welcome back"}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isSignup ? "Start coaching clients in minutes." : "Log in to your dashboard."}
          </p>

          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            {isSignup && (
              <div>
                <label className="label" htmlFor="name">Full name</label>
                <input className="input" id="name" name="name" required placeholder="Coach Alex" />
              </div>
            )}
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input className="input" id="email" name="email" type="email" required placeholder="you@gym.com" />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input
                className="input"
                id="password"
                name="password"
                type="password"
                required
                minLength={isSignup ? 8 : undefined}
                placeholder="••••••••"
              />
            </div>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            <button className="btn-primary w-full" disabled={loading}>
              {loading ? "Please wait…" : isSignup ? "Create account" : "Log in"}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-slate-600">
          {isSignup ? (
            <>Already have an account? <Link className="font-semibold text-brand" href="/login">Log in</Link></>
          ) : (
            <>New here? <Link className="font-semibold text-brand" href="/signup">Create a trainer account</Link></>
          )}
        </p>
      </div>
    </main>
  );
}

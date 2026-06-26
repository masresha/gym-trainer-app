import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function Home() {
  const session = await getSession();
  if (session) redirect(session.role === "TRAINER" ? "/dashboard" : "/me");

  const features = [
    { title: "Set client goals", body: "Weight, strength, endurance or habit goals with live progress %." },
    { title: "Send workouts remotely", body: "Build plans with exercises and push them when clients can't make it in." },
    { title: "Track progress", body: "Daily, weekly and monthly charts for bodyweight, body fat and adherence." },
    { title: "Client portal", body: "Clients log in to see plans, complete workouts and record measurements." },
  ];

  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2 text-lg font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-white">C</span>
          CoachDeck
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost">Log in</Link>
          <Link href="/signup" className="btn-primary">Start free</Link>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-12 pb-16 text-center">
        <span className="badge bg-brand/10 text-brand">For personal trainers</span>
        <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
          Coach every client, even when they can&apos;t make it to the gym.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
          Set goals, program workouts, and follow daily, weekly and monthly progress — all in one place.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/signup" className="btn-primary px-6 py-3 text-base">Create trainer account</Link>
          <Link href="/login" className="btn-ghost px-6 py-3 text-base">Log in</Link>
        </div>
        <p className="mt-4 text-sm text-slate-500">
          Demo: <code className="rounded bg-slate-100 px-1.5 py-0.5">coach@demo.com</code> /{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5">password123</code>
        </p>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div key={f.title} className="card">
            <h3 className="font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{f.body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function Home() {
  const session = await getSession();
  if (session) redirect(session.role === "TRAINER" ? "/dashboard" : "/me");

  const features = [
    { icon: "🎯", title: "Set client goals", body: "Weight, strength, endurance or habit goals with live progress that actually motivates." },
    { icon: "💪", title: "Send workouts anywhere", body: "Build plans with full exercise detail and push them when clients can't make it in." },
    { icon: "📈", title: "Track every win", body: "Daily, weekly and monthly charts for bodyweight, body fat and adherence." },
    { icon: "⌚", title: "Sync the Apple Watch", body: "Steps, heart rate, sleep and energy flow straight into each client's profile." },
  ];

  const stats = [
    { value: "7+", label: "Pro features" },
    { value: "100%", label: "Client visibility" },
    { value: "24/7", label: "Remote coaching" },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-hero-mesh">
      {/* floating accents */}
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-brand-lime/20 blur-3xl animate-float" />
      <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-energy/20 blur-3xl animate-float [animation-delay:1.5s]" />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient text-white shadow-glow">C</span>
          CoachDeck
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost">Log in</Link>
          <Link href="/signup" className="btn-primary">Start free</Link>
        </nav>
      </header>

      <section className="relative mx-auto max-w-6xl px-6 pt-16 pb-20 text-center">
        <span className="badge bg-energy/15 text-energy ring-1 ring-energy/20 animate-fade-in">
          ⚡ Built for personal trainers
        </span>
        <h1 className="mx-auto mt-5 max-w-4xl text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl animate-fade-up">
          Coach every client.{" "}
          <span className="text-gradient">Even when they can&apos;t</span>{" "}
          make it to the gym.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600 animate-fade-up [animation-delay:0.1s]">
          Set goals, program workouts, sync wearables and follow daily, weekly and monthly progress —
          all in one energizing place.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3 animate-fade-up [animation-delay:0.2s]">
          <Link href="/signup" className="btn-primary px-7 py-3.5 text-base">Create trainer account →</Link>
          <Link href="/login" className="btn-ghost px-7 py-3.5 text-base">Log in</Link>
        </div>
        <p className="mt-5 text-sm text-slate-500 animate-fade-in [animation-delay:0.3s]">
          Try the demo: <code className="rounded bg-white/70 px-1.5 py-0.5 font-semibold ring-1 ring-slate-200">coach@demo.com</code>{" "}
          / <code className="rounded bg-white/70 px-1.5 py-0.5 font-semibold ring-1 ring-slate-200">password123</code>
        </p>

        <div className="mx-auto mt-12 grid max-w-2xl grid-cols-3 gap-4 stagger">
          {stats.map((s) => (
            <div key={s.label} className="card text-center">
              <div className="text-3xl font-extrabold text-gradient">{s.value}</div>
              <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto grid max-w-6xl gap-4 px-6 pb-24 stagger sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div key={f.title} className="card card-hover">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand/10 text-2xl">{f.icon}</div>
            <h3 className="mt-3 font-bold tracking-tight">{f.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{f.body}</p>
          </div>
        ))}
      </section>

      <section className="relative mx-auto max-w-5xl px-6 pb-24">
        <div className="overflow-hidden rounded-3xl bg-brand-gradient bg-[length:200%_200%] p-10 text-center text-white shadow-glow animate-gradient-x">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Ready to level up your coaching?</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/85">
            Spin up your roster, send the first workout, and watch the progress roll in.
          </p>
          <Link href="/signup" className="btn-energy mt-6 px-7 py-3.5 text-base">Get started — it&apos;s free</Link>
        </div>
      </section>
    </main>
  );
}

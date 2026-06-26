import Link from "next/link";
import { requireTrainer } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import TopNav from "@/components/TopNav";
import AddClientForm from "@/components/AddClientForm";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireTrainer();

  const clients = await prisma.client.findMany({
    where: { trainerId: session.userId },
    include: {
      user: true,
      goals: { where: { status: "ACTIVE" } },
      workoutPlans: { orderBy: { scheduledFor: "desc" } },
      progressEntries: { orderBy: { date: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "asc" },
  });

  const totalActiveGoals = clients.reduce((n, c) => n + c.goals.length, 0);
  const pendingWorkouts = clients.reduce(
    (n, c) => n + c.workoutPlans.filter((w) => w.status === "SENT").length,
    0,
  );

  return (
    <div className="min-h-screen">
      <TopNav session={session} />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex items-center justify-between animate-fade-up">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Welcome back, <span className="text-gradient">{session.name.split(" ")[0]}</span> 👊
            </h1>
            <p className="text-sm text-slate-500">Let&apos;s move your roster forward today.</p>
          </div>
          <AddClientForm />
        </div>

        <div className="mt-6 grid gap-4 stagger sm:grid-cols-3">
          <Stat label="Clients" value={clients.length} icon="🏋️" />
          <Stat label="Active goals" value={totalActiveGoals} icon="🎯" />
          <Stat label="Workouts awaiting completion" value={pendingWorkouts} icon="🔥" />
        </div>

        <div className="mt-8 grid gap-4 stagger md:grid-cols-2 lg:grid-cols-3">
          {clients.length === 0 && (
            <div className="card md:col-span-2 lg:col-span-3 text-center text-slate-500">
              No clients yet. Click <span className="font-semibold">Add client</span> to create your first one.
            </div>
          )}
          {clients.map((c) => {
            const lastWeight = c.progressEntries[0]?.weight;
            const pending = c.workoutPlans.filter((w) => w.status === "SENT").length;
            const initials = c.user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
            return (
              <Link key={c.id} href={`/clients/${c.id}`} className="card card-hover group">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-gradient text-sm font-extrabold text-white shadow-glow">
                    {initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-bold tracking-tight group-hover:text-brand-dark">{c.user.name}</h3>
                    <p className="truncate text-sm text-slate-500">{c.user.email}</p>
                  </div>
                  <span className="badge bg-brand/10 text-brand-dark">{c.goals.length} goals</span>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                  <span className="badge bg-slate-100 text-slate-600">
                    {lastWeight != null ? `⚖️ ${lastWeight} kg` : "No weigh-in"}
                  </span>
                  {pending > 0 && (
                    <span className="badge bg-energy/15 text-energy">🔥 {pending} pending</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="card card-hover flex items-center gap-4">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-2xl">{icon}</span>
      <div>
        <div className="text-3xl font-extrabold tracking-tight text-gradient">{value}</div>
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      </div>
    </div>
  );
}

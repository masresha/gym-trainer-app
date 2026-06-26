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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Your clients</h1>
            <p className="text-sm text-slate-500">Welcome back, {session.name.split(" ")[0]}.</p>
          </div>
          <AddClientForm />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Stat label="Clients" value={clients.length} />
          <Stat label="Active goals" value={totalActiveGoals} />
          <Stat label="Workouts awaiting completion" value={pendingWorkouts} />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.length === 0 && (
            <div className="card md:col-span-2 lg:col-span-3 text-center text-slate-500">
              No clients yet. Click <span className="font-semibold">Add client</span> to create your first one.
            </div>
          )}
          {clients.map((c) => {
            const lastWeight = c.progressEntries[0]?.weight;
            const pending = c.workoutPlans.filter((w) => w.status === "SENT").length;
            return (
              <Link key={c.id} href={`/clients/${c.id}`} className="card transition hover:ring-brand/40">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{c.user.name}</h3>
                  <span className="badge bg-slate-100 text-slate-600">{c.goals.length} goals</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{c.user.email}</p>
                <div className="mt-4 flex gap-4 text-sm">
                  <span className="text-slate-600">
                    {lastWeight != null ? `${lastWeight} kg` : "No weigh-in"}
                  </span>
                  {pending > 0 && (
                    <span className="badge bg-amber-100 text-amber-700">{pending} workout(s) pending</span>
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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card">
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </div>
  );
}

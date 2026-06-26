import { requireClient } from "@/lib/guards";
import { getClientByUserId } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import TopNav from "@/components/TopNav";
import Tabs from "@/components/Tabs";
import GoalItem from "@/components/GoalItem";
import WorkoutCard from "@/components/WorkoutCard";
import CompleteWorkoutButton from "@/components/CompleteWorkoutButton";
import ProgressChart from "@/components/ProgressChart";
import AddProgressForm from "@/components/AddProgressForm";
import MessageThread from "@/components/MessageThread";
import NutritionPanel from "@/components/NutritionPanel";
import RemindersPanel from "@/components/RemindersPanel";
import PhotoGallery from "@/components/PhotoGallery";
import HealthPanel from "@/components/HealthPanel";
import ConnectAppleWatch from "@/components/ConnectAppleWatch";

export const dynamic = "force-dynamic";

export default async function ClientPortalPage() {
  const session = await requireClient();
  const base = await getClientByUserId(session.userId);

  if (!base) {
    return (
      <div className="min-h-screen">
        <TopNav session={session} />
        <main className="mx-auto max-w-3xl px-6 py-16 text-center text-slate-500">
          Your trainer hasn&apos;t finished setting up your profile yet.
        </main>
      </div>
    );
  }

  const client = await prisma.client.findUnique({
    where: { id: base.id },
    include: {
      trainer: true,
      goals: { where: { status: { not: "ARCHIVED" } }, orderBy: { createdAt: "desc" } },
      workoutPlans: { include: { exercises: { orderBy: { order: "asc" } } }, orderBy: { scheduledFor: "desc" } },
      progressEntries: { orderBy: { date: "asc" } },
    },
  });
  if (!client) return null;

  const todo = client.workoutPlans.filter((w) => w.status === "SENT");
  const done = client.workoutPlans.filter((w) => w.status !== "SENT");
  const chartData = client.progressEntries.map((p) => ({
    date: p.date.toISOString(),
    weight: p.weight,
    bodyFatPct: p.bodyFatPct,
  }));
  const targets = {
    calorieTarget: client.calorieTarget,
    proteinTarget: client.proteinTarget,
    carbTarget: client.carbTarget,
    fatTarget: client.fatTarget,
  };

  const workouts = (
    <div className="space-y-8">
      <div>
        <h3 className="font-semibold">To do</h3>
        {todo.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">Nothing pending — nice work staying on top of it.</p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {todo.map((w) => (
              <WorkoutCard key={w.id} plan={w} action={<CompleteWorkoutButton workoutId={w.id} />} />
            ))}
          </div>
        )}
      </div>
      {done.length > 0 && (
        <div>
          <h3 className="font-semibold">History</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {done.map((w) => (
              <WorkoutCard key={w.id} plan={w} />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const progress = (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="card">
        <h2 className="text-lg font-bold">Your goals</h2>
        <div className="mt-4 space-y-3">
          {client.goals.length === 0 && <p className="text-sm text-slate-400">No goals set yet.</p>}
          {client.goals.map((g) => (
            <GoalItem key={g.id} goal={g} />
          ))}
        </div>
      </section>
      <section className="card">
        <ProgressChart entries={chartData} />
        <div className="mt-4 border-t border-slate-100 pt-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Log today&apos;s measurement</h3>
          <AddProgressForm clientId={client.id} />
        </div>
      </section>
    </div>
  );

  const tabs = [
    { label: "Workouts", content: workouts },
    { label: "Goals & Progress", content: progress },
    { label: "Nutrition", content: <div className="card"><NutritionPanel clientId={client.id} targets={targets} /></div> },
    { label: "Messages", content: <div className="card"><MessageThread clientId={client.id} /></div> },
    { label: "Photos", content: <div className="card"><PhotoGallery clientId={client.id} /></div> },
    {
      label: "Health",
      content: (
        <div className="space-y-5">
          <div className="card">
            <h3 className="mb-3 font-semibold">Connect Apple Watch</h3>
            <ConnectAppleWatch clientId={client.id} />
          </div>
          <div className="card">
            <h3 className="mb-3 font-semibold">Your metrics</h3>
            <HealthPanel clientId={client.id} canManageToken={false} />
          </div>
        </div>
      ),
    },
    { label: "Reminders", content: <div className="card"><RemindersPanel clientId={client.id} canSchedule={false} /></div> },
  ];

  return (
    <div className="min-h-screen">
      <TopNav session={session} />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-bold">Hi {session.name.split(" ")[0]} 👋</h1>
        <p className="mb-6 text-sm text-slate-500">Coached by {client.trainer.name}</p>
        <Tabs tabs={tabs} />
      </main>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTrainer } from "@/lib/guards";
import { getTrainerClient } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import TopNav from "@/components/TopNav";
import Tabs from "@/components/Tabs";
import GoalItem from "@/components/GoalItem";
import GoalActions from "@/components/GoalActions";
import AddGoalForm from "@/components/AddGoalForm";
import WorkoutCard from "@/components/WorkoutCard";
import WorkoutBuilder from "@/components/WorkoutBuilder";
import DeleteWorkoutButton from "@/components/DeleteWorkoutButton";
import AssignTemplate from "@/components/AssignTemplate";
import ProgressChart from "@/components/ProgressChart";
import AddProgressForm from "@/components/AddProgressForm";
import MessageThread from "@/components/MessageThread";
import NutritionPanel from "@/components/NutritionPanel";
import MacroTargetForm from "@/components/MacroTargetForm";
import RemindersPanel from "@/components/RemindersPanel";
import PhotoGallery from "@/components/PhotoGallery";
import HealthPanel from "@/components/HealthPanel";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const session = await requireTrainer();
  const owned = await getTrainerClient(session.userId, params.id);
  if (!owned) notFound();

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      goals: { orderBy: { createdAt: "desc" } },
      workoutPlans: { include: { exercises: { orderBy: { order: "asc" } } }, orderBy: { scheduledFor: "desc" } },
      progressEntries: { orderBy: { date: "asc" } },
    },
  });
  if (!client) notFound();

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

  const overview = (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="card">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Goals</h2>
          <AddGoalForm clientId={client.id} />
        </div>
        <div className="mt-4 space-y-3">
          {client.goals.length === 0 && <p className="text-sm text-slate-400">No goals yet.</p>}
          {client.goals.map((g) => (
            <GoalItem key={g.id} goal={g} actions={<GoalActions goalId={g.id} currentValue={g.currentValue} status={g.status} />} />
          ))}
        </div>
      </section>
      <section className="card">
        <ProgressChart entries={chartData} />
        <div className="mt-4 border-t border-slate-100 pt-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Log a measurement</h3>
          <AddProgressForm clientId={client.id} />
        </div>
      </section>
    </div>
  );

  const workouts = (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <WorkoutBuilder clientId={client.id} />
        <AssignTemplate clientId={client.id} />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {client.workoutPlans.length === 0 && <p className="text-sm text-slate-400">No workouts sent yet.</p>}
        {client.workoutPlans.map((w) => (
          <WorkoutCard key={w.id} plan={w} action={<DeleteWorkoutButton workoutId={w.id} />} />
        ))}
      </div>
    </div>
  );

  const nutrition = (
    <div className="space-y-5">
      <div className="card">
        <h3 className="font-semibold">Daily macro targets</h3>
        <p className="mb-3 text-sm text-slate-500">Set the targets this client should hit each day.</p>
        <MacroTargetForm clientId={client.id} targets={targets} />
      </div>
      <div className="card">
        <h3 className="mb-3 font-semibold">Food log</h3>
        <NutritionPanel clientId={client.id} targets={targets} />
      </div>
    </div>
  );

  const tabs = [
    { label: "Overview", content: overview },
    { label: "Workouts", content: workouts },
    { label: "Nutrition", content: nutrition },
    { label: "Messages", content: <div className="card"><MessageThread clientId={client.id} /></div> },
    { label: "Photos", content: <div className="card"><PhotoGallery clientId={client.id} /></div> },
    { label: "Health", content: <div className="card"><HealthPanel clientId={client.id} canManageToken /></div> },
    { label: "Reminders", content: <div className="card"><RemindersPanel clientId={client.id} canSchedule /></div> },
  ];

  return (
    <div className="min-h-screen">
      <TopNav session={session} />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-800">← All clients</Link>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{client.user.name}</h1>
            <p className="text-sm text-slate-500">{client.user.email}</p>
            <div className="mt-2 flex gap-4 text-sm text-slate-600">
              {client.heightCm && <span>{client.heightCm} cm</span>}
              {client.startWeight && <span>Start: {client.startWeight} kg</span>}
            </div>
          </div>
        </div>
        {client.notes && (
          <p className="mt-3 rounded-xl bg-white p-4 text-sm text-slate-600 ring-1 ring-slate-100">{client.notes}</p>
        )}

        <div className="mt-6">
          <Tabs tabs={tabs} />
        </div>
      </main>
    </div>
  );
}

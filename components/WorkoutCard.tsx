type Exercise = {
  id: string;
  name: string;
  sets: number | null;
  reps: string | null;
  weight: number | null;
  restSec: number | null;
  notes: string | null;
};

type Plan = {
  id: string;
  title: string;
  description: string | null;
  scheduledFor: Date;
  status: string;
  completedAt: Date | null;
  perceivedRpe: number | null;
  clientNote: string | null;
  exercises: Exercise[];
};

const statusStyle: Record<string, string> = {
  SENT: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  SKIPPED: "bg-slate-100 text-slate-500",
};

function exerciseLine(ex: Exercise): string {
  const parts: string[] = [];
  if (ex.sets) parts.push(`${ex.sets} ×`);
  if (ex.reps) parts.push(ex.reps);
  if (ex.weight) parts.push(`@ ${ex.weight}kg`);
  if (ex.restSec) parts.push(`· rest ${ex.restSec}s`);
  return parts.join(" ");
}

export default function WorkoutCard({ plan, action }: { plan: Plan; action?: React.ReactNode }) {
  return (
    <div className="card card-hover">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-semibold">{plan.title}</h4>
          <p className="text-xs text-slate-500">
            {new Date(plan.scheduledFor).toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
        <span className={`badge ${statusStyle[plan.status] ?? "bg-slate-100"}`}>{plan.status.toLowerCase()}</span>
      </div>

      {plan.description && <p className="mt-2 text-sm text-slate-600">{plan.description}</p>}

      <ul className="mt-3 divide-y divide-slate-100">
        {plan.exercises.map((ex) => (
          <li key={ex.id} className="flex items-baseline justify-between py-1.5 text-sm">
            <span className="font-medium">{ex.name}</span>
            <span className="text-slate-500">{exerciseLine(ex)}</span>
          </li>
        ))}
      </ul>

      {plan.status === "COMPLETED" && (plan.perceivedRpe || plan.clientNote) && (
        <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {plan.perceivedRpe ? `Effort ${plan.perceivedRpe}/10. ` : ""}
          {plan.clientNote}
        </div>
      )}

      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

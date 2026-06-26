import { goalProgressPct } from "@/lib/data";

type Goal = {
  id: string;
  title: string;
  type: string;
  unit: string | null;
  startValue: number | null;
  currentValue: number | null;
  targetValue: number | null;
  dueDate: Date | null;
  status: string;
};

const statusBadge: Record<string, string> = {
  ACTIVE: "bg-brand/10 text-brand",
  ACHIEVED: "bg-emerald-100 text-emerald-700",
  ARCHIVED: "bg-slate-100 text-slate-500",
};

export default function GoalItem({ goal, actions }: { goal: Goal; actions?: React.ReactNode }) {
  const pct = goalProgressPct(goal);
  return (
    <div className="rounded-xl border border-slate-100 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium">{goal.title}</div>
          <div className="mt-0.5 text-xs text-slate-500">
            {goal.type.toLowerCase()}
            {goal.dueDate ? ` · by ${new Date(goal.dueDate).toLocaleDateString()}` : ""}
          </div>
        </div>
        <span className={`badge ${statusBadge[goal.status] ?? "bg-slate-100 text-slate-500"}`}>
          {goal.status.toLowerCase()}
        </span>
      </div>

      {goal.currentValue != null && goal.targetValue != null && (
        <div className="mt-3 text-sm text-slate-600">
          {goal.currentValue} → <span className="font-semibold text-slate-900">{goal.targetValue}</span>{" "}
          {goal.unit ?? ""}
        </div>
      )}

      {pct != null && (
        <div className="mt-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-1 text-right text-xs text-slate-500">{pct}%</div>
        </div>
      )}

      {actions && <div className="mt-3">{actions}</div>}
    </div>
  );
}

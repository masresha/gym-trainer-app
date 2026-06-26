"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteWorkoutButton({ workoutId }: { workoutId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!confirm("Delete this workout?")) return;
    setBusy(true);
    await fetch(`/api/workouts/${workoutId}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  return (
    <button className="text-sm text-red-500 hover:underline" onClick={remove} disabled={busy}>
      Delete
    </button>
  );
}

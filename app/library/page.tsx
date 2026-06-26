import Link from "next/link";
import { requireTrainer } from "@/lib/guards";
import TopNav from "@/components/TopNav";
import LibraryManager from "@/components/LibraryManager";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const session = await requireTrainer();
  return (
    <div className="min-h-screen">
      <TopNav session={session} />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-800">← Dashboard</Link>
        <h1 className="mt-3 text-2xl font-bold">Exercise library</h1>
        <p className="mb-6 text-sm text-slate-500">
          Reusable exercises with demo videos. Names here auto-suggest when you build workouts.
        </p>
        <LibraryManager />
      </main>
    </div>
  );
}

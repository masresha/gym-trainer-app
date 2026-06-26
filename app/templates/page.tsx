import Link from "next/link";
import { requireTrainer } from "@/lib/guards";
import TopNav from "@/components/TopNav";
import TemplateManager from "@/components/TemplateManager";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const session = await requireTrainer();
  return (
    <div className="min-h-screen">
      <TopNav session={session} />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-800">← Dashboard</Link>
        <h1 className="mt-3 text-2xl font-bold">Workout templates</h1>
        <p className="mb-6 text-sm text-slate-500">
          Build a workout once, then assign it to any client across one or more dates to create a program.
        </p>
        <TemplateManager />
      </main>
    </div>
  );
}

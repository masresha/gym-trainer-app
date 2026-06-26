import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import type { SessionPayload } from "@/lib/auth";

export default function TopNav({ session }: { session: SessionPayload }) {
  const home = session.role === "TRAINER" ? "/dashboard" : "/me";
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
          <Link href={home} className="flex items-center gap-2 font-extrabold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-gradient text-white shadow-glow">C</span>
            CoachDeck
          </Link>
          {session.role === "TRAINER" && (
            <nav className="hidden items-center gap-1 text-sm font-semibold text-slate-500 sm:flex">
              <Link href="/dashboard" className="rounded-lg px-3 py-1.5 transition hover:bg-brand/10 hover:text-brand-dark">Clients</Link>
              <Link href="/library" className="rounded-lg px-3 py-1.5 transition hover:bg-brand/10 hover:text-brand-dark">Library</Link>
              <Link href="/templates" className="rounded-lg px-3 py-1.5 transition hover:bg-brand/10 hover:text-brand-dark">Templates</Link>
            </nav>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 text-sm font-medium text-slate-600 sm:flex">
            <span className="h-2 w-2 rounded-full bg-brand-light animate-pulse-soft" />
            {session.name}
            <span className="badge bg-slate-100 text-slate-500">{session.role === "TRAINER" ? "Trainer" : "Client"}</span>
          </span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}

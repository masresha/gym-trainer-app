import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import type { SessionPayload } from "@/lib/auth";

export default function TopNav({ session }: { session: SessionPayload }) {
  const home = session.role === "TRAINER" ? "/dashboard" : "/me";
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-5">
          <Link href={home} className="flex items-center gap-2 font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-white">C</span>
            CoachDeck
          </Link>
          {session.role === "TRAINER" && (
            <nav className="hidden items-center gap-4 text-sm text-slate-600 sm:flex">
              <Link href="/dashboard" className="hover:text-slate-900">Clients</Link>
              <Link href="/library" className="hover:text-slate-900">Library</Link>
              <Link href="/templates" className="hover:text-slate-900">Templates</Link>
            </nav>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-600 sm:block">
            {session.name} · <span className="text-slate-400">{session.role === "TRAINER" ? "Trainer" : "Client"}</span>
          </span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}

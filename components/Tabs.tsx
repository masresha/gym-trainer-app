"use client";

import { useState } from "react";

export default function Tabs({ tabs }: { tabs: { label: string; content: React.ReactNode }[] }) {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 rounded-2xl bg-white/70 p-1.5 ring-1 ring-slate-200 backdrop-blur">
        {tabs.map((t, i) => (
          <button
            key={t.label}
            onClick={() => setActive(i)}
            className={`rounded-xl px-4 py-2 text-sm font-bold tracking-tight transition-all duration-200 ${
              active === i
                ? "bg-brand-gradient text-white shadow-glow"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div key={active} className="pt-6 animate-fade-up">
        {tabs[active]?.content}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";

export default function Tabs({ tabs }: { tabs: { label: string; content: React.ReactNode }[] }) {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {tabs.map((t, i) => (
          <button
            key={t.label}
            onClick={() => setActive(i)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
              active === i
                ? "border-brand text-brand"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="pt-5">{tabs[active]?.content}</div>
    </div>
  );
}

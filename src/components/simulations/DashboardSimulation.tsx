"use client";

import { useState } from "react";

const VIEWS = {
  Content: [42, 58, 51, 66, 72, 69, 84],
  Users: [30, 34, 41, 39, 52, 61, 64],
  Errors: [12, 9, 14, 7, 5, 6, 3],
} as const;

type View = keyof typeof VIEWS;

/** A tiny admin view to poke at. Sample numbers, clearly labelled. */
export function DashboardSimulation() {
  const [view, setView] = useState<View>("Content");
  const data = VIEWS[view];
  const max = Math.max(...data);
  return (
    <div className="border border-line bg-[#0B1220]">
      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <div className="flex gap-1" role="tablist" aria-label="Dashboard view">
          {(Object.keys(VIEWS) as View[]).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={key === view}
              onClick={() => setView(key)}
              className={`px-2 py-1 text-sm ${key === view ? "bg-ink text-void" : "text-mute hover:text-ink"}`}
            >
              {key}
            </button>
          ))}
        </div>
        <span className="font-mono text-[10px] text-mute">sample data</span>
      </div>
      <div
        className="flex h-36 items-end gap-2 px-4 pt-4 pb-2"
        role="img"
        aria-label={`${view} over seven days: ${data.join(", ")}`}
      >
        {data.map((value, index) => (
          <div key={index} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
            <div
              className="w-full bg-cyan/80 transition-[height] duration-500 ease-out"
              style={{ height: `${(value / max) * 100}%` }}
            />
            <span className="font-mono text-[9px] text-mute">D{index + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

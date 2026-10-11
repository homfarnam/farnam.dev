"use client";

import { useEffect, useState } from "react";

const TITLES = ["Night Shift", "Northern Lines", "The Long Take", "Signal Lost"];
const LANGUAGES = [
  { code: "EN", line: "Previously, on the series…" },
  { code: "NL", line: "Eerder, in de serie…" },
  { code: "DE", line: "Bisher in der Serie…" },
  { code: "FR", line: "Précédemment, dans la série…" },
];

/** Catalogue → player flow with live language switching. Fictional titles. */
export function StreamingSimulation() {
  const [title, setTitle] = useState<string | null>(null);
  const [language, setLanguage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!title || paused) return;
    const timer = window.setInterval(() => setProgress((value) => (value >= 100 ? 0 : value + 0.6)), 100);
    return () => window.clearInterval(timer);
  }, [title, paused]);

  return (
    <div className="border border-line bg-[#0B1220]">
      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <span className="text-sm">{title ?? "Catalogue"}</span>
        <span className="font-mono text-[10px] text-mute">simulation · fictional titles</span>
      </div>
      {title ? (
        <div>
          <div className="relative flex aspect-video items-end justify-center overflow-hidden bg-gradient-to-br from-signal/40 via-navy to-void p-4">
            <p className="bg-void/70 px-2 py-1 text-sm" aria-live="polite">
              {LANGUAGES[language]?.line}
            </p>
            <div className="absolute inset-x-0 bottom-0 h-1 bg-line">
              <div className="h-full bg-cyan" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPaused((value) => !value)}
                className="bg-cyan px-3 py-1.5 text-sm font-medium text-void"
              >
                {paused ? "Play" : "Pause"}
              </button>
              <button type="button" onClick={() => setTitle(null)} className="border border-line px-3 py-1.5 text-sm">
                Back
              </button>
            </div>
            <div className="flex gap-1" role="group" aria-label="Subtitle language">
              {LANGUAGES.map((entry, index) => (
                <button
                  key={entry.code}
                  type="button"
                  aria-pressed={index === language}
                  onClick={() => setLanguage(index)}
                  className={`px-2 py-1 font-mono text-[11px] ${index === language ? "bg-ink text-void" : "text-mute hover:text-ink"}`}
                >
                  {entry.code}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-2 p-4">
          {TITLES.map((name, index) => (
            <li key={name}>
              <button
                type="button"
                onClick={() => {
                  setTitle(name);
                  setProgress(0);
                  setPaused(false);
                }}
                className="group flex aspect-video w-full items-end bg-navy p-2 text-left text-sm transition-colors hover:bg-signal/30"
                style={{ backgroundImage: `linear-gradient(${120 + index * 40}deg, rgb(59 130 246 / 0.25), transparent)` }}
              >
                <span>{name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

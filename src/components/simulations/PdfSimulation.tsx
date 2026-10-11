"use client";

import { useEffect, useState } from "react";
import { sounds } from "@/lib/audio/engine";
import { useExperience } from "@/stores/experienceStore";

const PAGES = 6;

/** Drives the 3D document split and mirrors it as a list of rendered page images. */
export function PdfSimulation() {
  const archiveOpen = useExperience((state) => state.archiveOpen);
  const setArchiveOpen = useExperience((state) => state.setArchiveOpen);
  const [rendered, setRendered] = useState(0);

  useEffect(() => {
    if (!archiveOpen) {
      setRendered(0);
      return;
    }
    if (rendered >= PAGES) return;
    const timer = window.setTimeout(() => {
      setRendered((count) => count + 1);
      sounds.hover();
    }, 260);
    return () => window.clearTimeout(timer);
  }, [archiveOpen, rendered]);

  return (
    <div className="border border-line bg-[#0B1220]">
      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <span className="text-sm">report.pdf → images</span>
        <span className="font-mono text-[10px] text-mute">simulation</span>
      </div>
      <ol className="grid grid-cols-3 gap-2 p-4 sm:grid-cols-6" aria-live="polite">
        {Array.from({ length: PAGES }, (_, index) => (
          <li
            key={index}
            className={`aspect-[3/4] border transition-all duration-500 ${
              index < rendered ? "border-cyan bg-ink/85" : "border-line bg-navy"
            }`}
          >
            <span className={`block p-1 font-mono text-[9px] ${index < rendered ? "text-void" : "text-mute"}`}>
              {index < rendered ? `page-${index + 1}.png` : `p${index + 1}`}
            </span>
          </li>
        ))}
      </ol>
      <div className="border-t border-line px-4 py-3">
        <button
          type="button"
          onClick={() => setArchiveOpen(!archiveOpen)}
          className="bg-cyan px-4 py-2 text-sm font-medium text-void"
        >
          {archiveOpen ? "Put the document back" : "Convert to images"}
        </button>
        <span className="ml-3 font-mono text-[11px] text-mute">watch the artifact</span>
      </div>
    </div>
  );
}

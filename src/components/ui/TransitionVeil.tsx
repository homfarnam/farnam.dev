"use client";

import { getChapter } from "@/data/chapters";
import { useExperience } from "@/stores/experienceStore";

/** Chapter title card shown while the camera travels through a corridor. */
export function TransitionVeil() {
  const travellingTo = useExperience((state) => state.travellingTo);
  const reducedMotion = useExperience((state) => state.reducedMotion);
  if (!travellingTo) return null;
  const chapter = getChapter(travellingTo);
  return (
    <div
      className={`pointer-events-none fixed inset-0 z-30 flex items-center justify-center ${reducedMotion ? "bg-void" : ""}`}
      role="status"
      aria-live="polite"
    >
      <div className="animate-[line-in_700ms_var(--ease-out-expo)] text-center">
        <p className="font-mono text-xs text-cyan">Chapter 0{chapter.number}</p>
        <p className="mt-2 text-4xl font-medium tracking-tight sm:text-6xl">{chapter.title}</p>
        <p className="mt-2 text-mute">{chapter.place}</p>
      </div>
    </div>
  );
}

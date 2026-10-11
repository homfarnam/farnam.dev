"use client";

import { useEffect, useState } from "react";
import { getChapter } from "@/data/chapters";
import { useExperience } from "@/stores/experienceStore";

const BEAT_MS = 3200;

/** Narrative beats that surface one by one when the visitor arrives in a chapter. */
export function StoryCaption() {
  const phase = useExperience((state) => state.phase);
  const chapterId = useExperience((state) => state.chapter);
  const travellingTo = useExperience((state) => state.travellingTo);
  const focusedProject = useExperience((state) => state.focusedProject);
  const journeyStop = useExperience((state) => state.journeyStop);
  const [beat, setBeat] = useState(0);

  const narrative = getChapter(chapterId).narrative;
  const active = phase === "explore" && !travellingTo && !focusedProject && journeyStop === null;

  useEffect(() => {
    setBeat(0);
  }, [chapterId]);

  useEffect(() => {
    if (!active || beat > narrative.length) return;
    // The first beat waits for the camera to settle.
    const timer = window.setTimeout(() => setBeat((value) => value + 1), beat === 0 ? 1600 : BEAT_MS);
    return () => window.clearTimeout(timer);
  }, [active, beat, narrative.length]);

  const line = beat >= 1 && beat <= narrative.length ? narrative[beat - 1] : null;
  if (!active || !line) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-28 z-20 flex justify-center px-6 sm:bottom-24">
      <p
        key={line}
        aria-live="polite"
        className="max-w-2xl animate-[line-in_900ms_var(--ease-out-expo)] text-center text-lg text-ink/90 sm:text-2xl"
      >
        {line}
      </p>
    </div>
  );
}

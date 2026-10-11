"use client";

import { getChapter } from "@/data/chapters";
import { useExperience } from "@/stores/experienceStore";
import { Dialog } from "./Dialog";

const PREVIEWS: Record<string, string> = {
  engineer:
    "A terminal that unfolds into a living map of the systems I've built — and a small puzzle where you wire frontend, backend, database and infrastructure until the system comes online.",
  musician:
    "A sound chamber with a guitar you can strum, a violin that moves particles like sound waves, an accordion you can play, and an audio-reactive visualiser.",
  human: "A quiet observatory above a future Amsterdam skyline, where the story ends and the conversation starts.",
};

/** Honest state for chambers that are not built yet. */
export function SealedPanel() {
  const sealedChapter = useExperience((state) => state.sealedChapter);
  const closeTopmost = useExperience((state) => state.closeTopmost);
  const setTextMode = useExperience((state) => state.setTextMode);
  if (!sealedChapter) return null;
  const chapter = getChapter(sealedChapter);

  function readText() {
    closeTopmost();
    setTextMode(true);
    window.setTimeout(() => document.getElementById(`${chapter.id}-heading`)?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  return (
    <Dialog title={chapter.title} kicker={`chapter 0${chapter.number} / sealed`} onClose={closeTopmost}>
      <p className="text-ink/90">This chamber is still being built. When it opens, you'll find:</p>
      <p className="mt-4 text-lg leading-relaxed">{PREVIEWS[chapter.id]}</p>
      <p className="mt-6 text-sm text-mute">Everything it will hold is already readable in the text version.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={readText}
          className="bg-ember px-4 py-2 text-sm font-medium text-void hover:brightness-110"
        >
          Read {chapter.title.toLowerCase()} as text
        </button>
        <button type="button" onClick={closeTopmost} className="border border-line px-4 py-2 text-sm hover:border-cyan">
          Stay in the lab
        </button>
      </div>
    </Dialog>
  );
}

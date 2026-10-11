import { chapters, type ChapterId } from "@/data/chapters";
import { journeyStops } from "@/data/journey";
import { projects, type ProjectId } from "@/data/projects";
import { useExperience } from "@/stores/experienceStore";

/**
 * The linear "story path" through the world, used by the arrow
 * keys and the guided-mode buttons. Free exploration ignores it.
 */
export interface Stop {
  chapter: ChapterId;
  project: ProjectId | null;
  journeyStop: number | null;
}

export const stops: Stop[] = chapters
  .filter((chapter) => chapter.open)
  .flatMap((chapter): Stop[] => {
    const base: Stop = { chapter: chapter.id, project: null, journeyStop: null };
    if (chapter.id === "creator") {
      return [base, ...projects.map((project) => ({ ...base, project: project.id }))];
    }
    if (chapter.id === "journey") {
      return [base, ...journeyStops.map((_, index) => ({ ...base, journeyStop: index }))];
    }
    return [base];
  });

export function currentStopIndex(): number {
  const { chapter, focusedProject, journeyStop } = useExperience.getState();
  return stops.findIndex(
    (stop) => stop.chapter === chapter && stop.project === focusedProject && stop.journeyStop === journeyStop,
  );
}

export function stopAt(offset: number): Stop | null {
  return stops[currentStopIndex() + offset] ?? null;
}

function applyFocus(stop: Stop) {
  const state = useExperience.getState();
  if (stop.chapter === "journey") state.focusJourneyStop(stop.journeyStop);
  else state.focusProject(stop.project);
}

/** Move one stop along the story path. Returns false at either end. */
export function step(direction: 1 | -1): boolean {
  const state = useExperience.getState();
  if (state.phase !== "explore" || state.travellingTo || state.panel || state.walking) return false;
  const next = stopAt(direction);
  if (!next) return false;
  if (next.chapter !== state.chapter) {
    state.goTo(next.chapter);
    if (next.project || next.journeyStop !== null) {
      const unsubscribe = useExperience.subscribe(
        (s) => s.travellingTo,
        (travelling) => {
          if (travelling) return;
          unsubscribe();
          applyFocus(next);
        },
      );
    }
  } else {
    applyFocus(next);
  }
  return true;
}

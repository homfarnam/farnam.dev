import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { chapterOrder, getChapter, type ChapterId } from "@/data/chapters";
import type { ProjectId } from "@/data/projects";
import type { StreetId } from "@/lib/world/street";

export type Phase = "boot" | "explore";
export type ExplorationMode = "guided" | "free";
export type Quality = "high" | "low";
export type Panel = "dossier" | "terminal" | "sealed" | "help" | null;

export interface ExperienceState {
  phase: Phase;
  mode: ExplorationMode;
  chapter: ChapterId;
  /** Chapter the camera is travelling towards, null when at rest. */
  travellingTo: ChapterId | null;
  /** Chapters whose scenes have been mounted at least once (lazy loading). */
  mounted: ChapterId[];
  focusedProject: ProjectId | null;
  /** Index into journeyStops while the Journey camera sits at a stop. */
  journeyStop: number | null;
  /** Free-look camera in the Journey: drag, scroll and keys move the camera instead of the story. */
  journeyExplore: boolean;
  /** The Journey is playing itself, stop after stop. */
  journeyPlaying: boolean;
  /** Street-level walk. Owns camera and input while true. */
  walking: boolean;
  /** Which street the walk shows. */
  walkStreet: StreetId;
  panel: Panel;
  sealedChapter: ChapterId | null;
  hovered: string | null;
  audioEnabled: boolean;
  quality: Quality;
  reducedMotion: boolean;
  /** 3D world hidden, crawlable 2D document shown instead. */
  textMode: boolean;
  sceneReady: boolean;
  overdrive: boolean;
  toast: string | null;
  /** PDF artifact pages fanned out (driven by its simulation). */
  archiveOpen: boolean;

  begin: (mode: ExplorationMode) => void;
  goTo: (chapter: ChapterId) => void;
  arrive: () => void;
  stepGuided: (direction: 1 | -1) => void;
  focusProject: (project: ProjectId | null) => void;
  focusJourneyStop: (index: number | null) => void;
  setJourneyExplore: (explore: boolean) => void;
  setJourneyPlaying: (playing: boolean) => void;
  setWalking: (walking: boolean, street?: StreetId) => void;
  openPanel: (panel: Exclude<Panel, null>) => void;
  closeTopmost: () => void;
  setHovered: (id: string | null) => void;
  setAudio: (enabled: boolean) => void;
  setQuality: (quality: Quality) => void;
  setReducedMotion: (reduced: boolean) => void;
  setTextMode: (textMode: boolean) => void;
  setSceneReady: () => void;
  triggerOverdrive: () => void;
  showToast: (message: string | null) => void;
  setArchiveOpen: (open: boolean) => void;
}

export const useExperience = create<ExperienceState>()(
  subscribeWithSelector((set, get) => ({
    phase: "boot",
    mode: "free",
    chapter: "awakening",
    travellingTo: null,
    mounted: ["awakening"],
    focusedProject: null,
    journeyStop: null,
    journeyExplore: false,
    journeyPlaying: false,
    walking: false,
    walkStreet: "herengracht",
    panel: null,
    sealedChapter: null,
    hovered: null,
    audioEnabled: false,
    quality: "high",
    reducedMotion: false,
    textMode: false,
    sceneReady: false,
    overdrive: false,
    toast: null,
    archiveOpen: false,

    begin: (mode) => set({ phase: "explore", mode }),

    goTo: (target) => {
      const { chapter, travellingTo, mounted, walking } = get();
      if (travellingTo) return;
      // Leaving the street first; the next call (after the fade) travels.
      if (walking) {
        set({ walking: false });
        return;
      }
      if (!getChapter(target).open) {
        set({ panel: "sealed", sealedChapter: target });
        return;
      }
      if (target === chapter) {
        set({ focusedProject: null, journeyStop: null, journeyExplore: false, panel: null });
        return;
      }
      set({
        travellingTo: target,
        focusedProject: null,
        journeyStop: null,
        journeyExplore: false,
        panel: null,
        hovered: null,
        mounted: mounted.includes(target) ? mounted : [...mounted, target],
      });
    },

    arrive: () => {
      const { travellingTo } = get();
      if (travellingTo) set({ chapter: travellingTo, travellingTo: null });
    },

    stepGuided: (direction) => {
      const { chapter } = get();
      const openChapters = chapterOrder.filter((id) => getChapter(id).open);
      const index = openChapters.indexOf(chapter);
      const next = openChapters[index + direction];
      if (next) get().goTo(next);
    },

    focusProject: (project) => set({ focusedProject: project, hovered: null, archiveOpen: false }),
    focusJourneyStop: (journeyStop) => set({ journeyStop, journeyExplore: false, walking: false, hovered: null }),
    setJourneyExplore: (journeyExplore) => set({ journeyExplore }),
    setJourneyPlaying: (journeyPlaying) => set({ journeyPlaying }),
    setWalking: (walking, street) =>
      set(
        street
          ? { walking, walkStreet: street, journeyExplore: false, panel: null }
          : { walking, journeyExplore: false, panel: null },
      ),

    openPanel: (panel) => set({ panel }),

    closeTopmost: () => {
      const { panel, focusedProject, journeyStop, journeyExplore, walking } = get();
      if (panel) set({ panel: null, sealedChapter: null });
      else if (walking) set({ walking: false });
      else if (focusedProject) set({ focusedProject: null });
      else if (journeyExplore) set({ journeyExplore: false });
      else if (journeyStop !== null) set({ journeyStop: null });
    },

    setHovered: (hovered) => set({ hovered }),
    setAudio: (audioEnabled) => set({ audioEnabled }),
    setQuality: (quality) => set({ quality }),
    setReducedMotion: (reducedMotion) => set({ reducedMotion }),
    // Entering the text version unmounts the camera, so settle any trip in progress.
    setTextMode: (textMode) => {
      const { travellingTo } = get();
      const base = textMode ? { textMode, walking: false } : { textMode };
      set(textMode && travellingTo ? { ...base, chapter: travellingTo, travellingTo: null } : base);
    },
    setSceneReady: () => set({ sceneReady: true }),
    triggerOverdrive: () => set({ overdrive: true, toast: "Overdrive engaged. The lab remembers the old codes." }),
    showToast: (toast) => set({ toast }),
    setArchiveOpen: (archiveOpen) => set({ archiveOpen }),
  })),
);

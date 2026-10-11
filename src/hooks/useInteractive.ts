"use client";

import type { ChapterId } from "@/data/chapters";
import { useExperience } from "@/stores/experienceStore";

/** Hotspots only respond while the visitor is standing in their chapter. */
export function useInteractive(chapter: ChapterId): boolean {
  return useExperience((state) => state.phase === "explore" && state.chapter === chapter && state.travellingTo === null);
}

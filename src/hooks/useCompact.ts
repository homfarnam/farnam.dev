"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(max-width: 767px), (pointer: coarse) and (max-width: 1024px)";

function subscribe(callback: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

/** True on phones and small touch devices — drives camera framing and layout. */
export function useCompact(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}

export function isCompactNow(): boolean {
  return typeof window !== "undefined" && window.matchMedia(QUERY).matches;
}

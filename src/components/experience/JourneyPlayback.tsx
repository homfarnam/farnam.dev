"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { player, segmentIndexAt, segmentIndexOf, segments, TOTAL_SECONDS } from "@/lib/world/journeyPlayer";
import { runtime } from "@/lib/world/runtime";
import { useExperience, type ExperienceState } from "@/stores/experienceStore";

/** Play / pause from any button or key. A finished scene starts again from the globe. */
export function toggleJourneyPlay() {
  const state = useExperience.getState();
  if (state.journeyPlaying) {
    state.setJourneyPlaying(false);
    return;
  }
  if (player.elapsed >= TOTAL_SECONDS - 0.05) player.elapsed = 0;
  state.setJourneyPlaying(true);
}

/** Anything that takes the visitor out of the story pauses the scene. */
function blocked(state: ExperienceState): boolean {
  return (
    state.journeyExplore ||
    state.walking ||
    state.panel !== null ||
    state.textMode ||
    state.phase !== "explore" ||
    (state.travellingTo ?? state.chapter) !== "journey"
  );
}

function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(target.tagName))
  );
}

/**
 * Drives the Journey scene: advances the play head in real time, moves to
 * each stop as its segment begins, and follows the visitor when they jump
 * (timeline, arrows, Next / Back) so playing resumes from wherever they are.
 * Starts by itself on arriving in the chapter (not under reduced motion).
 */
export function JourneyPlayback() {
  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    let current = -1;
    let driving = false;
    let arc: gsap.core.Tween | null = null;

    function enter(index: number) {
      const segment = segments[index];
      if (!segment) return;
      const state = useExperience.getState();
      if (state.journeyStop !== segment.stop) {
        driving = true;
        state.focusJourneyStop(segment.stop);
        driving = false;
      }
      // Opening on a globe whose line is already drawn: draw the flight again.
      if (segment.stop === null && runtime.globe > 0.999 && runtime.globeArc >= 1 && !state.reducedMotion) {
        arc?.kill();
        arc = gsap.fromTo(
          runtime,
          { globeArc: 0 },
          { globeArc: 1, duration: 4.8, delay: 0.4, ease: "power1.inOut", overwrite: "auto" },
        );
      }
    }

    function tick(now: number) {
      // Clamped so a backgrounded tab doesn't skip stops when it comes back.
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const state = useExperience.getState();
      if (state.journeyPlaying) {
        if (!state.travellingTo) player.elapsed += dt;
        if (player.elapsed >= TOTAL_SECONDS) {
          player.elapsed = TOTAL_SECONDS;
          state.setJourneyPlaying(false);
        } else {
          const index = segmentIndexAt(player.elapsed);
          if (index !== current) {
            current = index;
            enter(index);
          }
        }
      }
      const segment = segments[segmentIndexAt(player.elapsed)];
      runtime.playDrift = state.journeyPlaying && segment ? Math.min(1, (player.elapsed - segment.start) / segment.duration) : 0;
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);

    const unsubscribers = [
      // The visitor jumped: move the play head to that stop.
      useExperience.subscribe(
        (state) => state.journeyStop,
        (stop) => {
          if (driving) return;
          current = segmentIndexOf(stop);
          player.elapsed = segments[current]?.start ?? 0;
        },
      ),
      // Play: re-enter the segment under the play head.
      useExperience.subscribe(
        (state) => state.journeyPlaying,
        (playing) => {
          if (playing) current = -1;
        },
      ),
      useExperience.subscribe(blocked, (isBlocked) => {
        if (isBlocked && useExperience.getState().journeyPlaying) useExperience.getState().setJourneyPlaying(false);
      }),
      // Arriving in the Journey starts the scene from the globe.
      useExperience.subscribe(
        (state) => state.chapter,
        (chapter, previous) => {
          const state = useExperience.getState();
          if (chapter !== "journey" || previous === "journey" || state.reducedMotion || state.journeyStop !== null) return;
          player.elapsed = 0;
          current = -1;
          state.setJourneyPlaying(true);
        },
      ),
    ];

    function onKey(event: KeyboardEvent) {
      if (event.key !== " " || isTyping(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
      const state = useExperience.getState();
      if (state.chapter !== "journey" || blocked(state)) return;
      event.preventDefault();
      toggleJourneyPlay();
    }
    window.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(frame);
      arc?.kill();
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return null;
}

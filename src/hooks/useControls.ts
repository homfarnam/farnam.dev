"use client";

import { useEffect } from "react";
import { chapters } from "@/data/chapters";
import { sounds } from "@/lib/audio/engine";
import { step } from "@/lib/world/stops";
import { runtime } from "@/lib/world/runtime";
import { useExperience } from "@/stores/experienceStore";

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
const STEP_COOLDOWN_MS = 900;

function isTyping(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}

/**
 * Keyboard shortcuts and the Konami code. Scrolling and swiping never move
 * the story: only arrow keys and the on-screen buttons do.
 */
export function useControls() {
  useEffect(() => {
    let konamiIndex = 0;
    let lastStep = 0;

    function throttledStep(direction: 1 | -1) {
      const now = performance.now();
      if (now - lastStep < STEP_COOLDOWN_MS) return;
      if (step(direction)) {
        lastStep = now;
        sounds.select();
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      const state = useExperience.getState();

      const expected = KONAMI[konamiIndex];
      konamiIndex =
        event.key === expected || event.key.toLowerCase() === expected ? konamiIndex + 1 : event.key === KONAMI[0] ? 1 : 0;
      if (konamiIndex === KONAMI.length) {
        konamiIndex = 0;
        state.triggerOverdrive();
        return;
      }
      // Mid-code (after ↑↑↓↓) the arrows belong to the code, not to navigation.
      const enteringCode = konamiIndex >= 5;

      if (event.key === "Escape") {
        state.closeTopmost();
        return;
      }
      // In the text version the 3D world isn't mounted — keys belong to the document.
      if (state.textMode) return;
      if (state.phase !== "explore" || isTyping(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
      if (state.panel) return;

      if (state.walking) return; // number keys too: the street owns the keyboard until Esc
      const chapterByNumber = chapters.find((chapter) => String(chapter.number) === event.key);
      if (chapterByNumber) {
        state.goTo(chapterByNumber.id);
        return;
      }
      // In Journey free look and street walk, letters and arrows steer the camera.
      if (state.journeyExplore || state.walking) return;
      switch (event.key) {
        case "h":
        case "Home":
          state.goTo("awakening");
          break;
        case "`":
        case "~":
          event.preventDefault();
          state.openPanel("terminal");
          break;
        case "d":
          state.openPanel("dossier");
          break;
        case "?":
          state.openPanel("help");
          break;
        case "ArrowRight":
        case "PageDown":
          if (!enteringCode) throttledStep(1);
          break;
        case "ArrowLeft":
        case "PageUp":
          if (!enteringCode) throttledStep(-1);
          break;
        default:
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);
}

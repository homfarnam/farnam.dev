"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import gsap from "gsap";
import { ACESFilmicToneMapping } from "three";
import { BootSequence } from "@/components/ui/BootSequence";
import { DossierPanel } from "@/components/ui/DossierPanel";
import { HelpPanel } from "@/components/ui/HelpPanel";
import { HUD } from "@/components/ui/HUD";
import { JourneyPanel } from "@/components/ui/JourneyPanel";
import { WalkOverlay } from "@/components/ui/WalkOverlay";
import { ProjectPanel } from "@/components/ui/ProjectPanel";
import { SealedPanel } from "@/components/ui/SealedPanel";
import { StoryCaption } from "@/components/ui/StoryCaption";
import { TerminalPanel } from "@/components/ui/TerminalPanel";
import { Toast } from "@/components/ui/Toast";
import { TransitionVeil } from "@/components/ui/TransitionVeil";
import { useControls } from "@/hooks/useControls";
import { runtime } from "@/lib/world/runtime";
import { useExperience } from "@/stores/experienceStore";
import { JourneyPlayback } from "./JourneyPlayback";
import { World } from "./World";

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Rough first guess; PerformanceMonitor refines it at runtime. */
function initialQuality(): "high" | "low" {
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const cores = navigator.hardwareConcurrency ?? 8;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  return coarse || cores <= 4 || memory <= 4 ? "low" : "high";
}

/** Client root of the 3D experience: capability checks, canvas, overlays. */
export function Experience() {
  const textMode = useExperience((state) => state.textMode);
  const panel = useExperience((state) => state.panel);
  const phase = useExperience((state) => state.phase);
  const quality = useExperience((state) => state.quality);
  const overdrive = useExperience((state) => state.overdrive);
  const [webgl, setWebgl] = useState<boolean | null>(null);

  useControls();

  // Dev-only handle for the headless screenshot harness (scripts/shoot.mjs).
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    Object.assign(window, { __experience: useExperience, __runtime: runtime, __gsap: gsap });
  }, []);

  // Capability detection runs once on the client.
  useEffect(() => {
    const store = useExperience.getState();
    const supported = supportsWebGL();
    setWebgl(supported);
    if (!supported) store.setTextMode(true);
    store.setQuality(initialQuality());
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    store.setReducedMotion(motion.matches);
    const onMotion = (event: MediaQueryListEvent) => store.setReducedMotion(event.matches);
    motion.addEventListener("change", onMotion);
    return () => motion.removeEventListener("change", onMotion);
  }, []);

  // While the 3D world is up, the document underneath is inert and the page doesn't scroll.
  useEffect(() => {
    const content = document.getElementById("content");
    const immersive = webgl === true && !textMode;
    document.body.classList.toggle("experience-active", immersive);
    if (content) content.inert = immersive;
    if (!immersive) window.scrollTo({ top: 0 });
  }, [textMode, webgl]);

  useEffect(() => {
    runtime.particleScale = quality === "low" ? 0.35 : 1;
  }, [quality]);

  // Warm the vault's code chunk once the lab is up, so the first visit doesn't stall.
  useEffect(() => {
    if (phase !== "explore") return;
    const timer = window.setTimeout(() => {
      void import("@/components/scenes/JourneyScene");
      void import("@/components/scenes/CreatorScene");
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (!overdrive) return;
    const tween = gsap.timeline({ onComplete: () => useExperience.setState({ overdrive: false }) });
    tween
      .to(runtime, { overdrive: 1, duration: 0.6, ease: "power3.out" })
      .to(runtime, { overdrive: 0, duration: 5, ease: "power2.inOut" });
    return () => void tween.kill();
  }, [overdrive]);

  if (webgl === null) return null;

  if (textMode) {
    return webgl ? (
      <button
        type="button"
        onClick={() => useExperience.getState().setTextMode(false)}
        className="instrument fixed top-4 right-4 z-40 px-4 py-2 text-sm hover:text-cyan"
      >
        Enter the 3D lab
      </button>
    ) : (
      <p className="fixed inset-x-0 top-0 z-40 bg-navy px-4 py-2 text-center font-mono text-xs text-mute">
        Your browser can't run the 3D lab, so here is the whole story as text.
      </p>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-10 bg-void" aria-hidden="true">
        <Canvas
          shadows
          dpr={quality === "low" ? [1, 1.25] : [1, 1.75]}
          gl={{ antialias: true, powerPreference: "high-performance", toneMapping: ACESFilmicToneMapping }}
          camera={{ fov: 50, near: 0.1, far: 220, position: [0, 2.2, 6.5] }}
        >
          <World />
        </Canvas>
      </div>

      <BootSequence />
      <HUD />
      <StoryCaption />
      <TransitionVeil />
      <ProjectPanel />
      <JourneyPlayback />
      <JourneyPanel />
      <WalkOverlay />
      {panel === "dossier" ? <DossierPanel /> : null}
      {panel === "terminal" ? <TerminalPanel /> : null}
      {panel === "help" ? <HelpPanel /> : null}
      {panel === "sealed" ? <SealedPanel /> : null}
      <Toast />
    </>
  );
}

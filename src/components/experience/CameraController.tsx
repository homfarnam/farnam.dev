"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { Vector3 } from "three";
import type { ChapterId } from "@/data/chapters";
import { isCompactNow } from "@/hooks/useCompact";
import { sounds } from "@/lib/audio/engine";
import { chamberThresholdShot, chapterShot, doorApproachShot, type CameraShot } from "@/lib/world/layout";
import { runtime } from "@/lib/world/runtime";
import { isMoveStop, journeyShot } from "@/lib/world/journey";
import { artifactShot } from "@/lib/world/vault";
import { useExperience } from "@/stores/experienceStore";

/** Lights stutter on like old fluorescent tubes, then settle. */
function powerUp(instant: boolean) {
  if (instant) {
    runtime.power = 1;
    return;
  }
  gsap
    .timeline()
    .to(runtime, { power: 0.35, duration: 0.12 })
    .to(runtime, { power: 0.04, duration: 0.08 })
    .to(runtime, { power: 0.55, duration: 0.18, delay: 0.25 })
    .to(runtime, { power: 0.15, duration: 0.1 })
    .to(runtime, { power: 1, duration: 2.4, ease: "power2.out", delay: 0.2 });
}

/** Where the camera waits in the dark before the lab powers up. */
const INTRO_SHOT: CameraShot = { position: [0, 2.2, 6.5], target: [0, 2.6, 0] };

interface Rig {
  px: number;
  py: number;
  pz: number;
  tx: number;
  ty: number;
  tz: number;
}

function rigFromShot({ position, target }: CameraShot): Rig {
  return { px: position[0], py: position[1], pz: position[2], tx: target[0], ty: target[1], tz: target[2] };
}

/** Where the camera should rest given the current chapter and focus. */
function restingShot(compact: boolean): CameraShot {
  const { chapter, focusedProject, journeyStop } = useExperience.getState();
  if (chapter === "creator" && focusedProject) return artifactShot(focusedProject, compact);
  if (chapter === "journey" && journeyStop !== null) return journeyShot(journeyStop, compact);
  return chapterShot(chapter, compact);
}

/** Flight path between two chapters, as a list of waypoints. */
function travelPath(from: ChapterId, to: ChapterId, compact: boolean): CameraShot[] {
  const path: CameraShot[] = [];
  if (from !== "awakening") {
    const threshold = chamberThresholdShot(from);
    const door = doorApproachShot(from);
    // Leave the chamber looking back towards the hub.
    path.push({ position: threshold.position, target: door.position });
    path.push({ position: door.position, target: [0, 2.4, 0] });
  }
  if (to === "awakening") {
    path.push(chapterShot("awakening", compact));
    return path;
  }
  path.push(doorApproachShot(to));
  path.push(chamberThresholdShot(to));
  path.push(chapterShot(to, compact));
  return path;
}

/**
 * Owns the camera. GSAP tweens a plain rig object; a single frame callback
 * applies it and layers pointer parallax on top. Nothing else moves the camera.
 */
export function CameraController() {
  const camera = useThree((state) => state.camera);
  const rig = useRef<Rig>(rigFromShot(INTRO_SHOT));
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const lookTarget = useRef(new Vector3());
  const right = useRef(new Vector3());
  const up = useRef(new Vector3(0, 1, 0));
  const parallax = useRef({ x: 0, y: 0 });
  const planeFollow = useRef(0);
  const drift = useRef(0);

  // Remounting mid-session (e.g. back from the text version): settle any interrupted
  // trip and cut straight to where the visitor is, instead of the intro close-up.
  useEffect(() => {
    const state = useExperience.getState();
    if (state.phase !== "explore") return;
    if (state.travellingTo) state.arrive();
    rig.current = rigFromShot(restingShot(isCompactNow()));
    runtime.power = 1;
  }, []);

  useEffect(() => {
    function tweenTo(shots: CameraShot[], durations: number[], onComplete?: () => void) {
      timeline.current?.kill();
      const { reducedMotion } = useExperience.getState();
      const tl = gsap.timeline({ onComplete });
      if (reducedMotion) {
        const last = shots[shots.length - 1];
        if (last) tl.set(rig.current, rigFromShot(last));
        timeline.current = tl;
        return tl;
      }
      shots.forEach((shot, index) => {
        tl.to(rig.current, {
          ...rigFromShot(shot),
          duration: durations[index] ?? 1.2,
          ease: index === 0 && shots.length > 1 ? "power2.in" : index === shots.length - 1 ? "power3.out" : "none",
        });
      });
      timeline.current = tl;
      return tl;
    }

    const unsubscribers = [
      // Intro reveal: pull back from the core while the lights come on.
      useExperience.subscribe(
        (state) => state.phase,
        (phase) => {
          if (phase !== "explore") return;
          const { reducedMotion } = useExperience.getState();
          const compact = isCompactNow();
          tweenTo([chapterShot("awakening", compact)], [reducedMotion ? 0 : 4.2]);
          powerUp(reducedMotion);
          sounds.power();
        },
      ),

      // Chapter travel through doors and corridors.
      useExperience.subscribe(
        (state) => state.travellingTo,
        (to) => {
          if (!to) return;
          const { chapter } = useExperience.getState();
          const path = travelPath(chapter, to, isCompactNow());
          const durations = path.map((_, index) => {
            if (index === path.length - 1) return 1.4;
            return index === 0 ? 1.1 : 1.3;
          });
          sounds.travel();
          const tl = tweenTo(path, durations, () => useExperience.getState().arrive());
          if (!useExperience.getState().reducedMotion) {
            gsap.fromTo(
              runtime,
              { warp: 0 },
              { warp: 1, duration: tl.duration() * 0.5, yoyo: true, repeat: 1, ease: "sine.inOut" },
            );
          }
        },
      ),

      // Artifact close-ups.
      useExperience.subscribe(
        (state) => state.focusedProject,
        (project) => {
          const { chapter, travellingTo } = useExperience.getState();
          if (travellingTo || chapter !== "creator") return;
          const compact = isCompactNow();
          tweenTo([project ? artifactShot(project, compact) : chapterShot("creator", compact)], [1.3]);
        },
      ),

      // Free look: hand the camera to the controls; on exit, glide back to the story.
      useExperience.subscribe(
        (state) => state.journeyExplore,
        (explore) => {
          if (explore) {
            timeline.current?.kill();
            return;
          }
          const { travellingTo, phase } = useExperience.getState();
          if (travellingTo || phase !== "explore") return;
          tweenTo([restingShot(isCompactNow())], [1.4]);
        },
      ),

      // Back from the street: cut (under the fade) straight to where the story was.
      useExperience.subscribe(
        (state) => state.walking,
        (walking) => {
          timeline.current?.kill();
          if (!walking) rig.current = rigFromShot(restingShot(isCompactNow()));
        },
      ),

      // Journey: glide from stop to stop along the route.
      useExperience.subscribe(
        (state) => state.journeyStop,
        (stop) => {
          const { chapter, travellingTo } = useExperience.getState();
          if (travellingTo || chapter !== "journey") return;
          const compact = isCompactNow();
          tweenTo([stop === null ? chapterShot("journey", compact) : journeyShot(stop, compact)], [1.6]);
        },
      ),
    ];

    function onResize() {
      const { travellingTo, phase } = useExperience.getState();
      if (travellingTo || phase !== "explore") return;
      tweenTo([restingShot(isCompactNow())], [0.6]);
    }
    window.addEventListener("resize", onResize);

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      window.removeEventListener("resize", onResize);
      timeline.current?.kill();
    };
  }, []);

  useFrame((state, delta) => {
    const { reducedMotion, focusedProject, journeyExplore, walking } = useExperience.getState();
    if (walking) {
      // The street walk owns the camera (and lives in another part of the world).
      parallax.current.x = 0;
      parallax.current.y = 0;
      return;
    }
    if (journeyExplore) {
      // Free look owns the camera. Keep the rig in sync so leaving starts from here.
      const r = rig.current;
      r.px = camera.position.x;
      r.py = camera.position.y;
      r.pz = camera.position.z;
      r.tx = runtime.cameraTarget.x;
      r.ty = runtime.cameraTarget.y;
      r.tz = runtime.cameraTarget.z;
      parallax.current.x = 0;
      parallax.current.y = 0;
      return;
    }
    const strength = reducedMotion ? 0 : focusedProject ? 0.12 : 0.45;
    const ease = 1 - Math.exp(-delta * 3);
    parallax.current.x += (state.pointer.x * strength - parallax.current.x) * ease;
    parallax.current.y += (state.pointer.y * strength * 0.5 - parallax.current.y) * ease;

    const r = rig.current;
    lookTarget.current.set(r.tx, r.ty, r.tz);
    // During "The move" the camera holds its wide shot but follows the airliner.
    const { chapter, journeyStop, travellingTo } = useExperience.getState();
    const tracking = chapter === "journey" && !travellingTo && isMoveStop(journeyStop) ? 1 : 0;
    planeFollow.current += (tracking - planeFollow.current) * Math.min(1, delta * 1.5);
    if (planeFollow.current > 0.001) lookTarget.current.lerp(runtime.planeWorld, planeFollow.current * 0.7);
    // Parallax slides the camera along its own right axis, so it works in every chamber.
    right.current
      .set(r.tx - r.px, 0, r.tz - r.pz)
      .cross(up.current)
      .normalize();
    camera.position.set(
      r.px + right.current.x * parallax.current.x,
      r.py + parallax.current.y,
      r.pz + right.current.z * parallax.current.x,
    );
    // While the Journey plays itself, each shot slowly pushes in.
    drift.current += (runtime.playDrift - drift.current) * Math.min(1, delta * 1.2);
    if (drift.current > 0.0001) camera.position.lerp(lookTarget.current, drift.current * 0.07);
    camera.lookAt(lookTarget.current);
    runtime.cameraTarget.copy(lookTarget.current);
  });

  return null;
}

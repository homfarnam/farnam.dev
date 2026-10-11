"use client";

import { lazy, Suspense, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Color, FogExp2 } from "three";
import { AdaptiveDpr, PerformanceMonitor } from "@react-three/drei";
import { chapters, type ChapterId } from "@/data/chapters";
import { Corridor } from "@/components/objects/Corridor";
import { AwakeningScene } from "@/components/scenes/AwakeningScene";
import { chamberCenter, bearingYaw } from "@/lib/world/layout";
import { palette } from "@/lib/world/palette";
import { runtime } from "@/lib/world/runtime";
import { useExperience } from "@/stores/experienceStore";
import { CameraController } from "./CameraController";
import { FreeLook } from "./FreeLook";
import { LabLights } from "./LabLights";
import { PostFX } from "./PostFX";

const StreetScene = lazy(() => import("@/components/street/StreetScene").then((module) => ({ default: module.StreetScene })));

/** Chamber scenes are code-split and only fetched when first visited. */
const chamberScenes: Partial<Record<ChapterId, React.LazyExoticComponent<() => React.JSX.Element>>> = {
  creator: lazy(() => import("@/components/scenes/CreatorScene").then((module) => ({ default: module.CreatorScene }))),
  journey: lazy(() => import("@/components/scenes/JourneyScene").then((module) => ({ default: module.JourneyScene }))),
};

/** Mounted inside the hub's Suspense boundary: when it commits, fonts and geometry are in. */
function ReadySignal() {
  const setSceneReady = useExperience((state) => state.setSceneReady);
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  useEffect(() => {
    // Compile shaders up front so the power-up doesn't stutter on first render.
    gl.compile(scene, camera);
    setSceneReady();
    // Dev-only handle for the headless harness (shader and memory counts).
    if (process.env.NODE_ENV === "development") Object.assign(window, { __gl: gl });
  }, [gl, scene, camera, setSceneReady]);
  return null;
}

/** The Journey is an open landscape: thin the fog there so Amsterdam stays visible from Tehran. */
const LAB_FOG = new Color(palette.void);
/** Matches the dusk sky's horizon so distant land melts into it. */
const DUSK_FOG = new Color("#121D36");
const TEHRAN_HAZE = new Color("#2A2329");

function FogController() {
  const scene = useThree((state) => state.scene);
  useFrame((_, delta) => {
    const { chapter, travellingTo, walking } = useExperience.getState();
    const journey = (travellingTo ?? chapter) === "journey";
    if (!(scene.fog instanceof FogExp2)) return;
    // Street walk is in metres: a light haze that swallows the far end of the canal.
    if (walking) {
      // Amsterdam: blue canal haze. Tehran: warm, dusty city haze.
      scene.fog.density = 0.0065;
      scene.fog.color.copy(useExperience.getState().walkStreet === "tajrish" ? TEHRAN_HAZE : DUSK_FOG);
      return;
    }
    const ease = Math.min(1, delta * 1.5);
    // The globe is seen from further away: clear the haze while it is up.
    const target = journey ? 0.0068 * (1 - 0.85 * runtime.globe) : 0.026;
    scene.fog.density += (target - scene.fog.density) * ease;
    scene.fog.color.lerp(journey ? DUSK_FOG : LAB_FOG, ease);
  });
  return null;
}

/**
 * Lowers quality if the frame rate stays poor — but only once the visitor is
 * exploring and loading has settled, so shader compiles at boot don't count as
 * a slow GPU (the downgrade turns off bloom and resizes the canvas: a visible
 * blink). It never switches back up, which would flicker.
 */
function QualityMonitor() {
  const phase = useExperience((state) => state.phase);
  const setQuality = useExperience((state) => state.setQuality);
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (phase !== "explore") return;
    const timer = window.setTimeout(() => setArmed(true), 3000);
    return () => window.clearTimeout(timer);
  }, [phase]);
  // Only a sustained slowdown counts (under ~28 fps for about 8 s): loading a chapter
  // (geometry uploads, shader compiles) stalls for a moment even on fast GPUs.
  return armed ? (
    <PerformanceMonitor onDecline={() => setQuality("low")} bounds={() => [28, 55]} ms={500} iterations={16} flipflops={2} />
  ) : null;
}

function isVisible(id: ChapterId, current: ChapterId, travellingTo: ChapterId | null) {
  return id === current || id === travellingTo || (travellingTo !== null && id === "awakening");
}

export function World() {
  const chapter = useExperience((state) => state.chapter);
  const travellingTo = useExperience((state) => state.travellingTo);
  const mounted = useExperience((state) => state.mounted);
  const walking = useExperience((state) => state.walking);

  return (
    <>
      <color attach="background" args={[palette.void]} />
      <fogExp2 attach="fog" args={[palette.void, 0.026]} />
      <FogController />
      <QualityMonitor />
      <AdaptiveDpr pixelated={false} />
      <CameraController />
      <FreeLook />
      <LabLights />

      {walking ? (
        <Suspense fallback={null}>
          <StreetScene />
        </Suspense>
      ) : null}

      {/* While walking the street, everything else stays mounted but hidden. */}
      <group visible={!walking}>
        <Suspense fallback={null}>
          <group visible={isVisible("awakening", chapter, travellingTo)}>
            <AwakeningScene />
          </group>
          <ReadySignal />
        </Suspense>

        {chapters
          .filter((candidate) => candidate.open && candidate.id !== "awakening")
          .map((candidate) => {
            const Scene = chamberScenes[candidate.id];
            const center = chamberCenter(candidate.id);
            const visible = isVisible(candidate.id, chapter, travellingTo);
            return (
              <group key={candidate.id}>
                <group visible={travellingTo !== null && visible}>
                  <Corridor chapter={candidate.id} />
                </group>
                {Scene && mounted.includes(candidate.id) ? (
                  <group position={[center.x, 0, center.z]} rotation={[0, bearingYaw(candidate.bearing), 0]} visible={visible}>
                    <Suspense fallback={null}>
                      <Scene />
                    </Suspense>
                  </group>
                ) : null}
              </group>
            );
          })}
      </group>

      <PostFX />
    </>
  );
}

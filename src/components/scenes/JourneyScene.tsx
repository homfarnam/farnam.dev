"use client";

import { Suspense, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import type { DirectionalLight, Group, Object3D } from "three";
import { journeyStops } from "@/data/journey";
import { Dust } from "@/components/objects/Dust";
import { Airliner } from "@/components/objects/journey/Airliner";
import { Airport } from "@/components/objects/journey/Airport";
import { CityDiorama } from "@/components/objects/journey/CityDiorama";
import { DuskSky } from "@/components/objects/journey/DuskSky";
import { Globe } from "@/components/objects/journey/Globe";
import { RemoteLinks } from "@/components/objects/journey/RemoteLink";
import { RouteLine } from "@/components/objects/journey/RouteLine";
import { StopBeacon } from "@/components/objects/journey/StopBeacon";
import { TehranLandmarks } from "@/components/objects/journey/TehranLandmarks";
import { WorldMap } from "@/components/objects/journey/WorldMap";
import { AMSTERDAM_CENTER, TEHRAN_CENTER } from "@/lib/world/journey";
import { palette } from "@/lib/world/palette";
import { runtime } from "@/lib/world/runtime";
import { useExperience } from "@/stores/experienceStore";

/**
 * Moonlight with a shadow camera fitted to whichever diorama the story is in,
 * so shadows stay sharp without a huge shadow map.
 */
function Moonlight() {
  const light = useRef<DirectionalLight>(null);
  const target = useRef<Object3D>(null);
  const quality = useExperience((state) => state.quality);

  useFrame(() => {
    const sun = light.current;
    const aim = target.current;
    if (!sun || !aim) return;
    const after = runtime.journeyProgress > 0.5;
    const center = after ? AMSTERDAM_CENTER : TEHRAN_CENTER;
    aim.position.set(center.x, 0, center.z);
    sun.position.set(center.x - 9, 16, center.z + 12);
    sun.target = aim;
    sun.intensity = 2.4 * runtime.power;
  });

  return (
    <>
      <object3D ref={target} />
      <directionalLight
        ref={light}
        color="#BFD4FF"
        castShadow={quality === "high"}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-camera-near={1}
        shadow-camera-far={45}
      />
    </>
  );
}

/**
 * Everything that stands on the flat map. While the globe is up it is hidden;
 * as the globe finishes unrolling it rises out of the map.
 */
function OnTheMap({ children, rise = true }: { children: ReactNode; rise?: boolean }) {
  const group = useRef<Group>(null);
  useFrame(() => {
    const g = group.current;
    if (!g) return;
    if (!rise) {
      g.visible = runtime.globe <= 0.0005;
      return;
    }
    const x = Math.min(1, runtime.globe / 0.12);
    const height = 1 - x * x * (3 - 2 * x);
    g.scale.y = Math.max(height, 0.0001);
    g.visible = height > 0.002;
  });
  return <group ref={group}>{children}</group>;
}

/** Chapter 02 — Tehran to Amsterdam on a real map, with real-city dioramas. */
export function JourneyScene() {
  return (
    <group>
      {/* Procedural reflections only — no HDRI file is downloaded. */}
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={1.2} color="#9EB8FF" position={[0, 6, -6]} scale={[12, 2, 1]} />
        <Lightformer
          form="rect"
          intensity={0.8}
          color={palette.ember}
          position={[-8, 2, 6]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[8, 2, 1]}
        />
        <Lightformer form="ring" intensity={0.6} color={palette.cyan} position={[6, 4, 4]} scale={3} />
      </Environment>

      <Moonlight />
      <hemisphereLight args={["#5068A8", "#141A28", 1.15]} />
      <DuskSky center={[(TEHRAN_CENTER.x + AMSTERDAM_CENTER.x) / 2, 0, (TEHRAN_CENTER.z + AMSTERDAM_CENTER.z) / 2]} />

      <Suspense fallback={null}>
        <Globe />
      </Suspense>
      <OnTheMap rise={false}>
        <Suspense fallback={null}>
          <WorldMap />
        </Suspense>
      </OnTheMap>
      <OnTheMap>
        <Suspense fallback={null}>
          <CityDiorama
            id="tehran"
            center={TEHRAN_CENTER}
            label="TEHRAN · TAJRISH"
            title="Tehran"
            subtitle="2014 – 2022"
            windows="#FFB46B"
            streets="#F59E42"
            buildings="osm"
          />
          <TehranLandmarks />
        </Suspense>
        <Suspense fallback={null}>
          <CityDiorama
            id="amsterdam"
            center={AMSTERDAM_CENTER}
            label="AMSTERDAM · DAM & CANAL RING"
            title="Amsterdam"
            subtitle="2022 – today"
            windows="#FFD9A0"
            streets="#FFE7B8"
            buildings="3dbag"
          />
        </Suspense>

        <Airport id="ika" cityName="Tajrish" />
        <Airport id="ams" cityName="Dam Square" />
        <RouteLine />
        <RemoteLinks />
        <Airliner />
        {journeyStops.map((stop, index) => (
          <StopBeacon key={stop.id} stop={stop} index={index} />
        ))}
      </OnTheMap>

      <Dust count={1800} radius={60} height={30} position={[0, 4, -30]} color={palette.ink} size={1.1} />
    </group>
  );
}

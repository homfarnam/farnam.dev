"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Text } from "@react-three/drei";
import type { Group, Mesh, MeshStandardMaterial } from "three";
import { journeyKindColor, type JourneyStop } from "@/data/journey";
import { useHologramMaterial } from "@/hooks/useHologramMaterial";
import { useHoverable } from "@/hooks/useHoverable";
import { useInteractive } from "@/hooks/useInteractive";
import { sounds } from "@/lib/audio/engine";
import { FONT_DISPLAY, FONT_MONO } from "@/lib/world/fonts";
import { stopPoint, stopProgress } from "@/lib/world/journey";
import { palette } from "@/lib/world/palette";
import { runtime } from "@/lib/world/runtime";
import { useExperience } from "@/stores/experienceStore";

type TroikaText = Mesh & { fillOpacity: number };

/** One moment on the route: a ground ring, a light beam and a floating year. */
export function StopBeacon({ stop, index }: { stop: JourneyStop; index: number }) {
  const interactive = useInteractive("journey");
  const active = useExperience((state) => state.journeyStop === index);
  const focusJourneyStop = useExperience((state) => state.focusJourneyStop);
  const { hovered, hoverRef, bind } = useHoverable(interactive && !active);
  const color = journeyKindColor[stop.kind];
  const beamMaterial = useHologramMaterial(color, 0.35, hoverRef);

  const label = useRef<Group>(null);
  const year = useRef<TroikaText>(null);
  const title = useRef<TroikaText>(null);
  const ring = useRef<MeshStandardMaterial>(null);
  const point = stopPoint(index);
  const inAir = point.y > 1;
  const progress = stopProgress[index] ?? 0;

  useFrame((state, delta) => {
    // A beacon is "reached" once the lit route has passed it.
    const reached = runtime.journeyProgress >= progress - 0.005 ? 1 : 0.25;
    const emphasis = active ? 1 : hovered ? 0.8 : 0.45;
    const ease = Math.min(1, delta * 5);
    if (year.current) year.current.fillOpacity += (reached * emphasis * runtime.power - year.current.fillOpacity) * ease;
    if (title.current)
      title.current.fillOpacity += ((active || hovered ? 1 : 0) * runtime.power - title.current.fillOpacity) * ease;
    if (ring.current)
      ring.current.emissiveIntensity =
        runtime.power * reached * (active ? 3.5 : 1.6 + Math.sin(state.clock.elapsedTime * 2 + index) * 0.3);
    if (label.current) {
      const scale = active ? 1.12 : hovered ? 1.06 : 0.85;
      label.current.scale.setScalar(label.current.scale.x + (scale - label.current.scale.x) * ease);
    }
  });

  return (
    <group position={point}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, inAir ? 0 : 0.02, 0]}>
        <ringGeometry args={[0.32, 0.42, 40]} />
        <meshStandardMaterial ref={ring} color="#000000" emissive={color} emissiveIntensity={0} toneMapped={false} side={2} />
      </mesh>
      {!inAir ? (
        <mesh position={[0, 1.6, 0]} material={beamMaterial}>
          <cylinderGeometry args={[0.12, 0.36, 3.2, 20, 1, true]} />
        </mesh>
      ) : null}

      <Billboard ref={label} position={[0, inAir ? 1.1 : 3.6, 0]}>
        <Text ref={year} font={FONT_MONO} fontSize={0.42} anchorX="center" anchorY="bottom" color={color} fillOpacity={0}>
          {stop.year}
        </Text>
        <Text
          ref={title}
          font={FONT_DISPLAY}
          position={[0, -0.12, 0]}
          fontSize={0.3}
          anchorX="center"
          anchorY="top"
          color={palette.ink}
          fillOpacity={0}
          maxWidth={4}
          textAlign="center"
        >
          {stop.title}
        </Text>
      </Billboard>

      {/* Generous hit area around beam and label */}
      <mesh
        position={[0, inAir ? 0.5 : 1.8, 0]}
        visible={false}
        {...bind}
        onClick={(event) => {
          if (!interactive) return;
          event.stopPropagation();
          sounds.select();
          focusJourneyStop(index);
        }}
      >
        <cylinderGeometry args={[0.9, 0.9, inAir ? 2.2 : 4.6, 10]} />
      </mesh>
    </group>
  );
}

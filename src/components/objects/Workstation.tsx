"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, Text } from "@react-three/drei";
import type { Mesh, MeshStandardMaterial } from "three";
import { useHoverable } from "@/hooks/useHoverable";
import { useInteractive } from "@/hooks/useInteractive";
import { sounds } from "@/lib/audio/engine";
import { createScrollingCode } from "@/lib/world/codeTexture";
import { FONT_MONO } from "@/lib/world/fonts";
import { palette } from "@/lib/world/palette";
import { runtime } from "@/lib/world/runtime";
import { useExperience } from "@/stores/experienceStore";

type TroikaText = Mesh & { fillOpacity: number };

type Triple = [number, number, number];
const MONITORS: { position: Triple; rotation: Triple }[] = [
  { position: [-1.05, 1.72, -0.25], rotation: [0, 0.38, 0] },
  { position: [0, 1.8, -0.42], rotation: [0, 0, 0] },
  { position: [1.05, 1.72, -0.25], rotation: [0, -0.38, 0] },
];

/** Farnam's desk. Its monitors scroll real data; clicking opens the console. */
export function Workstation(props: { position: [number, number, number]; rotationY: number }) {
  const interactive = useInteractive("awakening");
  const openPanel = useExperience((state) => state.openPanel);
  const { hovered, bind } = useHoverable(interactive);
  const code = useMemo(() => createScrollingCode(), []);
  const keyboard = useRef<MeshStandardMaterial>(null);
  const hint = useRef<TroikaText>(null);

  useEffect(() => () => code.texture.dispose(), [code]);

  useFrame((state, delta) => {
    code.update(state.clock.elapsedTime, Math.min(1, runtime.power * 1.2));
    if (keyboard.current) keyboard.current.emissiveIntensity = runtime.power * (hovered ? 2.4 : 0.9);
    if (hint.current) hint.current.fillOpacity += ((hovered ? 1 : 0) - hint.current.fillOpacity) * Math.min(1, delta * 6);
  });

  return (
    <group position={props.position} rotation={[0, props.rotationY, 0]}>
      <group
        {...bind}
        onClick={(event) => {
          if (!interactive) return;
          event.stopPropagation();
          sounds.select();
          openPanel("terminal");
        }}
      >
        {/* Desk */}
        <RoundedBox args={[3.4, 0.1, 1.3]} radius={0.04} position={[0, 0.95, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={palette.metal} metalness={0.75} roughness={0.35} />
        </RoundedBox>
        {[-1.5, 1.5].map((x) => (
          <mesh key={x} position={[x, 0.47, 0]} castShadow>
            <boxGeometry args={[0.08, 0.94, 1.1]} />
            <meshStandardMaterial color={palette.navy} metalness={0.6} roughness={0.5} />
          </mesh>
        ))}

        {/* Monitors */}
        {MONITORS.map((monitor, index) => (
          <group key={index} position={monitor.position} rotation={monitor.rotation}>
            <RoundedBox args={[1.02, 0.66, 0.05]} radius={0.02} castShadow>
              <meshStandardMaterial color="#0B111C" metalness={0.5} roughness={0.4} />
            </RoundedBox>
            <mesh position={[0, 0, 0.03]}>
              <planeGeometry args={[0.94, 0.58]} />
              <meshBasicMaterial map={code.texture} toneMapped={false} />
            </mesh>
            <mesh position={[0, -0.5, -0.02]}>
              <cylinderGeometry args={[0.02, 0.02, 0.38, 8]} />
              <meshStandardMaterial color={palette.metal} metalness={0.8} roughness={0.3} />
            </mesh>
          </group>
        ))}

        {/* Keyboard: a glowing input slab */}
        <mesh position={[0, 1.02, 0.28]} rotation={[-Math.PI / 2 + 0.06, 0, 0]}>
          <planeGeometry args={[1.1, 0.34]} />
          <meshStandardMaterial
            ref={keyboard}
            color="#000000"
            emissive={palette.cyan}
            emissiveIntensity={0}
            toneMapped={false}
            transparent
            opacity={0.85}
          />
        </mesh>
      </group>

      <Text
        ref={hint}
        font={FONT_MONO}
        position={[0, 2.55, 0]}
        fontSize={0.14}
        anchorX="center"
        color={palette.cyan}
        fillOpacity={0}
      >
        Open console
      </Text>
    </group>
  );
}

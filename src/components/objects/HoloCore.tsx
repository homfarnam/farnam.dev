"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import {
  EdgesGeometry,
  IcosahedronGeometry,
  LatheGeometry,
  Vector2,
  type Group,
  type Mesh,
  type MeshStandardMaterial,
} from "three";
import { profile } from "@/data/profile";
import { useHologramMaterial } from "@/hooks/useHologramMaterial";
import { useHoverable } from "@/hooks/useHoverable";
import { useInteractive } from "@/hooks/useInteractive";
import { sounds } from "@/lib/audio/engine";
import { FONT_DISPLAY, FONT_MONO } from "@/lib/world/fonts";
import { palette } from "@/lib/world/palette";
import { runtime } from "@/lib/world/runtime";
import { useExperience } from "@/stores/experienceStore";

type TroikaText = Mesh & { fillOpacity: number; outlineOpacity: number };

/** Stepped machined pedestal profile, revolved around Y. */
function createPedestalGeometry() {
  const profilePoints = [
    [0, 0],
    [1.9, 0],
    [1.9, 0.12],
    [1.6, 0.18],
    [1.55, 0.42],
    [1.25, 0.5],
    [1.2, 0.86],
    [1.32, 0.92],
    [1.32, 1.0],
    [0, 1.0],
  ].map(([x, y]) => new Vector2(x, y));
  return new LatheGeometry(profilePoints, 64);
}

/**
 * The lab's central display: a projector pedestal with a slowly turning
 * gyroscope of rings. Clicking it opens the visitor dossier.
 */
export function HoloCore() {
  const interactive = useInteractive("awakening");
  const openPanel = useExperience((state) => state.openPanel);
  const { hovered, hoverRef, bind } = useHoverable(interactive);

  const gyro = useRef<Group>(null);
  const ringA = useRef<Mesh>(null);
  const ringB = useRef<Mesh>(null);
  const ringC = useRef<Mesh>(null);
  const core = useRef<Mesh>(null);
  const emissiveRing = useRef<MeshStandardMaterial>(null);
  const title = useRef<TroikaText>(null);
  const subtitle = useRef<TroikaText>(null);
  const hint = useRef<TroikaText>(null);
  const spin = useRef(1);

  const pedestal = useMemo(createPedestalGeometry, []);
  const coreEdges = useMemo(() => new EdgesGeometry(new IcosahedronGeometry(0.62, 1)), []);
  const ringMaterial = useHologramMaterial(palette.cyan, 1, hoverRef);
  const coneMaterial = useHologramMaterial(palette.signal, 0.1);
  const coreMaterial = useHologramMaterial(palette.cyan, 0.7, hoverRef);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    spin.current += ((hovered ? 3 : 1) - spin.current) * Math.min(1, delta * 3);
    const step = delta * spin.current;
    if (ringA.current) ringA.current.rotation.x += step * 0.35;
    if (ringB.current) ringB.current.rotation.y += step * 0.5;
    if (ringC.current) ringC.current.rotation.z -= step * 0.28;
    if (core.current) {
      core.current.rotation.y += step * 0.6;
      core.current.rotation.x = Math.sin(time * 0.4) * 0.3;
    }
    if (gyro.current) gyro.current.position.y = 3.35 + Math.sin(time * 0.9) * 0.08;
    if (emissiveRing.current) emissiveRing.current.emissiveIntensity = runtime.power * (2.2 + Math.sin(time * 2) * 0.4);

    const reveal = Math.max(0, (runtime.power - 0.5) * 2);
    if (title.current) title.current.fillOpacity = reveal;
    if (subtitle.current) subtitle.current.fillOpacity = reveal * 0.8;
    if (hint.current) hint.current.fillOpacity += ((hovered ? 1 : 0) - hint.current.fillOpacity) * Math.min(1, delta * 6);
  });

  return (
    <group>
      <mesh geometry={pedestal} castShadow receiveShadow>
        <meshStandardMaterial color={palette.metal} metalness={0.85} roughness={0.38} />
      </mesh>
      <mesh position={[0, 1.0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.0, 1.18, 64]} />
        <meshStandardMaterial
          ref={emissiveRing}
          color="#000000"
          emissive={palette.cyan}
          emissiveIntensity={0}
          toneMapped={false}
        />
      </mesh>

      {/* Projection beam */}
      <mesh position={[0, 2.6, 0]} material={coneMaterial}>
        <cylinderGeometry args={[2.3, 1.0, 3.2, 48, 1, true]} />
      </mesh>

      <group ref={gyro} position={[0, 3.35, 0]}>
        <mesh ref={ringA} material={ringMaterial}>
          <torusGeometry args={[1.55, 0.012, 8, 128]} />
        </mesh>
        <mesh ref={ringB} material={ringMaterial} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.3, 0.018, 8, 128]} />
        </mesh>
        <mesh ref={ringC} material={ringMaterial} rotation={[0.6, 0.4, 0]}>
          <torusGeometry args={[1.05, 0.01, 8, 128]} />
        </mesh>
        <mesh ref={core} material={coreMaterial}>
          <icosahedronGeometry args={[0.6, 1]} />
          <lineSegments geometry={coreEdges}>
            <lineBasicMaterial color={palette.cyan} transparent opacity={0.55} toneMapped={false} />
          </lineSegments>
        </mesh>

        {/* Generous invisible hit area so the core is easy to click on touch screens. */}
        <mesh
          visible={false}
          {...bind}
          onClick={(event) => {
            if (!interactive) return;
            event.stopPropagation();
            sounds.select();
            openPanel("dossier");
          }}
        >
          <sphereGeometry args={[1.9, 16, 16]} />
        </mesh>
      </group>

      <Text
        ref={title}
        font={FONT_DISPLAY}
        position={[0, 6.35, 0]}
        fontSize={1.05}
        letterSpacing={0.32}
        anchorX="center"
        anchorY="middle"
        color={palette.ink}
        fillOpacity={0}
      >
        {profile.name.toUpperCase()}
      </Text>
      <Text
        ref={subtitle}
        font={FONT_MONO}
        position={[0, 5.72, 0]}
        fontSize={0.17}
        letterSpacing={0.08}
        anchorX="center"
        color={palette.mute}
        fillOpacity={0}
      >
        {`${profile.fullTitle} — ${profile.location}`}
      </Text>
      <Text
        ref={hint}
        font={FONT_MONO}
        position={[0, 1.55, 1.9]}
        fontSize={0.16}
        anchorX="center"
        color={palette.cyan}
        fillOpacity={0}
      >
        Open dossier
      </Text>
    </group>
  );
}

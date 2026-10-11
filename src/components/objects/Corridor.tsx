"use client";

import { useLayoutEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Object3D, type InstancedMesh, type MeshStandardMaterial } from "three";
import { getChapter, type ChapterId } from "@/data/chapters";
import { bearingDirection, bearingYaw, CHAMBER_DISTANCE, CHAMBER_ENTRANCE, DOOR_RADIUS } from "@/lib/world/layout";
import { palette } from "@/lib/world/palette";
import { runtime } from "@/lib/world/runtime";

const SPACING = 2.2;

/** Ring tunnel between a hub door and its chamber. Rings flare during travel. */
export function Corridor({ chapter }: { chapter: ChapterId }) {
  const { bearing, color } = getChapter(chapter);
  const start = DOOR_RADIUS + 1;
  const end = CHAMBER_DISTANCE - CHAMBER_ENTRANCE - 1;
  const count = Math.floor((end - start) / SPACING);
  const rings = useRef<InstancedMesh>(null);
  const material = useRef<MeshStandardMaterial>(null);

  useLayoutEffect(() => {
    const dummy = new Object3D();
    const direction = bearingDirection(bearing);
    for (let index = 0; index < count; index += 1) {
      const distance = start + index * SPACING;
      dummy.position.set(direction.x * distance, 2.6, direction.z * distance);
      dummy.rotation.set(0, bearingYaw(bearing), 0);
      dummy.updateMatrix();
      rings.current?.setMatrixAt(index, dummy.matrix);
    }
    if (rings.current) rings.current.instanceMatrix.needsUpdate = true;
  }, [bearing, count, start]);

  useFrame(() => {
    if (material.current) material.current.emissiveIntensity = runtime.power * (0.5 + runtime.warp * 5);
  });

  const direction = bearingDirection(bearing);
  const mid = (start + end) / 2;

  return (
    <group>
      <instancedMesh ref={rings} args={[undefined, undefined, count]}>
        <torusGeometry args={[2.9, 0.035, 6, 6]} />
        <meshStandardMaterial ref={material} color="#000000" emissive={color} emissiveIntensity={0} toneMapped={false} />
      </instancedMesh>
      <mesh position={[direction.x * mid, 0.02, direction.z * mid]} rotation={[-Math.PI / 2, 0, bearingYaw(bearing)]}>
        <planeGeometry args={[2.4, end - start]} />
        <meshStandardMaterial color={palette.navy} metalness={0.7} roughness={0.35} />
      </mesh>
    </group>
  );
}

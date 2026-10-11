"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BufferAttribute,
  BufferGeometry,
  EdgesGeometry,
  Line,
  LineBasicMaterial,
  Object3D,
  PlaneGeometry,
  type InstancedMesh,
  type Mesh,
  type MeshStandardMaterial,
} from "three";
import type { ArtifactVisualProps } from "@/components/objects/ProjectArtifact";
import { palette } from "@/lib/world/palette";
import { runtime } from "@/lib/world/runtime";

const BARS = 9;
const LINE_POINTS = 48;

type Triple = [number, number, number];
const PANELS: { position: Triple; rotationY: number }[] = [
  { position: [-0.52, 0.05, 0.12], rotationY: 0.5 },
  { position: [0, 0.1, 0], rotationY: 0 },
  { position: [0.52, 0.05, 0.12], rotationY: -0.5 },
];

/** Fullstack apps: three floating admin panels with live bars, a trace line and a gauge. */
export function ControlRoomArtifact({ focused, accent }: ArtifactVisualProps) {
  const bars = useRef<InstancedMesh>(null);
  const gauge = useRef<Mesh>(null);
  const glow = useRef<MeshStandardMaterial>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const lineGeometry = useMemo(
    () => new BufferGeometry().setAttribute("position", new BufferAttribute(new Float32Array(LINE_POINTS * 3), 3)),
    [],
  );
  const trace = useMemo(
    () => new Line(lineGeometry, new LineBasicMaterial({ color: palette.cyan, toneMapped: false })),
    [lineGeometry],
  );
  const frameEdges = useMemo(() => new EdgesGeometry(new PlaneGeometry(0.46, 0.4)), []);

  useLayoutEffect(() => {
    if (bars.current) bars.current.count = BARS;
  }, []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const speed = focused ? 2.2 : 1;
    if (bars.current) {
      for (let index = 0; index < BARS; index += 1) {
        const height = 0.08 + (Math.sin(time * speed + index * 0.9) * 0.5 + 0.5) * 0.26 * runtime.power;
        dummy.position.set(-0.17 + index * 0.042, -0.15 + height / 2, 0.012);
        dummy.scale.set(1, height, 1);
        dummy.updateMatrix();
        bars.current.setMatrixAt(index, dummy.matrix);
      }
      bars.current.instanceMatrix.needsUpdate = true;
    }
    const positions = lineGeometry.getAttribute("position") as BufferAttribute;
    for (let index = 0; index < LINE_POINTS; index += 1) {
      const t = index / (LINE_POINTS - 1);
      const y = Math.sin(t * 9 + time * speed) * 0.06 + Math.sin(t * 23 - time * 1.7) * 0.025;
      positions.setXYZ(index, -0.19 + t * 0.38, y * runtime.power, 0.012);
    }
    positions.needsUpdate = true;
    if (gauge.current) gauge.current.rotation.z = -time * speed * 0.6;
    if (glow.current) glow.current.emissiveIntensity = runtime.power * 2;
  });

  return (
    <group>
      {PANELS.map((panel, index) => (
        <group key={index} position={panel.position} rotation={[0, panel.rotationY, 0]}>
          <mesh>
            <planeGeometry args={[0.46, 0.4]} />
            <meshStandardMaterial color="#0B1322" metalness={0.3} roughness={0.5} transparent opacity={0.92} />
          </mesh>
          <lineSegments geometry={frameEdges}>
            <lineBasicMaterial color={palette.signal} transparent opacity={0.6} toneMapped={false} />
          </lineSegments>
          <mesh position={[0, 0.17, 0.006]}>
            <planeGeometry args={[0.4, 0.012]} />
            <meshStandardMaterial
              ref={index === 1 ? glow : undefined}
              color="#000000"
              emissive={accent}
              emissiveIntensity={2}
              toneMapped={false}
            />
          </mesh>
          {index === 0 ? <primitive object={trace} /> : null}
          {index === 1 ? (
            <instancedMesh ref={bars} args={[undefined, undefined, BARS]}>
              <boxGeometry args={[0.028, 1, 0.01]} />
              <meshStandardMaterial color="#000000" emissive={palette.cyan} emissiveIntensity={1.6} toneMapped={false} />
            </instancedMesh>
          ) : null}
          {index === 2 ? (
            <group position={[0, -0.02, 0.012]}>
              <mesh>
                <ringGeometry args={[0.1, 0.12, 48]} />
                <meshBasicMaterial color={palette.navy} />
              </mesh>
              <mesh ref={gauge}>
                <ringGeometry args={[0.1, 0.12, 48, 1, 0, Math.PI * 1.3]} />
                <meshStandardMaterial color="#000000" emissive={palette.ember} emissiveIntensity={1.8} toneMapped={false} />
              </mesh>
            </group>
          ) : null}
        </group>
      ))}
    </group>
  );
}

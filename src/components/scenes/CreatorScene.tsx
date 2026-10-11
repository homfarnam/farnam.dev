"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { Object3D, type InstancedMesh, type Mesh, type MeshStandardMaterial } from "three";
import { projects, type ProjectId } from "@/data/projects";
import { ArchiveArtifact } from "@/components/objects/artifacts/ArchiveArtifact";
import { ControlRoomArtifact } from "@/components/objects/artifacts/ControlRoomArtifact";
import { MessengerArtifact } from "@/components/objects/artifacts/MessengerArtifact";
import { RadarArtifact } from "@/components/objects/artifacts/RadarArtifact";
import { TheaterArtifact } from "@/components/objects/artifacts/TheaterArtifact";
import { Dust } from "@/components/objects/Dust";
import { ProjectArtifact, type ArtifactVisualProps } from "@/components/objects/ProjectArtifact";
import { createGridFloorMaterial } from "@/lib/shaders/materials";
import { FONT_DISPLAY, FONT_MONO } from "@/lib/world/fonts";
import { CHAMBER_ENTRANCE } from "@/lib/world/layout";
import { palette } from "@/lib/world/palette";
import { runtime } from "@/lib/world/runtime";
import { artifactPlacements } from "@/lib/world/vault";

const VISUALS: Record<ProjectId, (props: ArtifactVisualProps) => React.JSX.Element> = {
  streaming: TheaterArtifact,
  "telegram-audio": MessengerArtifact,
  "ind-monitor": RadarArtifact,
  "pdf-bot": ArchiveArtifact,
  fullstack: ControlRoomArtifact,
};

const ROOM_RADIUS = 17;
const PILLARS = 22;

type TroikaText = Mesh & { fillOpacity: number };

/** Chapter 03 — the Project Vault. */
export function CreatorScene() {
  const floorMaterial = useMemo(() => createGridFloorMaterial(palette.signal, ROOM_RADIUS), []);
  const pillars = useRef<InstancedMesh>(null);
  const seams = useRef<InstancedMesh>(null);
  const seamMaterial = useRef<MeshStandardMaterial>(null);
  const gateMaterial = useRef<MeshStandardMaterial>(null);
  const heading = useRef<TroikaText>(null);

  useEffect(() => () => floorMaterial.dispose(), [floorMaterial]);

  useLayoutEffect(() => {
    const dummy = new Object3D();
    let placed = 0;
    for (let index = 0; index < PILLARS; index += 1) {
      const angle = (index / PILLARS) * Math.PI * 2;
      // Leave the entrance side (+Z) open.
      if (Math.abs(Math.atan2(Math.sin(angle), Math.cos(angle))) < 0.45) continue;
      dummy.position.set(Math.sin(angle) * ROOM_RADIUS, 6, Math.cos(angle) * ROOM_RADIUS);
      dummy.rotation.set(0, angle, 0);
      dummy.updateMatrix();
      pillars.current?.setMatrixAt(placed, dummy.matrix);
      dummy.position.set(Math.sin(angle) * (ROOM_RADIUS - 0.42), 6, Math.cos(angle) * (ROOM_RADIUS - 0.42));
      dummy.updateMatrix();
      seams.current?.setMatrixAt(placed, dummy.matrix);
      placed += 1;
    }
    if (pillars.current) {
      pillars.current.count = placed;
      pillars.current.instanceMatrix.needsUpdate = true;
    }
    if (seams.current) {
      seams.current.count = placed;
      seams.current.instanceMatrix.needsUpdate = true;
    }
  }, []);

  useFrame((state, delta) => {
    floorMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    floorMaterial.uniforms.uPower.value = runtime.power;
    if (seamMaterial.current)
      seamMaterial.current.emissiveIntensity = runtime.power * (0.9 + Math.sin(state.clock.elapsedTime * 0.7) * 0.2);
    if (gateMaterial.current) gateMaterial.current.emissiveIntensity = runtime.power * (1.2 + runtime.warp * 4);
    if (heading.current)
      heading.current.fillOpacity += (runtime.power * 0.9 - heading.current.fillOpacity) * Math.min(1, delta * 2);
  });

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={floorMaterial}>
        <circleGeometry args={[ROOM_RADIUS + 1, 96]} />
      </mesh>

      <instancedMesh ref={pillars} args={[undefined, undefined, PILLARS]}>
        <boxGeometry args={[0.9, 12, 0.7]} />
        <meshStandardMaterial color={palette.metal} metalness={0.75} roughness={0.45} />
      </instancedMesh>
      <instancedMesh ref={seams} args={[undefined, undefined, PILLARS]}>
        <boxGeometry args={[0.035, 10, 0.02]} />
        <meshStandardMaterial
          ref={seamMaterial}
          color="#000000"
          emissive={palette.signal}
          emissiveIntensity={0}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Entrance gate */}
      <mesh position={[0, 2.6, CHAMBER_ENTRANCE]}>
        <torusGeometry args={[3.1, 0.08, 8, 6]} />
        <meshStandardMaterial
          ref={gateMaterial}
          color="#000000"
          emissive={palette.cyan}
          emissiveIntensity={0}
          toneMapped={false}
        />
      </mesh>

      <Text
        ref={heading}
        font={FONT_DISPLAY}
        position={[0, 7.4, -7]}
        fontSize={0.9}
        letterSpacing={0.04}
        anchorX="center"
        color={palette.ink}
        fillOpacity={0}
      >
        The Project Vault
      </Text>
      <Text font={FONT_MONO} position={[0, 6.6, -7]} fontSize={0.2} anchorX="center" color={palette.mute}>
        Select an artifact · drag to turn it
      </Text>

      {artifactPlacements.map((placement) => {
        const project = projects.find((candidate) => candidate.id === placement.id);
        if (!project) return null;
        return <ProjectArtifact key={project.id} project={project} placement={placement} Visual={VISUALS[project.id]} />;
      })}

      <pointLight position={[0, 6, 0]} color={palette.signal} intensity={40} distance={24} decay={1.6} />
      <pointLight position={[0, 3, 8]} color={palette.cyan} intensity={14} distance={14} decay={1.8} />
      <Dust count={700} radius={ROOM_RADIUS - 2} height={9} color={palette.signal} />
    </group>
  );
}

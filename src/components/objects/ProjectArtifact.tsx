"use client";

import { useMemo, useRef, type RefObject } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { LatheGeometry, Vector2, type Group, type Mesh, type MeshStandardMaterial } from "three";
import type { Project } from "@/data/projects";
import { useHologramMaterial } from "@/hooks/useHologramMaterial";
import { useHoverable } from "@/hooks/useHoverable";
import { useInteractive } from "@/hooks/useInteractive";
import { sounds } from "@/lib/audio/engine";
import { FONT_DISPLAY, FONT_MONO } from "@/lib/world/fonts";
import { palette } from "@/lib/world/palette";
import { runtime } from "@/lib/world/runtime";
import type { ArtifactPlacement } from "@/lib/world/vault";
import { useExperience } from "@/stores/experienceStore";

type TroikaText = Mesh & { fillOpacity: number };

/** Artifacts are modelled at roughly unit size and displayed larger. */
const ARTIFACT_SCALE = 1.45;

export interface ArtifactVisualProps {
  focused: boolean;
  hoverRef: RefObject<number>;
  accent: string;
}

interface ProjectArtifactProps {
  project: Project;
  placement: ArtifactPlacement;
  Visual: (props: ArtifactVisualProps) => React.JSX.Element;
}

function createPlinthGeometry() {
  const points = [
    [0, 0],
    [0.95, 0],
    [0.95, 0.08],
    [0.78, 0.14],
    [0.62, 0.9],
    [0.7, 0.96],
    [0.7, 1.02],
    [0, 1.02],
  ].map(([x, y]) => new Vector2(x, y));
  return new LatheGeometry(points, 48);
}

/**
 * Shared behaviour for every vault artifact: plinth, light shaft, label,
 * hover/focus, idle float, and drag-to-rotate (with inertia) once focused.
 */
export function ProjectArtifact({ project, placement, Visual }: ProjectArtifactProps) {
  const interactive = useInteractive("creator");
  const focusedProject = useExperience((state) => state.focusedProject);
  const focusProject = useExperience((state) => state.focusProject);
  const focused = focusedProject === project.id;
  const dimmed = focusedProject !== null && !focused;
  const { hovered, hoverRef, bind } = useHoverable(interactive && !focused);

  const spinner = useRef<Group>(null);
  const floater = useRef<Group>(null);
  const label = useRef<TroikaText>(null);
  const sublabel = useRef<TroikaText>(null);
  const ring = useRef<MeshStandardMaterial>(null);
  const drag = useRef({ active: false, lastX: 0, lastY: 0, velocityY: 0, velocityX: 0 });

  const plinth = useMemo(createPlinthGeometry, []);
  const shaftMaterial = useHologramMaterial(project.accent, 0.05, hoverRef);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    const spin = spinner.current;
    if (spin) {
      const state = drag.current;
      if (!state.active) {
        if (focused) {
          // Released after a drag: keep spinning on inertia, decaying smoothly.
          spin.rotation.y += state.velocityY;
          spin.rotation.x += state.velocityX;
          state.velocityY *= 0.94;
          state.velocityX *= 0.94;
        } else {
          // Idle: sway around facing the visitor, so the artifact always reads from the front.
          const ease = Math.min(1, delta * 2);
          const facing = Math.round(spin.rotation.y / (Math.PI * 2)) * Math.PI * 2;
          const sway = Math.sin(time * 0.45 + placement.position[0]) * (hovered ? 0.6 : 0.35);
          spin.rotation.y += (facing + sway - spin.rotation.y) * ease;
          spin.rotation.x += (0 - spin.rotation.x) * ease;
        }
      }
    }
    if (floater.current) {
      // While another artifact is examined, this one bows out: smaller and lower.
      const baseY = placement.position[1] + (dimmed ? -0.55 : focused ? 0.1 : 0);
      floater.current.position.y +=
        (baseY + Math.sin(time * 0.8 + placement.position[0]) * 0.07 - floater.current.position.y) * Math.min(1, delta * 4);
      const targetScale = ARTIFACT_SCALE * (dimmed ? 0.5 : focused ? 1.1 : hovered ? 1.06 : 1);
      floater.current.scale.setScalar(floater.current.scale.x + (targetScale - floater.current.scale.x) * Math.min(1, delta * 6));
    }
    const visibility = runtime.power * (dimmed ? 0.25 : 1);
    if (label.current) label.current.fillOpacity += (visibility - label.current.fillOpacity) * Math.min(1, delta * 5);
    if (sublabel.current)
      sublabel.current.fillOpacity += (visibility * 0.7 - sublabel.current.fillOpacity) * Math.min(1, delta * 5);
    if (ring.current) ring.current.emissiveIntensity = runtime.power * (focused ? 3 : hovered ? 2.4 : 1.2);
  });

  function onPointerDown(event: ThreeEvent<PointerEvent>) {
    if (!focused) return;
    event.stopPropagation();
    (event.target as Element).setPointerCapture?.(event.pointerId);
    drag.current = { active: true, lastX: event.clientX, lastY: event.clientY, velocityX: 0, velocityY: 0 };
    document.body.style.cursor = "grabbing";
  }

  function onPointerMove(event: ThreeEvent<PointerEvent>) {
    const state = drag.current;
    if (!state.active || !spinner.current) return;
    const dx = (event.clientX - state.lastX) * 0.01;
    const dy = (event.clientY - state.lastY) * 0.01;
    spinner.current.rotation.y += dx;
    spinner.current.rotation.x = Math.max(-1.2, Math.min(1.2, spinner.current.rotation.x + dy));
    state.velocityY = dx;
    state.velocityX = dy * 0.5;
    state.lastX = event.clientX;
    state.lastY = event.clientY;
  }

  function onPointerUp(event: ThreeEvent<PointerEvent>) {
    if (!drag.current.active) return;
    (event.target as Element).releasePointerCapture?.(event.pointerId);
    drag.current.active = false;
    document.body.style.cursor = focused ? "grab" : "";
  }

  return (
    <group position={placement.position} rotation={[0, placement.yaw, 0]}>
      <group position={[0, -placement.position[1], 0]}>
        <mesh geometry={plinth} castShadow receiveShadow>
          <meshStandardMaterial color={palette.metal} metalness={0.85} roughness={0.35} />
        </mesh>
        <mesh position={[0, 1.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.58, 48]} />
          <meshStandardMaterial ref={ring} color="#000000" emissive={project.accent} emissiveIntensity={0} toneMapped={false} />
        </mesh>
        {/* Light shaft from the ceiling */}
        <mesh position={[0, 4.6, 0]} material={shaftMaterial}>
          <cylinderGeometry args={[0.35, 0.8, 7.2, 32, 1, true]} />
        </mesh>
        <group ref={floater} position={[0, placement.position[1], 0]} scale={ARTIFACT_SCALE}>
          <group
            ref={spinner}
            {...bind}
            onClick={(event) => {
              if (!interactive || focused || event.delta > 6) return;
              event.stopPropagation();
              sounds.select();
              focusProject(project.id);
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerEnter={() => {
              if (focused) document.body.style.cursor = "grab";
            }}
          >
            <Visual focused={focused} hoverRef={hoverRef} accent={project.accent} />
            {/* Invisible grab volume — makes small artifacts easy to hit and drag. */}
            <mesh visible={false}>
              <sphereGeometry args={[0.95, 12, 12]} />
            </mesh>
          </group>
        </group>
        <Text
          ref={label}
          font={FONT_DISPLAY}
          position={[0, 0.5, 1.02]}
          fontSize={0.17}
          anchorX="center"
          color={palette.ink}
          fillOpacity={0}
        >
          {project.codename}
        </Text>
        <Text
          ref={sublabel}
          font={FONT_MONO}
          position={[0, 0.3, 1.0]}
          fontSize={0.085}
          anchorX="center"
          color={palette.mute}
          fillOpacity={0}
        >
          {`${project.index}  ${project.name}`}
        </Text>
      </group>
    </group>
  );
}

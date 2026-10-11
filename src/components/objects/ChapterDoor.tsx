"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import {
  BufferGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Path,
  Shape,
  ShapeGeometry,
  type Mesh,
  type MeshStandardMaterial,
} from "three";
import type { Chapter } from "@/data/chapters";
import { useHoverable } from "@/hooks/useHoverable";
import { useInteractive } from "@/hooks/useInteractive";
import { sounds } from "@/lib/audio/engine";
import { createPortalMaterial } from "@/lib/shaders/materials";
import { FONT_DISPLAY, FONT_MONO } from "@/lib/world/fonts";
import { bearingYaw, doorPosition } from "@/lib/world/layout";
import { palette } from "@/lib/world/palette";
import { runtime } from "@/lib/world/runtime";
import { useExperience } from "@/stores/experienceStore";

const OUTER = { width: 3.4, height: 5.6, chamfer: 0.9 };
const INNER = { width: 2.5, height: 4.9, chamfer: 0.62 };

type TroikaText = Mesh & { fillOpacity: number };

/** Points of a chamfered-top doorway outline, counter-clockwise from bottom left. */
function doorOutline({ width, height, chamfer }: typeof OUTER): [number, number][] {
  const half = width / 2;
  return [
    [-half, 0],
    [half, 0],
    [half, height - chamfer],
    [half - chamfer, height],
    [-half + chamfer, height],
    [-half, height - chamfer],
  ];
}

function trace<T extends Path>(target: T, points: [number, number][]): T {
  points.forEach(([x, y], index) => (index === 0 ? target.moveTo(x, y) : target.lineTo(x, y)));
  target.closePath();
  return target;
}

/** Normalised UVs for a flat shape so the portal shader spans the whole opening. */
function withBoxUvs(geometry: ShapeGeometry, width: number, height: number) {
  const position = geometry.getAttribute("position");
  const uvs: number[] = [];
  for (let index = 0; index < position.count; index += 1) {
    uvs.push(position.getX(index) / width + 0.5, position.getY(index) / height);
  }
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  return geometry;
}

/**
 * A doorway in the hub wall. Open chambers swirl with fog; sealed ones show
 * an energy barrier. Clicking travels (or explains why the door is sealed).
 */
export function ChapterDoor({ chapter }: { chapter: Chapter }) {
  const interactive = useInteractive("awakening");
  const goTo = useExperience((state) => state.goTo);
  const { hovered, hoverRef, bind } = useHoverable(interactive);
  const accent = chapter.open ? chapter.color : palette.ember;

  const frameGeometry = useMemo(() => {
    const shape = trace(new Shape(), doorOutline(OUTER));
    const innerPoints = doorOutline(INNER).map(([x, y]) => [x, y + 0.25] as [number, number]);
    shape.holes.push(trace(new Path(), innerPoints));
    const geometry = new ExtrudeGeometry(shape, {
      depth: 0.4,
      bevelEnabled: true,
      bevelSize: 0.04,
      bevelThickness: 0.04,
      bevelSegments: 2,
    });
    geometry.translate(0, 0, -0.2);
    return geometry;
  }, []);

  const portalGeometry = useMemo(() => {
    const geometry = new ShapeGeometry(trace(new Shape(), doorOutline(INNER)));
    geometry.translate(0, 0.25, 0);
    return withBoxUvs(geometry, INNER.width, INNER.height + 0.5);
  }, []);

  const edgeGeometry = useMemo(() => {
    const points = doorOutline(INNER).flatMap(([x, y]) => [x, y + 0.25, 0.22]);
    const first = points.slice(0, 3);
    return new BufferGeometry().setAttribute("position", new Float32BufferAttribute([...points, ...first], 3));
  }, []);

  const portalMaterial = useMemo(() => createPortalMaterial(accent, !chapter.open), [accent, chapter.open]);
  useEffect(() => () => portalMaterial.dispose(), [portalMaterial]);

  const frameMaterial = useRef<MeshStandardMaterial>(null);
  const label = useRef<TroikaText>(null);
  const title = useRef<TroikaText>(null);
  const hint = useRef<TroikaText>(null);

  useFrame((state, delta) => {
    const { uniforms } = portalMaterial;
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uPower.value = runtime.power;
    uniforms.uHover.value += (hoverRef.current - uniforms.uHover.value) * Math.min(1, delta * 6);
    if (frameMaterial.current) frameMaterial.current.emissiveIntensity = runtime.power * (0.08 + uniforms.uHover.value * 0.25);
    const reveal = Math.max(0, (runtime.power - 0.6) * 2.5);
    if (label.current) label.current.fillOpacity = reveal;
    if (title.current) title.current.fillOpacity = reveal;
    if (hint.current) hint.current.fillOpacity += ((hovered ? 1 : 0) - hint.current.fillOpacity) * Math.min(1, delta * 6);
  });

  const position = doorPosition(chapter.id);

  return (
    <group position={[position.x, 0, position.z]} rotation={[0, bearingYaw(chapter.bearing), 0]}>
      <mesh geometry={frameGeometry} castShadow>
        <meshStandardMaterial
          ref={frameMaterial}
          color={palette.metal}
          metalness={0.8}
          roughness={0.42}
          emissive={accent}
          emissiveIntensity={0}
        />
      </mesh>
      <lineLoop geometry={edgeGeometry}>
        <lineBasicMaterial color={accent} toneMapped={false} transparent opacity={0.9} />
      </lineLoop>
      <mesh
        geometry={portalGeometry}
        material={portalMaterial}
        position={[0, 0, 0.05]}
        {...bind}
        onClick={(event) => {
          if (!interactive) return;
          event.stopPropagation();
          sounds.select();
          goTo(chapter.id);
        }}
      />

      <Text
        ref={label}
        font={FONT_MONO}
        position={[0, OUTER.height + 0.75, 0.2]}
        fontSize={0.2}
        letterSpacing={0.1}
        anchorX="center"
        color={accent}
        fillOpacity={0}
      >
        {`0${chapter.number}${chapter.open ? "" : "  ·  sealed"}`}
      </Text>
      <Text
        ref={title}
        font={FONT_DISPLAY}
        position={[0, OUTER.height + 0.38, 0.2]}
        fontSize={0.36}
        anchorX="center"
        color={palette.ink}
        fillOpacity={0}
      >
        {chapter.title}
      </Text>
      <Text
        ref={hint}
        font={FONT_MONO}
        position={[0, 0.5, 0.5]}
        fontSize={0.13}
        maxWidth={2.3}
        textAlign="center"
        anchorX="center"
        color={palette.ink}
        fillOpacity={0}
      >
        {chapter.open ? chapter.hint : "Sealed for now — click to learn more"}
      </Text>
    </group>
  );
}

"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, DoubleSide, type Group } from "three";
import type { ArtifactVisualProps } from "@/components/objects/ProjectArtifact";
import { typedShader } from "@/lib/shaders/materials";
import { palette } from "@/lib/world/palette";
import { runtime } from "@/lib/world/runtime";
import { useExperience } from "@/stores/experienceStore";

const PAGES = 6;

function createPageMaterial(index: number, accent: string) {
  return typedShader(
    { uPower: { value: 0 }, uIndex: { value: index }, uImage: { value: 0 }, uAccent: { value: new Color(accent) } },
    {
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
      fragmentShader: /* glsl */ `
        varying vec2 vUv;
        uniform float uPower;
        uniform float uIndex;
        uniform float uImage;
        uniform vec3 uAccent;
        float hash(float n) { return fract(sin(n) * 43758.5453); }
        void main() {
          vec2 uv = vUv;
          vec3 paper = vec3(0.86, 0.89, 0.94);
          // Text lines with ragged ends, plus one figure block per page.
          float line = step(0.55, fract(uv.y * 26.0));
          float row = floor(uv.y * 26.0);
          float lineEnd = 0.55 + hash(row + uIndex * 31.0) * 0.35;
          float text = line * step(0.1, uv.x) * step(uv.x, lineEnd) * step(0.08, uv.y) * step(uv.y, 0.88);
          float figY = 0.45 + hash(uIndex) * 0.25;
          float figure = step(0.12, uv.x) * step(uv.x, 0.88) * step(figY - 0.14, uv.y) * step(uv.y, figY + 0.04);
          float heading = step(0.1, uv.x) * step(uv.x, 0.6) * step(0.9, uv.y) * step(uv.y, 0.94);
          vec3 ink = vec3(0.35, 0.4, 0.5);
          vec3 color = paper;
          color = mix(color, ink, text * (1.0 - figure) * 0.6);
          color = mix(color, uAccent * 0.8 + 0.1, figure);
          color = mix(color, vec3(0.1, 0.12, 0.18), heading);
          // Rendered-as-image tint: a cool frame appears once pages separate.
          float frame = 1.0 - step(0.025, min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y)));
          color = mix(color, vec3(0.13, 0.83, 0.93) * 2.0, frame * uImage);
          gl_FragColor = vec4(color * (0.25 + 0.75 * uPower), 1.0);
        }
      `,
      side: DoubleSide,
      toneMapped: false,
    },
  );
}

/** PDF bot: a document that splits into separate image layers when the visitor runs the conversion. */
export function ArchiveArtifact({ focused, accent }: ArtifactVisualProps) {
  const archiveOpen = useExperience((state) => state.archiveOpen);
  const pages = useRef<(Group | null)[]>([]);
  const materials = useMemo(() => Array.from({ length: PAGES }, (_, index) => createPageMaterial(index, accent)), [accent]);

  useEffect(() => () => materials.forEach((material) => material.dispose()), [materials]);

  useFrame((state, delta) => {
    const ease = Math.min(1, delta * 4);
    const time = state.clock.elapsedTime;
    pages.current.forEach((page, index) => {
      if (!page) return;
      const centered = index - (PAGES - 1) / 2;
      const split = archiveOpen ? 1 : focused ? 0.18 : 0;
      const target = {
        x: centered * 0.25 * split,
        y: Math.sin(time * 1.2 + index) * 0.02 * split,
        z: (PAGES - index) * 0.012 + split * Math.abs(centered) * -0.12,
        ry: centered * -0.22 * split,
      };
      page.position.x += (target.x - page.position.x) * ease;
      page.position.y += (target.y - page.position.y) * ease;
      page.position.z += (target.z - page.position.z) * ease;
      page.rotation.y += (target.ry - page.rotation.y) * ease;
      const material = materials[index];
      if (material) {
        material.uniforms.uPower.value = runtime.power;
        material.uniforms.uImage.value += ((archiveOpen ? 1 : 0) - material.uniforms.uImage.value) * ease;
      }
    });
  });

  return (
    <group rotation={[0, 0, 0.06]}>
      {materials.map((material, index) => (
        <group key={index} ref={(node) => void (pages.current[index] = node)}>
          <mesh material={material}>
            <planeGeometry args={[0.58, 0.8]} />
          </mesh>
        </group>
      ))}
      {/* Binder clip */}
      <mesh position={[0, 0.41, 0.08]}>
        <boxGeometry args={[0.18, 0.05, 0.04]} />
        <meshStandardMaterial color={palette.metal} metalness={0.9} roughness={0.25} />
      </mesh>
    </group>
  );
}

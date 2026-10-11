"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, DoubleSide, Object3D, type InstancedMesh } from "three";
import type { ArtifactVisualProps } from "@/components/objects/ProjectArtifact";
import { typedShader } from "@/lib/shaders/materials";
import { palette } from "@/lib/world/palette";
import { runtime } from "@/lib/world/runtime";

const SEAT_ROWS = 3;
const SEATS_PER_ROW = 7;

/** Streaming platform: a miniature holographic theatre whose curved screen "plays" when focused. */
export function TheaterArtifact({ focused, hoverRef, accent }: ArtifactVisualProps) {
  const seats = useRef<InstancedMesh>(null);

  const screenMaterial = useMemo(
    () =>
      typedShader(
        {
          uTime: { value: 0 },
          uPower: { value: 0 },
          uPlay: { value: 0 },
          uHover: { value: 0 },
          uAccent: { value: new Color(accent) },
        },
        {
          vertexShader: /* glsl */ `
            varying vec2 vUv;
            void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
          `,
          fragmentShader: /* glsl */ `
            varying vec2 vUv;
            uniform float uTime;
            uniform float uPower;
            uniform float uPlay;
            uniform float uHover;
            uniform vec3 uAccent;
            void main() {
              vec2 uv = vec2(1.0 - vUv.x, vUv.y);
              // Idle: a catalogue grid of title tiles. Playing: abstract moving footage.
              vec2 tile = fract(uv * vec2(5.0, 3.0));
              float tileMask = step(0.08, tile.x) * step(tile.x, 0.92) * step(0.1, tile.y) * step(tile.y, 0.9);
              float idx = floor(uv.x * 5.0) + floor(uv.y * 3.0) * 5.0;
              vec3 catalogue = mix(vec3(0.06, 0.09, 0.16), uAccent * (0.35 + 0.25 * sin(idx * 1.7)), tileMask * 0.8);

              float t = uTime * 0.6;
              vec3 footage = 0.5 + 0.5 * cos(vec3(0.0, 0.6, 1.2) + uv.x * 3.0 + t + vec3(sin(uv.y * 4.0 + t * 1.3)));
              footage *= mix(vec3(0.25, 0.45, 0.9), vec3(1.0), 0.35);
              float bar = step(uv.y, 0.06) * step(uv.x, fract(uTime * 0.05));
              vec3 color = mix(catalogue, footage, uPlay) + vec3(bar) * uPlay * 0.9;
              float scan = 0.92 + 0.08 * sin(uv.y * 240.0);
              gl_FragColor = vec4(color * scan * uPower * (0.62 + uHover * 0.25), 1.0);
            }
          `,
          side: DoubleSide,
          toneMapped: false,
        },
      ),
    [accent],
  );

  useEffect(() => () => screenMaterial.dispose(), [screenMaterial]);

  useLayoutEffect(() => {
    const dummy = new Object3D();
    let index = 0;
    for (let row = 0; row < SEAT_ROWS; row += 1) {
      for (let seat = 0; seat < SEATS_PER_ROW; seat += 1) {
        const angle = ((seat - (SEATS_PER_ROW - 1) / 2) / SEATS_PER_ROW) * 1.0;
        const radius = 0.25 + row * 0.13;
        dummy.position.set(Math.sin(angle) * radius, -0.42 + row * 0.05, 0.05 + Math.cos(angle) * radius);
        dummy.rotation.set(0, angle, 0);
        dummy.updateMatrix();
        seats.current?.setMatrixAt(index, dummy.matrix);
        index += 1;
      }
    }
    if (seats.current) seats.current.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame((state, delta) => {
    const { uniforms } = screenMaterial;
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uPower.value = runtime.power;
    uniforms.uPlay.value += ((focused ? 1 : 0) - uniforms.uPlay.value) * Math.min(1, delta * 2);
    uniforms.uHover.value = hoverRef.current ?? 0;
  });

  return (
    <group position={[0, 0.05, -0.1]}>
      {/* Curved screen: inside of a cylinder segment facing the seats */}
      <mesh position={[0, 0.12, 0.65]} material={screenMaterial}>
        <cylinderGeometry args={[0.95, 0.95, 0.56, 48, 1, true, Math.PI - 0.62, 1.24]} />
      </mesh>
      <mesh position={[0, 0.42, 0.65]}>
        <cylinderGeometry args={[0.97, 0.97, 0.025, 48, 1, true, Math.PI - 0.64, 1.28]} />
        <meshStandardMaterial color={palette.metal} metalness={0.8} roughness={0.3} side={DoubleSide} />
      </mesh>
      <mesh position={[0, -0.18, 0.65]}>
        <cylinderGeometry args={[0.97, 0.97, 0.025, 48, 1, true, Math.PI - 0.64, 1.28]} />
        <meshStandardMaterial color={palette.metal} metalness={0.8} roughness={0.3} side={DoubleSide} />
      </mesh>
      <instancedMesh ref={seats} args={[undefined, undefined, SEAT_ROWS * SEATS_PER_ROW]}>
        <boxGeometry args={[0.07, 0.06, 0.06]} />
        <meshStandardMaterial color="#1B2436" metalness={0.4} roughness={0.6} />
      </instancedMesh>
      {/* Stage floor */}
      <mesh position={[0, -0.47, 0.25]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.72, 48, Math.PI * 0.05, Math.PI * 0.9]} />
        <meshStandardMaterial color={palette.navy} metalness={0.5} roughness={0.5} side={DoubleSide} />
      </mesh>
    </group>
  );
}

"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { BackSide, Color } from "three";
import { typedShader } from "@/lib/shaders/materials";
import { runtime } from "@/lib/world/runtime";

/**
 * A dusk dome for the Journey: deep blue overhead, a lighter band at the
 * horizon, and a low warm glow in the west — where the route is heading.
 * Fog is disabled on it so the horizon colour stays clean.
 */
export function DuskSky({ center, radius = 150 }: { center: [number, number, number]; radius?: number }) {
  const material = useMemo(
    () =>
      typedShader(
        {
          uZenith: { value: new Color("#050913") },
          uHorizon: { value: new Color("#1A2B4F") },
          uGlow: { value: new Color("#B4562A") },
          uPower: { value: 0 },
          uTime: { value: 0 },
        },
        {
          vertexShader: /* glsl */ `
            varying vec3 vDir;
            void main() {
              vDir = normalize(position);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: /* glsl */ `
            varying vec3 vDir;
            uniform vec3 uZenith;
            uniform vec3 uHorizon;
            uniform vec3 uGlow;
            uniform float uPower;
            uniform float uTime;
            float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
            void main() {
              float h = clamp(vDir.y, -0.2, 1.0);
              vec3 color = mix(uHorizon, uZenith, smoothstep(0.0, 0.55, h));
              // West (-z in chamber space) carries the last light of dusk.
              float west = smoothstep(0.2, 1.0, -vDir.z) * (1.0 - smoothstep(0.0, 0.28, h));
              color += uGlow * west * 0.55;
              // Sparse stars, fading towards the horizon.
              vec3 cell = floor(vDir * 220.0);
              float star = step(0.9975, hash(cell)) * smoothstep(0.08, 0.5, h);
              color += vec3(star) * (0.6 + 0.4 * sin(uTime * 2.0 + hash(cell) * 40.0));
              gl_FragColor = vec4(color * (0.25 + 0.75 * uPower), 1.0);
            }
          `,
          side: BackSide,
          depthWrite: false,
          fog: false,
        },
      ),
    [],
  );

  useEffect(() => () => material.dispose(), [material]);

  useFrame((state) => {
    material.uniforms.uPower.value = runtime.power;
    material.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh position={center} material={material} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[radius, 48, 24]} />
    </mesh>
  );
}

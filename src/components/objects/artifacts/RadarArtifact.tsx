"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, DoubleSide } from "three";
import type { ArtifactVisualProps } from "@/components/objects/ProjectArtifact";
import { typedShader } from "@/lib/shaders/materials";
import { palette } from "@/lib/world/palette";
import { runtime } from "@/lib/world/runtime";

/** IND monitor: a tilted radar scope. The sweep finds "slots" that flare orange when focused. */
export function RadarArtifact({ focused, hoverRef, accent }: ArtifactVisualProps) {
  const scopeMaterial = useMemo(
    () =>
      typedShader(
        {
          uTime: { value: 0 },
          uPower: { value: 0 },
          uFocus: { value: 0 },
          uHover: { value: 0 },
          uSweep: { value: new Color(palette.cyan) },
          uFound: { value: new Color(accent) },
        },
        {
          vertexShader: /* glsl */ `
            varying vec2 vUv;
            void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
          `,
          fragmentShader: /* glsl */ `
            #define PI 3.14159265
            varying vec2 vUv;
            uniform float uTime;
            uniform float uPower;
            uniform float uFocus;
            uniform float uHover;
            uniform vec3 uSweep;
            uniform vec3 uFound;
            void main() {
              vec2 p = vUv * 2.0 - 1.0;
              float r = length(p);
              if (r > 1.0) discard;
              float a = atan(p.y, p.x);
              float sweepAngle = mod(uTime * (1.1 + uFocus * 1.3), 2.0 * PI) - PI;
              float behind = mod(sweepAngle - a + 2.0 * PI, 2.0 * PI);
              float trail = exp(-behind * 3.0);
              float rings = smoothstep(0.02, 0.0, abs(fract(r * 4.0) - 0.5) - 0.47);
              float cross = smoothstep(0.006, 0.0, min(abs(p.x), abs(p.y)));
              float rim = smoothstep(0.03, 0.0, abs(r - 0.98));

              // Fixed "appointment slots" that light up as the sweep passes.
              vec3 found = vec3(0.0);
              for (int i = 0; i < 6; i++) {
                float fi = float(i);
                float br = 0.25 + fract(sin(fi * 12.9) * 43758.5) * 0.65;
                float ba = fract(sin(fi * 78.2) * 12345.6) * 2.0 * PI - PI;
                vec2 bp = vec2(cos(ba), sin(ba)) * br;
                float since = mod(sweepAngle - ba + 2.0 * PI, 2.0 * PI);
                float glow = exp(-since * 1.2) * smoothstep(0.05, 0.0, length(p - bp));
                found += mix(uSweep, uFound, uFocus) * glow * 3.0;
              }

              vec3 color = vec3(0.02, 0.05, 0.08) + uSweep * (trail * 0.55 + rings * 0.25 + cross * 0.2 + rim * 0.6) + found;
              gl_FragColor = vec4(color * uPower * (0.55 + uHover * 0.25), 1.0);
            }
          `,
          side: DoubleSide,
          toneMapped: false,
        },
      ),
    [accent],
  );

  useEffect(() => () => scopeMaterial.dispose(), [scopeMaterial]);

  useFrame((state, delta) => {
    const { uniforms } = scopeMaterial;
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uPower.value = runtime.power;
    uniforms.uHover.value = hoverRef.current ?? 0;
    uniforms.uFocus.value += ((focused ? 1 : 0) - uniforms.uFocus.value) * Math.min(1, delta * 2);
  });

  return (
    <group rotation={[-0.55, 0, 0]}>
      <mesh material={scopeMaterial} position={[0, 0, 0.056]}>
        <circleGeometry args={[0.62, 64]} />
      </mesh>
      {/* Bezel and back housing */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.7, 0.66, 0.1, 64, 1]} />
        <meshStandardMaterial color={palette.metal} metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.06]}>
        <torusGeometry args={[0.66, 0.02, 8, 96]} />
        <meshStandardMaterial color="#000000" emissive={palette.cyan} emissiveIntensity={1.4} toneMapped={false} />
      </mesh>
      {/* Antenna mast */}
      <mesh position={[0.45, 0.62, -0.1]} rotation={[0, 0, -0.5]}>
        <cylinderGeometry args={[0.012, 0.012, 0.6, 6]} />
        <meshStandardMaterial color={palette.metal} metalness={0.9} roughness={0.25} />
      </mesh>
      <mesh position={[0.6, 0.88, -0.1]}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshStandardMaterial color="#000000" emissive={accent} emissiveIntensity={3} toneMapped={false} />
      </mesh>
    </group>
  );
}

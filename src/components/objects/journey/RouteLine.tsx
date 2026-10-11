"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, Color, TubeGeometry } from "three";
import { typedShader } from "@/lib/shaders/materials";
import { isMoveStop, route, stopProgress } from "@/lib/world/journey";
import { palette } from "@/lib/world/palette";
import { runtime } from "@/lib/world/runtime";
import { useExperience } from "@/stores/experienceStore";

/**
 * The path itself. Lit up to the current stop (warm in Tehran, cool in
 * Amsterdam), a faint dashed promise beyond it, and a spark at the head.
 */
export function RouteLine() {
  const geometry = useMemo(() => new TubeGeometry(route, 1400, 0.08, 8, false), []);
  const material = useMemo(
    () =>
      typedShader(
        {
          uTime: { value: 0 },
          uPower: { value: 0 },
          uProgress: { value: 0 },
          uWarm: { value: new Color(palette.ember) },
          uCool: { value: new Color(palette.cyan) },
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
            uniform float uProgress;
            uniform vec3 uWarm;
            uniform vec3 uCool;
            void main() {
              float t = vUv.x;
              vec3 tint = mix(uWarm, uCool, smoothstep(0.35, 0.65, t));
              float lit = step(t, uProgress);
              float dash = step(0.5, fract(t * 260.0 - uTime * 0.6));
              float pulse = smoothstep(0.03, 0.0, abs(fract(t * 6.0 - uTime * 0.25) - 0.5) - 0.47);
              float head = exp(-pow((t - uProgress) * 160.0, 2.0)) * 4.0;
              float intensity = lit * (1.4 + pulse * 1.5) + (1.0 - lit) * dash * 0.18 + head;
              float alpha = clamp(lit + (1.0 - lit) * dash * 0.35 + head, 0.0, 1.0);
              gl_FragColor = vec4(tint * intensity * uPower, alpha * uPower);
            }
          `,
          transparent: true,
          depthWrite: false,
          blending: AdditiveBlending,
          toneMapped: false,
        },
      ),
    [],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame((state, delta) => {
    const { journeyStop, chapter } = useExperience.getState();
    // Overview shows the whole route; a stop shows the route up to that point.
    // During the move, the lit route follows the airliner instead of easing to a stop.
    if (chapter === "journey" && isMoveStop(journeyStop)) {
      runtime.journeyProgress = Math.max(runtime.journeyProgress, runtime.planeProgress);
    } else {
      const target = chapter !== "journey" ? 0 : journeyStop === null ? 1 : (stopProgress[journeyStop] ?? 0);
      runtime.journeyProgress += (target - runtime.journeyProgress) * Math.min(1, delta * 1.6);
    }
    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uPower.value = runtime.power;
    material.uniforms.uProgress.value = runtime.journeyProgress;
  });

  return <mesh geometry={geometry} material={material} frustumCulled={false} />;
}

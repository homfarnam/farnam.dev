"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Text } from "@react-three/drei";
import { AdditiveBlending, Color, QuadraticBezierCurve3, TubeGeometry, Vector3, type Mesh } from "three";
import { journeyStops } from "@/data/journey";
import { typedShader } from "@/lib/shaders/materials";
import { FONT_MONO } from "@/lib/world/fonts";
import { remoteAnchor, stopPoint } from "@/lib/world/journey";
import { palette } from "@/lib/world/palette";
import { runtime } from "@/lib/world/runtime";
import { useExperience } from "@/stores/experienceStore";

type TroikaText = Mesh & { fillOpacity: number };

/** For remote roles: a data arc from the city towards where the team was. */
function Link({ index }: { index: number }) {
  const stop = journeyStops[index];
  const active = useExperience((state) => state.journeyStop === index);
  const fade = useRef(0);
  const label = useRef<TroikaText>(null);

  const { geometry, end, offMap } = useMemo(() => {
    const start = stopPoint(index);
    const remote = stop?.remote;
    const { point, offMap: outside } = remoteAnchor(remote?.lon ?? 0, remote?.lat ?? 0);
    const mid = start.clone().lerp(point, 0.5);
    mid.y = 3 + start.distanceTo(point) * 0.18;
    const curve = new QuadraticBezierCurve3(start, mid, point);
    return { geometry: new TubeGeometry(curve, 120, 0.035, 6, false), end: point, offMap: outside };
  }, [index, stop]);

  const material = useMemo(
    () =>
      typedShader(
        { uTime: { value: 0 }, uFade: { value: 0 }, uColor: { value: new Color(palette.cyan) } },
        {
          vertexShader: /* glsl */ `
            varying vec2 vUv;
            void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
          `,
          fragmentShader: /* glsl */ `
            varying vec2 vUv;
            uniform float uTime;
            uniform float uFade;
            uniform vec3 uColor;
            void main() {
              float drawn = step(vUv.x, uFade);
              float packet = smoothstep(0.06, 0.0, abs(fract(vUv.x * 3.0 - uTime * 0.5) - 0.5) - 0.44);
              float dash = step(0.45, fract(vUv.x * 60.0));
              float alpha = drawn * (dash * 0.45 + packet);
              gl_FragColor = vec4(uColor * (1.2 + packet * 2.0), alpha);
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
    fade.current += ((active ? 1 : 0) - fade.current) * Math.min(1, delta * (active ? 1.2 : 4));
    material.uniforms.uFade.value = fade.current * runtime.power;
    material.uniforms.uTime.value = state.clock.elapsedTime;
    if (label.current) label.current.fillOpacity = Math.max(0, fade.current - 0.6) * 2.5 * runtime.power;
  });

  if (!stop?.remote) return null;
  return (
    <group>
      <mesh geometry={geometry} material={material} frustumCulled={false} />
      <Billboard position={new Vector3(end.x, end.y + 1.2, end.z)}>
        <Text
          ref={label}
          font={FONT_MONO}
          fontSize={0.45}
          lineHeight={1.4}
          textAlign="center"
          anchorX="center"
          color={palette.cyan}
          fillOpacity={0}
        >
          {`${stop.remote.label}${offMap ? " →" : ""}\nremote team`}
        </Text>
      </Billboard>
    </group>
  );
}

export function RemoteLinks() {
  return <>{journeyStops.map((stop, index) => (stop.remote ? <Link key={stop.id} index={index} /> : null))}</>;
}

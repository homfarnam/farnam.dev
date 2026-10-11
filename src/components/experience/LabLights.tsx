"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { AmbientLight, DirectionalLight, PointLight } from "three";
import { palette } from "@/lib/world/palette";
import { runtime } from "@/lib/world/runtime";

/** Global lighting. Every intensity follows lab power so the boot reads as lights coming on. */
export function LabLights() {
  const ambient = useRef<AmbientLight>(null);
  const key = useRef<DirectionalLight>(null);
  const core = useRef<PointLight>(null);
  const rim = useRef<PointLight>(null);

  useFrame((state) => {
    const power = runtime.power;
    const time = state.clock.elapsedTime;
    if (ambient.current) ambient.current.intensity = 0.08 + power * 0.35;
    if (key.current) key.current.intensity = power * 1.1;
    if (core.current) core.current.intensity = power * (22 + Math.sin(time * 2) * 3) + runtime.overdrive * 40;
    if (rim.current) rim.current.intensity = power * 30;
  });

  return (
    <>
      <ambientLight ref={ambient} color={palette.signal} intensity={0.08} />
      <directionalLight ref={key} position={[6, 14, 8]} color="#CFE3FF" intensity={0} />
      <pointLight ref={core} position={[0, 3.4, 0]} color={palette.cyan} intensity={0} distance={18} decay={1.6} />
      <pointLight ref={rim} position={[0, 6.5, -9]} color={palette.signal} intensity={0} distance={22} decay={1.8} />
    </>
  );
}

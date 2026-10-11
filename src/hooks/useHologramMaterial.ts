"use client";

import { useEffect, useMemo, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { createHologramMaterial } from "@/lib/shaders/materials";
import { runtime } from "@/lib/world/runtime";

/** Hologram material that follows lab power and eases its hover glow. */
export function useHologramMaterial(color: string, opacity = 1, hoverRef?: RefObject<number>) {
  const material = useMemo(() => createHologramMaterial(color, opacity), [color, opacity]);

  useEffect(() => () => material.dispose(), [material]);

  useFrame((state, delta) => {
    const { uniforms } = material;
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uPower.value = runtime.power;
    const hoverTarget = hoverRef?.current ?? 0;
    uniforms.uHover.value += (hoverTarget - uniforms.uHover.value) * Math.min(1, delta * 8);
  });

  return material;
}

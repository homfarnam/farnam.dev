"use client";

import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { BufferAttribute, BufferGeometry } from "three";
import { createDustMaterial } from "@/lib/shaders/materials";
import { runtime } from "@/lib/world/runtime";
import { useExperience } from "@/stores/experienceStore";

interface DustProps {
  count: number;
  radius: number;
  height: number;
  color?: string;
  size?: number;
  position?: [number, number, number];
}

/** Floating motes that catch the light. Count is scaled by quality. */
export function Dust({ count, radius, height, color = "#22D3EE", size = 1.6, position }: DustProps) {
  const quality = useExperience((state) => state.quality);
  const dpr = useThree((state) => state.viewport.dpr);
  const total = Math.round(count * (quality === "low" ? 0.35 : 1));

  const geometry = useMemo(() => {
    const positions = new Float32Array(total * 3);
    const seeds = new Float32Array(total);
    for (let index = 0; index < total; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.sqrt(Math.random()) * radius;
      positions[index * 3] = Math.cos(angle) * distance;
      positions[index * 3 + 1] = Math.random() * height;
      positions[index * 3 + 2] = Math.sin(angle) * distance;
      seeds[index] = Math.random();
    }
    const buffer = new BufferGeometry();
    buffer.setAttribute("position", new BufferAttribute(positions, 3));
    buffer.setAttribute("aSeed", new BufferAttribute(seeds, 1));
    return buffer;
  }, [total, radius, height]);

  const material = useMemo(() => createDustMaterial(color, size), [color, size]);

  useFrame((state) => {
    const { uniforms } = material;
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uPower.value = runtime.power;
    uniforms.uPixelRatio.value = dpr;
    uniforms.uBurst.value = runtime.overdrive;
  });

  return <points geometry={geometry} material={material} position={position} frustumCulled={false} />;
}

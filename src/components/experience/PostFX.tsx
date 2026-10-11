"use client";

import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { useExperience } from "@/stores/experienceStore";

/** Restrained grade: bloom only on emissive values above 1, light grain, soft vignette. */
export function PostFX() {
  const quality = useExperience((state) => state.quality);
  if (quality === "low") return null;
  return (
    <EffectComposer multisampling={4}>
      <Bloom mipmapBlur intensity={0.85} luminanceThreshold={1} luminanceSmoothing={0.2} radius={0.7} />
      <Noise opacity={0.035} premultiply />
      <Vignette offset={0.25} darkness={0.75} />
    </EffectComposer>
  );
}

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { BufferAttribute, BufferGeometry, Vector3, type Mesh } from "three";

/**
 * Loads a baked buildings GLB (meshopt + quantized, see scripts/bake-*.mjs) and
 * returns one flat Float32 geometry with `aSeed` (and `aRadius` when present).
 * meshopt decoding is bundled with three-stdlib — nothing is fetched from a CDN.
 */
export function useBakedBuildings(url: string): BufferGeometry {
  const gltf = useGLTF(url, false, true);
  return useMemo(() => {
    let source: Mesh | undefined;
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((object) => {
      if (!source && (object as Mesh).isMesh) source = object as Mesh;
    });
    const result = new BufferGeometry();
    if (!source) return result;
    const quantized = source.geometry.getAttribute("position");
    const positions = new Float32Array(quantized.count * 3);
    const point = new Vector3();
    for (let index = 0; index < quantized.count; index += 1) {
      point.fromBufferAttribute(quantized, index).applyMatrix4(source.matrixWorld);
      positions[index * 3] = point.x;
      positions[index * 3 + 1] = point.y;
      positions[index * 3 + 2] = point.z;
    }
    const seedSource = source.geometry.getAttribute("_seed");
    const radiusSource = source.geometry.getAttribute("_radius");
    const seeds = new Float32Array(quantized.count);
    const radii = new Float32Array(quantized.count);
    for (let index = 0; index < quantized.count; index += 1) {
      seeds[index] = seedSource ? seedSource.getX(index) : 0.5;
      radii[index] = radiusSource ? radiusSource.getX(index) : 0;
    }
    result.setAttribute("position", new BufferAttribute(positions, 3));
    result.setAttribute("aSeed", new BufferAttribute(seeds, 1));
    result.setAttribute("aRadius", new BufferAttribute(radii, 1));
    if (source.geometry.index) result.setIndex(source.geometry.index.clone());
    result.computeBoundingSphere();
    return result;
  }, [gltf]);
}

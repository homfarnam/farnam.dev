"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, IcosahedronGeometry, Object3D, type InstancedMesh, type PointLight } from "three";
import { runtime } from "@/lib/world/runtime";
import { isWalkable, type StreetData, type StreetStyle } from "@/lib/world/street";

/** Deterministic random so the street dresses the same way every visit. */
function seeded(seed: number) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

const CANOPY_BLOBS = 5;

/** Canal elms: a trunk and a cluster of lumpy foliage blobs, all instanced. */
function Trees({ street, style }: { street: StreetData; style: StreetStyle }) {
  const trunks = useRef<InstancedMesh>(null);
  const canopies = useRef<InstancedMesh>(null);
  const count = street.trees.length / 3;

  const blob = useMemo(() => {
    const geometry = new IcosahedronGeometry(1, 2);
    const random = seeded(11);
    const position = geometry.getAttribute("position");
    for (let index = 0; index < position.count; index += 1) {
      const jitter = 0.82 + random() * 0.36;
      position.setXYZ(index, position.getX(index) * jitter, position.getY(index) * jitter, position.getZ(index) * jitter);
    }
    geometry.computeVertexNormals();
    return geometry;
  }, []);

  useEffect(() => () => blob.dispose(), [blob]);

  useLayoutEffect(() => {
    const random = seeded(4242);
    const dummy = new Object3D();
    const color = new Color();
    const leafTones = style.trees.tones;
    const [minHeight, maxHeight] = style.trees.height;
    for (let index = 0; index < count; index += 1) {
      const north = street.trees[index * 3] ?? 0;
      const east = street.trees[index * 3 + 1] ?? 0;
      const height = minHeight + random() * (maxHeight - minHeight);
      dummy.position.set(north, height * 0.35, east);
      dummy.rotation.set(0, random() * Math.PI, (random() - 0.5) * 0.08);
      dummy.scale.set(1, height * 0.7, 1);
      dummy.updateMatrix();
      trunks.current?.setMatrixAt(index, dummy.matrix);
      for (let b = 0; b < CANOPY_BLOBS; b += 1) {
        const angle = random() * Math.PI * 2;
        const spread = 1 + random() * 1.8;
        const size = 1.6 + random() * 1.5;
        dummy.position.set(north + Math.cos(angle) * spread, height * 0.7 + random() * 2.6, east + Math.sin(angle) * spread);
        dummy.rotation.set(random(), random(), random());
        dummy.scale.set(size, size * 0.85, size);
        dummy.updateMatrix();
        canopies.current?.setMatrixAt(index * CANOPY_BLOBS + b, dummy.matrix);
        color.set(leafTones[Math.floor(random() * leafTones.length)] ?? "#3B5A2A").multiplyScalar(0.8 + random() * 0.3);
        canopies.current?.setColorAt(index * CANOPY_BLOBS + b, color);
      }
    }
    if (trunks.current) trunks.current.instanceMatrix.needsUpdate = true;
    if (canopies.current) {
      canopies.current.instanceMatrix.needsUpdate = true;
      if (canopies.current.instanceColor) canopies.current.instanceColor.needsUpdate = true;
    }
  }, [street, count, style]);

  return (
    <>
      <instancedMesh ref={trunks} args={[undefined, undefined, count]} castShadow>
        <cylinderGeometry args={[0.14, 0.24, 1, 7]} />
        <meshStandardMaterial color={style.trees.trunk} roughness={0.95} />
      </instancedMesh>
      <instancedMesh ref={canopies} args={[blob, undefined, count * CANOPY_BLOBS]} castShadow receiveShadow>
        <meshStandardMaterial roughness={0.92} />
      </instancedMesh>
    </>
  );
}

const LIGHT_POOL = 7;

/**
 * Canal lamps at their real OpenStreetMap positions: dark green poles with a
 * warm lantern. A small pool of real point lights follows the walker to the
 * nearest lamps, so light falls on bricks and pavers without hundreds of lights.
 */
function Lamps({ street, style }: { street: StreetData; style: StreetStyle }) {
  const poles = useRef<InstancedMesh>(null);
  const heads = useRef<InstancedMesh>(null);
  const lights = useRef<(PointLight | null)[]>([]);
  const count = street.lamps.length / 2;
  const lastUpdate = useRef(-1);

  useLayoutEffect(() => {
    const dummy = new Object3D();
    for (let index = 0; index < count; index += 1) {
      const north = street.lamps[index * 2] ?? 0;
      const east = street.lamps[index * 2 + 1] ?? 0;
      dummy.position.set(north, style.lamps.height / 2, east);
      dummy.scale.set(1, style.lamps.height / 4.4, 1);
      dummy.updateMatrix();
      poles.current?.setMatrixAt(index, dummy.matrix);
      dummy.scale.set(1, 1, 1);
      dummy.position.set(north, style.lamps.height + 0.15, east);
      dummy.updateMatrix();
      heads.current?.setMatrixAt(index, dummy.matrix);
    }
    if (poles.current) poles.current.instanceMatrix.needsUpdate = true;
    if (heads.current) heads.current.instanceMatrix.needsUpdate = true;
  }, [street, count, style]);

  useFrame((state) => {
    // Re-pick the nearest lamps a few times a second.
    if (state.clock.elapsedTime - lastUpdate.current < 0.3) return;
    lastUpdate.current = state.clock.elapsedTime;
    const player = runtime.streetPlayer;
    const order = Array.from({ length: count }, (_, index) => index).sort((a, b) => {
      const da = ((street.lamps[a * 2] ?? 0) - player.x) ** 2 + ((street.lamps[a * 2 + 1] ?? 0) - player.z) ** 2;
      const db = ((street.lamps[b * 2] ?? 0) - player.x) ** 2 + ((street.lamps[b * 2 + 1] ?? 0) - player.z) ** 2;
      return da - db;
    });
    lights.current.forEach((light, slot) => {
      const index = order[slot];
      if (!light) return;
      if (index === undefined) {
        light.intensity = 0;
        return;
      }
      light.position.set(street.lamps[index * 2] ?? 0, style.lamps.height - 0.1, street.lamps[index * 2 + 1] ?? 0);
      light.intensity = 26;
    });
  });

  return (
    <>
      <instancedMesh ref={poles} args={[undefined, undefined, count]} castShadow>
        <cylinderGeometry args={[0.05, 0.08, 4.4, 8]} />
        <meshStandardMaterial color={style.lamps.pole} metalness={0.5} roughness={0.5} />
      </instancedMesh>
      <instancedMesh ref={heads} args={[undefined, undefined, count]}>
        <cylinderGeometry args={[0.16, 0.24, 0.42, 6]} />
        <meshStandardMaterial color="#000000" emissive={style.lamps.color} emissiveIntensity={3.2} toneMapped={false} />
      </instancedMesh>
      {Array.from({ length: LIGHT_POOL }, (_, slot) => (
        <pointLight
          key={slot}
          ref={(node) => void (lights.current[slot] = node)}
          color={style.lamps.color}
          intensity={0}
          distance={style.lamps.height * 3.4}
          decay={1.6}
        />
      ))}
    </>
  );
}

/** Amsterdammertjes: the red-brown bollards that line the quays, every ~1.8 m. */
function Bollards({ street }: { street: StreetData }) {
  const mesh = useRef<InstancedMesh>(null);
  const positions = useMemo(() => {
    const result: [number, number][] = [];
    const quay = street.quay ?? new Float32Array();
    let carry = 0;
    for (let i = 0; i < quay.length; i += 4) {
      const n1 = quay[i] ?? 0;
      const e1 = quay[i + 1] ?? 0;
      const n2 = quay[i + 2] ?? 0;
      const e2 = quay[i + 3] ?? 0;
      carry += Math.hypot(n2 - n1, e2 - e1);
      if (carry < 1.8) continue;
      carry = 0;
      // Step inland from the edge until the ground is walkable (and not a bridge).
      const length = Math.hypot(n2 - n1, e2 - e1) || 1;
      const normal: [number, number] = [-(e2 - e1) / length, (n2 - n1) / length];
      const mid: [number, number] = [(n1 + n2) / 2, (e1 + e2) / 2];
      for (const side of [1, -1]) {
        const north = mid[0] + normal[0] * 0.55 * side;
        const east = mid[1] + normal[1] * 0.55 * side;
        if (isWalkable(street, north, east)) {
          result.push([north, east]);
          break;
        }
      }
    }
    return result.slice(0, 2600);
  }, [street]);

  useLayoutEffect(() => {
    const dummy = new Object3D();
    positions.forEach(([north, east], index) => {
      dummy.position.set(north, 0.45, east);
      dummy.updateMatrix();
      mesh.current?.setMatrixAt(index, dummy.matrix);
    });
    if (mesh.current) mesh.current.instanceMatrix.needsUpdate = true;
  }, [positions]);

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, positions.length]} castShadow>
      <cylinderGeometry args={[0.07, 0.09, 0.9, 8]} />
      <meshStandardMaterial color="#4A1F18" roughness={0.55} metalness={0.2} />
    </instancedMesh>
  );
}

export function StreetFurniture({ street, style }: { street: StreetData; style: StreetStyle }) {
  return (
    <>
      <Trees street={street} style={style} />
      <Lamps street={street} style={style} />
      {street.quay ? <Bollards street={street} /> : null}
    </>
  );
}

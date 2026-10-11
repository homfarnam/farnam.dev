"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CatmullRomCurve3, Matrix4, Object3D, TubeGeometry, Vector3, type InstancedMesh, type MeshStandardMaterial } from "three";
import { chapters } from "@/data/chapters";
import { createGridFloorMaterial, typedShader } from "@/lib/shaders/materials";
import { HUB_RADIUS } from "@/lib/world/layout";
import { palette } from "@/lib/world/palette";
import { runtime } from "@/lib/world/runtime";

const RIB_STEP_DEG = 6;
const DOOR_GAP_DEG = 9;
/** The front of the lab stays open so the camera never looks through the wall. */
const OPEN_FRONT_DEG = 118;

/** Bearings (deg) of wall ribs, leaving gaps where doors stand. */
function ribBearings(): number[] {
  const doorBearings = chapters.filter((chapter) => chapter.id !== "awakening").map((chapter) => chapter.bearing);
  const bearings: number[] = [];
  for (let bearing = -180; bearing < 180; bearing += RIB_STEP_DEG) {
    const nearDoor = doorBearings.some((door) => Math.abs(door - bearing) < DOOR_GAP_DEG);
    if (!nearDoor && Math.abs(bearing) <= OPEN_FRONT_DEG) bearings.push(bearing);
  }
  return bearings;
}

/** Floor, wall ribs, light strips, ceiling ring and power cables of the hub. */
export function LabStructure() {
  const floorMaterial = useMemo(() => createGridFloorMaterial(palette.signal, HUB_RADIUS + 2), []);
  const ribs = useRef<InstancedMesh>(null);
  const strips = useRef<InstancedMesh>(null);
  const stripMaterial = useRef<MeshStandardMaterial>(null);
  const ceilingMaterial = useRef<MeshStandardMaterial>(null);
  const bearings = useMemo(ribBearings, []);

  useLayoutEffect(() => {
    const dummy = new Object3D();
    bearings.forEach((bearing, index) => {
      const radians = (bearing * Math.PI) / 180;
      const x = Math.sin(radians) * HUB_RADIUS;
      const z = -Math.cos(radians) * HUB_RADIUS;
      dummy.position.set(x, 3.6, z);
      dummy.rotation.set(0, -radians, 0);
      dummy.updateMatrix();
      ribs.current?.setMatrixAt(index, dummy.matrix);
      // Light strip sits on the inner face of each rib.
      const inset = new Matrix4().makeTranslation(0, 0, 0.26);
      strips.current?.setMatrixAt(index, dummy.matrix.clone().multiply(inset));
    });
    if (ribs.current) ribs.current.instanceMatrix.needsUpdate = true;
    if (strips.current) strips.current.instanceMatrix.needsUpdate = true;
  }, [bearings]);

  const cables = useMemo(() => {
    const routes: Vector3[][] = [
      [new Vector3(-1.4, 0.04, 0.4), new Vector3(-3, 0.04, 1.8), new Vector3(-5.2, 0.04, 2.2), new Vector3(-6.4, 0.04, 3.1)],
      [new Vector3(1.4, 0.04, -0.6), new Vector3(3.5, 0.04, -2.5), new Vector3(5.5, 0.04, -5.5), new Vector3(6.2, 0.04, -9.3)],
      [new Vector3(-1.2, 0.04, -0.9), new Vector3(-2.6, 0.04, -4), new Vector3(-4.2, 0.04, -7.5), new Vector3(-4.6, 0.04, -10.3)],
    ];
    return routes.map((points) => new TubeGeometry(new CatmullRomCurve3(points), 64, 0.05, 6, false));
  }, []);

  const cableMaterial = useMemo(
    () =>
      typedShader(
        { uTime: { value: 0 }, uPower: { value: 0 } },
        {
          vertexShader: /* glsl */ `
            varying vec2 vUv;
            void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
          `,
          fragmentShader: /* glsl */ `
            varying vec2 vUv;
            uniform float uTime;
            uniform float uPower;
            void main() {
              float pulse = smoothstep(0.92, 1.0, fract(vUv.x * 3.0 - uTime * 0.6));
              vec3 base = vec3(0.05, 0.07, 0.11);
              vec3 glow = vec3(0.13, 0.83, 0.93) * pulse * 2.5 * uPower;
              gl_FragColor = vec4(base + glow, 1.0);
            }
          `,
        },
      ),
    [],
  );

  useEffect(() => () => cables.forEach((geometry) => geometry.dispose()), [cables]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    floorMaterial.uniforms.uTime.value = time;
    floorMaterial.uniforms.uPower.value = runtime.power;
    // Boot pulse rolls outwards while power is climbing.
    floorMaterial.uniforms.uPulse.value = runtime.power < 0.999 ? runtime.power * 16 : 0;
    cableMaterial.uniforms.uTime.value = time;
    cableMaterial.uniforms.uPower.value = runtime.power;
    if (stripMaterial.current) stripMaterial.current.emissiveIntensity = runtime.power * (1.6 + runtime.overdrive * 4);
    if (ceilingMaterial.current) ceilingMaterial.current.emissiveIntensity = runtime.power * 1.4;
  });

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={floorMaterial} receiveShadow>
        <circleGeometry args={[HUB_RADIUS + 2, 96]} />
      </mesh>

      <instancedMesh ref={ribs} args={[undefined, undefined, bearings.length]} castShadow>
        <boxGeometry args={[0.38, 7.2, 0.5]} />
        <meshStandardMaterial color={palette.metal} metalness={0.7} roughness={0.5} />
      </instancedMesh>
      <instancedMesh ref={strips} args={[undefined, undefined, bearings.length]}>
        <boxGeometry args={[0.04, 5.6, 0.02]} />
        <meshStandardMaterial
          ref={stripMaterial}
          color="#000000"
          emissive={palette.signal}
          emissiveIntensity={0}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Ceiling ring and floor skirting */}
      <mesh position={[0, 7.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[HUB_RADIUS, 0.22, 8, 128]} />
        <meshStandardMaterial color={palette.metal} metalness={0.8} roughness={0.4} />
      </mesh>
      <mesh position={[0, 7.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[HUB_RADIUS - 0.35, 0.025, 6, 160]} />
        <meshStandardMaterial
          ref={ceilingMaterial}
          color="#000000"
          emissive={palette.cyan}
          emissiveIntensity={0}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[HUB_RADIUS - 0.3, HUB_RADIUS + 0.4, 128]} />
        <meshStandardMaterial color={palette.navy} metalness={0.6} roughness={0.6} />
      </mesh>

      {cables.map((geometry, index) => (
        <mesh key={index} geometry={geometry} material={cableMaterial} />
      ))}
    </group>
  );
}

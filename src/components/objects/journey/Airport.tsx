"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Text } from "@react-three/drei";
import { Object3D, type InstancedMesh, type Mesh, type MeshStandardMaterial } from "three";
import { FONT_DISPLAY, FONT_MONO } from "@/lib/world/fonts";
import {
  airportBearingLabel,
  AIRPORT_GEO,
  AIRPORT_HEIGHT,
  AIRPORT_RADIUS,
  AIRPORTS,
  LAND_Y,
  RUNWAY_AXIS,
  type AirportId,
} from "@/lib/world/journey";
import { palette } from "@/lib/world/palette";
import { runtime } from "@/lib/world/runtime";

type TroikaText = Mesh & { fillOpacity: number };

const RUNWAY_LENGTH = 7.2;
const RUNWAY_WIDTH = 0.42;
const EDGE_LIGHTS = 26;

/**
 * A miniature airport on its own plinth: runway with centreline and edge
 * lights, a taxiway to the apron, a glass terminal and a control tower.
 * Stylised (not survey data); the label carries the real name and distance.
 */
export function Airport({ id, cityName }: { id: AirportId; cityName: string }) {
  const layout = AIRPORTS[id];
  const info = AIRPORT_GEO[id];
  // Yaw that turns local +X onto the runway axis (R_y maps +X to (cos θ, 0, −sin θ)).
  const yaw = useMemo(() => Math.atan2(-RUNWAY_AXIS.z, RUNWAY_AXIS.x), []);

  const edgeLights = useRef<InstancedMesh>(null);
  const edgeMaterial = useRef<MeshStandardMaterial>(null);
  const centreMaterial = useRef<MeshStandardMaterial>(null);
  const terminalGlass = useRef<MeshStandardMaterial>(null);
  const towerCab = useRef<MeshStandardMaterial>(null);
  const label = useRef<TroikaText>(null);
  const sublabel = useRef<TroikaText>(null);

  useLayoutEffect(() => {
    const dummy = new Object3D();
    for (let index = 0; index < EDGE_LIGHTS; index += 1) {
      const side = index % 2 === 0 ? 1 : -1;
      const along = -RUNWAY_LENGTH / 2 + ((Math.floor(index / 2) + 0.5) / (EDGE_LIGHTS / 2)) * RUNWAY_LENGTH;
      dummy.position.set(along, 0.02, side * (RUNWAY_WIDTH / 2 + 0.03));
      dummy.updateMatrix();
      edgeLights.current?.setMatrixAt(index, dummy.matrix);
    }
    if (edgeLights.current) edgeLights.current.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const power = runtime.power;
    if (edgeMaterial.current) edgeMaterial.current.emissiveIntensity = 2.6 * power;
    // Centreline pulses towards the take-off direction, like approach lighting.
    if (centreMaterial.current) centreMaterial.current.emissiveIntensity = power * (1.4 + Math.sin(time * 3) * 0.4);
    if (terminalGlass.current) terminalGlass.current.emissiveIntensity = 1.4 * power;
    if (towerCab.current) towerCab.current.emissiveIntensity = power * (1.6 + Math.sin(time * 1.2) * 0.3);
    if (label.current) label.current.fillOpacity = power;
    if (sublabel.current) sublabel.current.fillOpacity = 0.7 * power;
  });

  const top = AIRPORT_HEIGHT;

  return (
    <group position={[layout.center.x, LAND_Y, layout.center.z]}>
      {/* Plinth */}
      <mesh position={[0, AIRPORT_HEIGHT / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[AIRPORT_RADIUS, AIRPORT_RADIUS + 0.18, AIRPORT_HEIGHT, 72]} />
        <meshStandardMaterial color="#0E131D" metalness={0.75} roughness={0.32} />
      </mesh>
      <mesh position={[0, top + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[AIRPORT_RADIUS - 0.05, 72]} />
        <meshStandardMaterial color="#1A2231" roughness={0.95} />
      </mesh>

      <group position={[0, top + 0.004, 0]} rotation={[0, yaw, 0]}>
        {/* Runway */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[RUNWAY_LENGTH, RUNWAY_WIDTH]} />
          <meshStandardMaterial color="#0B0E14" roughness={0.9} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
          <planeGeometry args={[RUNWAY_LENGTH - 0.4, 0.025]} />
          <meshStandardMaterial
            ref={centreMaterial}
            color="#000000"
            emissive="#F8FAFC"
            emissiveIntensity={0}
            toneMapped={false}
          />
        </mesh>
        {/* Threshold bars at both ends */}
        {[-1, 1].map((end) => (
          <mesh key={end} rotation={[-Math.PI / 2, 0, 0]} position={[end * (RUNWAY_LENGTH / 2 - 0.12), 0.003, 0]}>
            <planeGeometry args={[0.08, RUNWAY_WIDTH - 0.06]} />
            <meshStandardMaterial
              color="#000000"
              emissive={end < 0 ? "#22FF88" : "#FF3B3B"}
              emissiveIntensity={2}
              toneMapped={false}
            />
          </mesh>
        ))}
        <instancedMesh ref={edgeLights} args={[undefined, undefined, EDGE_LIGHTS]}>
          <sphereGeometry args={[0.022, 8, 8]} />
          <meshStandardMaterial ref={edgeMaterial} color="#000000" emissive="#FFD27A" emissiveIntensity={0} toneMapped={false} />
        </instancedMesh>

        {/* Taxiway and apron on the terminal side (+Z local) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0.95]}>
          <planeGeometry args={[RUNWAY_LENGTH - 0.6, 0.16]} />
          <meshStandardMaterial color="#121722" roughness={0.9} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 1.75]}>
          <planeGeometry args={[4.6, 0.95]} />
          <meshStandardMaterial color="#151B27" roughness={0.85} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0.95]}>
          <planeGeometry args={[RUNWAY_LENGTH - 0.6, 0.012]} />
          <meshStandardMaterial color="#000000" emissive="#F5C542" emissiveIntensity={1.2} toneMapped={false} />
        </mesh>

        {/* Terminal: long low hall with a glass front */}
        <mesh position={[0, 0.16, 2.55]} castShadow receiveShadow>
          <boxGeometry args={[4.2, 0.32, 0.6]} />
          <meshStandardMaterial color="#C9D2DE" metalness={0.4} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.14, 2.244]}>
          <planeGeometry args={[4.0, 0.16]} />
          <meshStandardMaterial
            ref={terminalGlass}
            color="#0B1220"
            emissive="#FFD9A0"
            emissiveIntensity={0}
            metalness={0.9}
            roughness={0.1}
            toneMapped={false}
          />
        </mesh>
        {/* Jet bridges */}
        {[-1.6, 1.6].map((x) => (
          <mesh key={x} position={[x, 0.1, 2.1]}>
            <boxGeometry args={[0.07, 0.07, 0.42]} />
            <meshStandardMaterial color="#AEB8C6" metalness={0.5} roughness={0.4} />
          </mesh>
        ))}

        {/* Control tower */}
        <group position={[2.7, 0, 2.9]}>
          <mesh position={[0, 0.6, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.12, 1.2, 16]} />
            <meshStandardMaterial color="#D3DAE4" metalness={0.3} roughness={0.4} />
          </mesh>
          <mesh position={[0, 1.27, 0]}>
            <cylinderGeometry args={[0.2, 0.15, 0.16, 16]} />
            <meshStandardMaterial
              ref={towerCab}
              color="#0B1220"
              emissive={palette.cyan}
              emissiveIntensity={0}
              toneMapped={false}
            />
          </mesh>
          <mesh position={[0, 1.39, 0]}>
            <cylinderGeometry args={[0.22, 0.22, 0.04, 16]} />
            <meshStandardMaterial color="#9AA6B6" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      </group>

      <pointLight position={[0, 2.4, 0]} color="#FFD9A0" intensity={14} distance={9} decay={1.6} />

      <Billboard position={[0, 3.2, 0]}>
        <Text
          ref={label}
          font={FONT_DISPLAY}
          fontSize={0.48}
          anchorX="center"
          anchorY="bottom"
          color={palette.ink}
          fillOpacity={0}
        >
          {`${info.name} · ${info.code}`}
        </Text>
        <Text
          ref={sublabel}
          font={FONT_MONO}
          position={[0, -0.12, 0]}
          fontSize={0.22}
          anchorX="center"
          anchorY="top"
          color={palette.mute}
          fillOpacity={0}
        >
          {`real airport: ${airportBearingLabel(id)} of ${cityName} · not to scale`}
        </Text>
      </Billboard>
    </group>
  );
}

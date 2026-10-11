"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Text } from "@react-three/drei";
import {
  EdgesGeometry,
  LatheGeometry,
  PlaneGeometry,
  Vector2,
  type LineBasicMaterial,
  type Mesh,
  type MeshStandardMaterial,
} from "three";
import { FONT_MONO } from "@/lib/world/fonts";
import { CITY_GEO, GEO } from "@/lib/world/geo";
import { LAND_Y, TEHRAN_CENTER } from "@/lib/world/journey";
import { palette } from "@/lib/world/palette";
import { runtime } from "@/lib/world/runtime";

type TroikaText = Mesh & { fillOpacity: number };

/** Milad Tower's real offset from the diorama centre (Tajrish). */
const MILAD = { lon: 51.3753, lat: 35.7448, heightMetres: 435 };
const DIORAMA_METRES = 850;

function offsetFromTajrish(lon: number, lat: number) {
  const north = (lat - CITY_GEO.tehran.lat) * 110540;
  const east = (lon - CITY_GEO.tehran.lon) * 111320 * Math.cos((CITY_GEO.tehran.lat * Math.PI) / 180);
  return { north, east, distanceKm: Math.hypot(north, east) / 1000, angle: Math.atan2(east, north) };
}

/** Lathe profile of the tower: shaft, the faceted pod, the mast. Units = metres. */
function miladProfile() {
  const points: [number, number][] = [
    [0, 0],
    [32, 0],
    [30, 8],
    [14, 30],
    [9, 60],
    [8, 230],
    [10, 245],
    [30, 252],
    [34, 262],
    [33, 286],
    [26, 300],
    [12, 306],
    [6, 312],
    [4, 330],
    [2.2, 435],
    [0, 435],
  ];
  return new LatheGeometry(
    points.map(([r, y]) => new Vector2(r, y)),
    32,
  );
}

/**
 * Tehran context outside the diorama: Milad Tower at its true bearing and at
 * diorama scale, and the Alborz wall to the north (a stylised silhouette,
 * not survey data — labelled as such in the credits).
 */
export function TehranLandmarks() {
  const scale = GEO.diorama.radius / DIORAMA_METRES;
  const milad = offsetFromTajrish(MILAD.lon, MILAD.lat);
  // True bearing, pulled in to sit just beyond the stop ring so it reads as "over there".
  const miladRadius = GEO.diorama.radius + 4.2;
  const miladPosition: [number, number, number] = [
    TEHRAN_CENTER.x + Math.cos(milad.angle) * miladRadius,
    LAND_Y,
    TEHRAN_CENTER.z + Math.sin(milad.angle) * miladRadius,
  ];

  const tower = useMemo(miladProfile, []);
  const towerLight = useRef<MeshStandardMaterial>(null);
  const label = useRef<TroikaText>(null);

  const ridge = useMemo(() => {
    const plane = new PlaneGeometry(24, 6, 36, 5);
    const position = plane.getAttribute("position");
    for (let index = 0; index < position.count; index += 1) {
      const x = position.getX(index);
      const y = position.getY(index);
      const peak = 2.6 + Math.sin(x * 0.31) * 1.3 + Math.sin(x * 0.83 + 2) * 0.6 + Math.sin(x * 2.1) * 0.25;
      const t = (y + 3) / 6;
      position.setY(index, t * peak * (1 - Math.abs(x) / 13.5));
      position.setZ(index, (1 - t) * 1.6);
    }
    plane.computeVertexNormals();
    return plane;
  }, []);
  const ridgeEdges = useMemo(() => new EdgesGeometry(ridge, 1), [ridge]);
  const ridgeLines = useRef<LineBasicMaterial>(null);
  const ridgeLabel = useRef<TroikaText>(null);

  useFrame((state) => {
    if (towerLight.current)
      towerLight.current.emissiveIntensity = runtime.power * (2.2 + Math.sin(state.clock.elapsedTime * 1.5) * 0.4);
    if (label.current) label.current.fillOpacity = 0.75 * runtime.power;
    if (ridgeLines.current) ridgeLines.current.opacity = 0.16 * runtime.power;
    if (ridgeLabel.current) ridgeLabel.current.fillOpacity = 0.45 * runtime.power;
  });

  return (
    <group>
      <group position={miladPosition} scale={scale}>
        <mesh geometry={tower} castShadow>
          <meshStandardMaterial color="#1E2636" metalness={0.6} roughness={0.35} />
        </mesh>
        <mesh position={[0, 268, 0]}>
          <cylinderGeometry args={[34.5, 34.5, 6, 32, 1, true]} />
          <meshStandardMaterial
            ref={towerLight}
            color="#000000"
            emissive={palette.cyan}
            emissiveIntensity={0}
            toneMapped={false}
          />
        </mesh>
      </group>
      <Billboard position={[miladPosition[0], LAND_Y + MILAD.heightMetres * scale + 0.5, miladPosition[2]]}>
        <Text ref={label} font={FONT_MONO} fontSize={0.2} anchorX="center" color={palette.ink} fillOpacity={0}>
          {`Milad Tower · ${milad.distanceKm.toFixed(1)} km`}
        </Text>
      </Billboard>

      {/* Alborz, rising to the north of Tajrish */}
      <group
        position={[TEHRAN_CENTER.x + GEO.diorama.radius + 5.5, LAND_Y - 0.05, TEHRAN_CENTER.z]}
        rotation={[0, -Math.PI / 2, 0]}
      >
        <mesh geometry={ridge}>
          <meshStandardMaterial color="#0A0E17" roughness={1} />
        </mesh>
        <lineSegments geometry={ridgeEdges}>
          <lineBasicMaterial ref={ridgeLines} color={palette.ember} transparent opacity={0} toneMapped={false} />
        </lineSegments>
        <Text
          ref={ridgeLabel}
          font={FONT_MONO}
          position={[0, 0.25, 2.2]}
          fontSize={0.32}
          letterSpacing={0.4}
          anchorX="center"
          color={palette.ember}
          fillOpacity={0}
        >
          ALBORZ
        </Text>
      </group>
    </group>
  );
}

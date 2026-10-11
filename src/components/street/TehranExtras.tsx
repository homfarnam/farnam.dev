"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Text } from "@react-three/drei";
import { BufferAttribute, BufferGeometry, Color, LatheGeometry, PlaneGeometry, Vector2, type Mesh } from "three";
import { typedShader } from "@/lib/shaders/materials";
import { FONT_MONO } from "@/lib/world/fonts";
import { palette } from "@/lib/world/palette";
import type { StreetData } from "@/lib/world/street";

type TroikaText = Mesh & { fillOpacity: number };

const JUB_WIDTH = 0.6;

/** Jubs: the open water channels that run beside Tehran's tree-lined avenues. */
function Jubs({ segments }: { segments: Float32Array }) {
  const { water, curbs } = useMemo(() => {
    const waterPositions: number[] = [];
    const curbPositions: number[] = [];
    for (let i = 0; i < segments.length; i += 4) {
      const [n1, e1, n2, e2] = [segments[i] ?? 0, segments[i + 1] ?? 0, segments[i + 2] ?? 0, segments[i + 3] ?? 0];
      const length = Math.hypot(n2 - n1, e2 - e1) || 1;
      const side: [number, number] = [(-(e2 - e1) / length) * (JUB_WIDTH / 2), ((n2 - n1) / length) * (JUB_WIDTH / 2)];
      const quad = (offset: number, width: number, y: number, out: number[]) => {
        const sn = side[0] * width;
        const se = side[1] * width;
        const on = side[0] * offset * 2;
        const oe = side[1] * offset * 2;
        const a = [n1 + on - sn, y, e1 + oe - se];
        const b = [n1 + on + sn, y, e1 + oe + se];
        const c = [n2 + on + sn, y, e2 + oe + se];
        const d = [n2 + on - sn, y, e2 + oe - se];
        out.push(...a, ...b, ...c, ...a, ...c, ...d);
      };
      quad(0, 1, 0.012, waterPositions);
      quad(1.15, 0.18, 0.06, curbPositions);
      quad(-1.15, 0.18, 0.06, curbPositions);
    }
    const make = (data: number[]) =>
      new BufferGeometry().setAttribute("position", new BufferAttribute(new Float32Array(data), 3));
    return { water: make(waterPositions), curbs: make(curbPositions) };
  }, [segments]);

  const waterMaterial = useMemo(
    () =>
      typedShader(
        { uTime: { value: 0 } },
        {
          vertexShader: /* glsl */ `
            varying vec3 vWorld;
            void main() { vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }
          `,
          fragmentShader: /* glsl */ `
            varying vec3 vWorld;
            uniform float uTime;
            void main() {
              float flow = sin((vWorld.x + vWorld.z) * 3.0 - uTime * 3.0) * 0.5 + 0.5;
              vec3 color = mix(vec3(0.03, 0.06, 0.08), vec3(0.16, 0.24, 0.3), flow * 0.35);
              gl_FragColor = vec4(color, 1.0);
            }
          `,
          side: 2,
        },
      ),
    [],
  );

  useEffect(
    () => () => {
      water.dispose();
      curbs.dispose();
      waterMaterial.dispose();
    },
    [water, curbs, waterMaterial],
  );
  useFrame((state) => {
    waterMaterial.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <>
      <mesh geometry={water} material={waterMaterial} />
      <mesh geometry={curbs} receiveShadow>
        <meshStandardMaterial color="#B8B2A6" roughness={0.8} side={2} />
      </mesh>
    </>
  );
}

/**
 * Imamzadeh Saleh: a stylised tiled dome on a drum with two minarets, placed
 * on the shrine's real OSM footprint. Not a survey model — labelled as such.
 */
function Shrine({ north, east, radius }: { north: number; east: number; radius: number }) {
  const label = useRef<TroikaText>(null);
  const domeRadius = Math.min(Math.max(radius * 0.45, 6), 10);
  const drumHeight = 9;
  const dome = useMemo(() => {
    const points: Vector2[] = [];
    for (let i = 0; i <= 24; i += 1) {
      const t = i / 24;
      // Slightly pointed Persian profile: bulb then a tapering tip.
      const angle = t * Math.PI * 0.5;
      const r = domeRadius * Math.cos(angle) * (1 + 0.08 * Math.sin(t * Math.PI));
      const y = domeRadius * 1.25 * Math.sin(angle) + (t > 0.85 ? (t - 0.85) * domeRadius * 1.4 : 0);
      points.push(new Vector2(Math.max(r, 0.05), y));
    }
    return new LatheGeometry(points, 48);
  }, [domeRadius]);
  const tileMaterial = useMemo(
    () =>
      typedShader(
        { uBase: { value: new Color("#1F7C8C") }, uGold: { value: new Color("#E3B95A") } },
        {
          vertexShader: /* glsl */ `
            varying vec3 vPos;
            varying vec3 vNormalW;
            varying vec3 vWorld;
            void main() {
              vPos = position;
              vNormalW = normalize(mat3(modelMatrix) * normal);
              vec4 w = modelMatrix * vec4(position, 1.0);
              vWorld = w.xyz;
              gl_Position = projectionMatrix * viewMatrix * w;
            }
          `,
          fragmentShader: /* glsl */ `
            varying vec3 vPos;
            varying vec3 vNormalW;
            varying vec3 vWorld;
            uniform vec3 uBase;
            uniform vec3 uGold;
            void main() {
              float angle = atan(vPos.z, vPos.x);
              // Arabesque-like banding: radial ribs and rings of gold on turquoise tile.
              float ribs = smoothstep(0.85, 1.0, abs(sin(angle * 12.0)));
              float rings = smoothstep(0.9, 1.0, abs(sin(vPos.y * 2.2)));
              float pattern = max(ribs * 0.6, rings * 0.8);
              vec3 color = mix(uBase, uGold, pattern);
              vec3 view = normalize(cameraPosition - vWorld);
              float rim = pow(1.0 - max(dot(view, normalize(vNormalW)), 0.0), 2.5);
              float light = 0.45 + 0.55 * max(dot(normalize(vNormalW), normalize(vec3(-0.3, 0.8, 0.4))), 0.0);
              gl_FragColor = vec4(color * light * 0.9 + rim * vec3(0.35, 0.55, 0.65), 1.0);
            }
          `,
        },
      ),
    [],
  );

  useEffect(
    () => () => {
      dome.dispose();
      tileMaterial.dispose();
    },
    [dome, tileMaterial],
  );
  useFrame(() => {
    if (label.current) label.current.fillOpacity = 0.85;
  });

  const minaretOffset = domeRadius + 5;
  return (
    <group position={[north, 0, east]}>
      <mesh position={[0, drumHeight / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[domeRadius * 1.02, domeRadius * 1.08, drumHeight, 48]} />
        <meshStandardMaterial color="#D9CDB4" roughness={0.75} />
      </mesh>
      <mesh position={[0, drumHeight, 0]} geometry={dome} material={tileMaterial} castShadow />
      <mesh position={[0, drumHeight + domeRadius * 1.45, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 2.4, 8]} />
        <meshStandardMaterial color="#E3B95A" metalness={0.8} roughness={0.25} emissive="#E3B95A" emissiveIntensity={0.4} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side} position={[0, 0, side * minaretOffset]}>
          <mesh position={[0, 14, 0]} castShadow>
            <cylinderGeometry args={[0.95, 1.15, 28, 16]} />
            <meshStandardMaterial color="#1F7C8C" roughness={0.5} />
          </mesh>
          <mesh position={[0, 24, 0]}>
            <cylinderGeometry args={[1.6, 1.1, 1.2, 16]} />
            <meshStandardMaterial color="#E3B95A" roughness={0.4} emissive="#FFD27A" emissiveIntensity={0.9} />
          </mesh>
          <mesh position={[0, 29.5, 0]}>
            <coneGeometry args={[0.95, 3.2, 16]} />
            <meshStandardMaterial color="#E3B95A" metalness={0.7} roughness={0.3} />
          </mesh>
          <pointLight position={[0, 24, 0]} color="#FFD27A" intensity={30} distance={22} decay={1.6} />
        </group>
      ))}
      <pointLight position={[0, drumHeight + 4, domeRadius + 6]} color="#7FE3F0" intensity={40} distance={30} decay={1.5} />
      <Billboard position={[0, drumHeight + domeRadius * 1.6 + 4, 0]}>
        <Text ref={label} font={FONT_MONO} fontSize={1.1} anchorX="center" color={palette.ink} fillOpacity={0}>
          Imamzadeh Saleh · stylised
        </Text>
      </Billboard>
    </group>
  );
}

/**
 * The Alborz: Tajrish sits at the foot of the range, so the mountains fill the
 * northern sky. A distant procedural ridge with snow above the treeline and the
 * last pink light of dusk on the peaks. Not terrain data — a backdrop.
 */
function Alborz() {
  const geometry = useMemo(() => {
    // Columns along the range, rows from the foothills up to the ridge line.
    const columns = 260;
    const rows = 14;
    const plane = new PlaneGeometry(2600, 1, columns, rows);
    const position = plane.getAttribute("position");
    const relative = new Float32Array(position.count);
    for (let index = 0; index < position.count; index += 1) {
      const x = position.getX(index);
      const row = Math.round((position.getY(index) + 0.5) * rows) / rows; // 0 = bottom, 1 = ridge
      const ridge =
        150 +
        Math.sin(x * 0.004 + 1.2) * 45 +
        Math.sin(x * 0.012 + 0.4) * 26 +
        Math.abs(Math.sin(x * 0.033)) * 18 +
        Math.max(0, 1 - Math.abs(x - 140) / 480) * 85; // Tochal massif, a little east
      // Foothills bulge forward a little so the face isn't a flat wall.
      position.setY(index, -30 + (ridge + 30) * row);
      position.setZ(index, (1 - row) * 60 + Math.sin(x * 0.02) * 8 * (1 - row));
      relative[index] = row;
    }
    plane.setAttribute("aRow", new BufferAttribute(relative, 1));
    plane.computeVertexNormals();
    return plane;
  }, []);
  const material = useMemo(
    () =>
      typedShader(
        {
          uSnow: { value: new Color("#E7DCE8") },
          uRock: { value: new Color("#232436") },
          uGlow: { value: new Color("#FF9E8A") },
        },
        {
          vertexShader: /* glsl */ `
            attribute float aRow;
            varying float vRow;
            varying float vX;
            void main() {
              vRow = aRow;
              vX = position.x;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: /* glsl */ `
            varying float vRow;
            varying float vX;
            uniform vec3 uSnow;
            uniform vec3 uRock;
            uniform vec3 uGlow;
            void main() {
              // Snow only on the upper slopes, with a ragged snowline; dusk light on the top.
              float snowline = 0.72 + 0.08 * sin(vX * 0.05) + 0.05 * sin(vX * 0.17);
              float snow = smoothstep(snowline, snowline + 0.06, vRow);
              float gullies = 0.85 + 0.15 * sin(vX * 0.4 + vRow * 9.0);
              vec3 rock = uRock * gullies;
              vec3 color = mix(rock, uSnow * 0.72 + uGlow * 0.16 * vRow, snow);
              // Haze thickens towards the foothills (and the city glow).
              color = mix(color, vec3(0.12, 0.13, 0.22), (1.0 - vRow) * 0.65);
              gl_FragColor = vec4(color, 1.0);
            }
          `,
          fog: false,
          depthWrite: false,
          side: 2,
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
  // North is +x; the range faces south towards the walker, just beyond the walk area.
  return (
    <mesh geometry={geometry} material={material} position={[540, 0, 0]} rotation={[0, -Math.PI / 2, 0]} renderOrder={-0.5} />
  );
}

export function TehranExtras({ street }: { street: StreetData }) {
  const shrines = useMemo(() => {
    const result: { north: number; east: number; radius: number }[] = [];
    const data = street.landmarks;
    if (!data) return result;
    for (let i = 0; i < data.length; i += 4) {
      const north = data[i] ?? 0;
      const east = data[i + 1] ?? 0;
      // OSM can map the same shrine twice (outline + point); keep one per site.
      const duplicate = result.some((shrine) => Math.hypot(shrine.north - north, shrine.east - east) < 60);
      if ((data[i + 3] ?? 0) > 0.5 && !duplicate) result.push({ north, east, radius: data[i + 2] ?? 10 });
    }
    return result;
  }, [street]);
  return (
    <>
      {street.jubs ? <Jubs segments={street.jubs} /> : null}
      {shrines.map((shrine) => (
        <Shrine key={`${shrine.north}-${shrine.east}`} {...shrine} />
      ))}
      <Alborz />
    </>
  );
}

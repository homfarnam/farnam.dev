"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DataTexture,
  LinearFilter,
  NearestFilter,
  RedFormat,
  type DirectionalLight,
  type Object3D,
} from "three";
import { Environment, Lightformer, useTexture } from "@react-three/drei";
import { DuskSky } from "@/components/objects/journey/DuskSky";
import { typedShader } from "@/lib/shaders/materials";
import { useBakedBuildings } from "@/lib/world/bakedBuildings";
import { runtime } from "@/lib/world/runtime";
import {
  QUAY_DEPTH,
  STREET_ORIGIN,
  STREET_STYLES,
  useStreetData,
  WATER_LEVEL,
  type StreetData,
  type StreetId,
  type StreetStyle,
} from "@/lib/world/street";
import { useExperience } from "@/stores/experienceStore";
import { createFacadeMaterial, createGroundMaterial, prepareTextures, type StreetTextures } from "./materials";
import { StreetFurniture } from "./StreetFurniture";
import { TehranExtras } from "./TehranExtras";
import { WalkControls } from "./WalkControls";

function maskTexture(data: Uint8Array, size: number, nearest = false) {
  // Masks are 0/1; scale to 0/255 for a normalized red channel.
  const bytes = Uint8Array.from(data, (value) => value * 255);
  const texture = new DataTexture(bytes, size, size, RedFormat);
  texture.magFilter = nearest ? NearestFilter : LinearFilter;
  texture.minFilter = nearest ? NearestFilter : LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

/** Quay walls: each water-edge segment extruded from street level down below the waterline. */
function createQuayGeometry(quay: Float32Array) {
  const positions: number[] = [];
  const seeds: number[] = [];
  for (let i = 0; i < quay.length; i += 4) {
    const [n1, e1, n2, e2] = [quay[i] ?? 0, quay[i + 1] ?? 0, quay[i + 2] ?? 0, quay[i + 3] ?? 0];
    positions.push(n1, 0, e1, n2, 0, e2, n2, QUAY_DEPTH, e2, n1, 0, e1, n2, QUAY_DEPTH, e2, n1, QUAY_DEPTH, e1);
    seeds.push(0.4, 0.4, 0.4, 0.4, 0.4, 0.4);
  }
  const geometry = new BufferGeometry().setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
  // Quay walls reuse the facade shader (brick, no windows below street level).
  geometry.setAttribute("aSeed", new BufferAttribute(new Float32Array(seeds), 1));
  geometry.computeVertexNormals();
  return geometry;
}

function Moon({ color }: { color: string }) {
  const light = useRef<DirectionalLight>(null);
  const target = useRef<Object3D>(null);
  const quality = useExperience((state) => state.quality);
  useFrame(() => {
    if (!light.current || !target.current) return;
    // Keep the shadow camera centred on the walker.
    const p = runtime.streetPlayer;
    target.current.position.set(p.x, 0, p.z);
    light.current.position.set(p.x + 40, 70, p.z + 25);
    light.current.target = target.current;
  });
  return (
    <>
      <object3D ref={target} />
      <directionalLight
        ref={light}
        color={color}
        intensity={1.1}
        castShadow={quality === "high"}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.04}
        shadow-camera-left={-45}
        shadow-camera-right={45}
        shadow-camera-top={45}
        shadow-camera-bottom={-45}
        shadow-camera-near={1}
        shadow-camera-far={160}
      />
    </>
  );
}

function Canals({ street, textures, style }: { street: StreetData; textures: StreetTextures; style: StreetStyle }) {
  const quay = useMemo(() => (street.quay ? createQuayGeometry(street.quay) : null), [street]);
  const quayMaterial = useMemo(() => {
    const material = createFacadeMaterial(textures, style, "quay");
    material.side = 2;
    return material;
  }, [textures, style]);
  const waterMaterial = useMemo(
    () =>
      typedShader(
        { uTime: { value: 0 }, uDeep: { value: new Color("#06111F") }, uSky: { value: new Color("#29406E") } },
        {
          vertexShader: /* glsl */ `
            varying vec3 vWorld;
            void main() { vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }
          `,
          fragmentShader: /* glsl */ `
            varying vec3 vWorld;
            uniform float uTime;
            uniform vec3 uDeep;
            uniform vec3 uSky;
            void main() {
              vec3 view = normalize(cameraPosition - vWorld);
              vec2 p = vWorld.xz;
              float ripple = sin(p.x * 1.7 + uTime * 0.9) * sin(p.y * 1.3 - uTime * 0.7) * 0.5 + 0.5;
              float fresnel = pow(1.0 - max(view.y, 0.0), 3.0);
              vec3 color = mix(uDeep, uSky, fresnel * 0.85) + ripple * 0.015;
              gl_FragColor = vec4(color, 1.0);
            }
          `,
        },
      ),
    [],
  );
  useEffect(
    () => () => {
      quay?.dispose();
      quayMaterial.dispose();
      waterMaterial.dispose();
    },
    [quay, quayMaterial, waterMaterial],
  );
  useFrame((state) => {
    waterMaterial.uniforms.uTime.value = state.clock.elapsedTime;
  });
  const { radius } = street.header;
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, WATER_LEVEL, 0]} material={waterMaterial}>
        <planeGeometry args={[2 * radius, 2 * radius]} />
      </mesh>
      {quay ? <mesh geometry={quay} material={quayMaterial} receiveShadow castShadow /> : null}
    </>
  );
}

function StreetWorld({ street, style }: { street: StreetData; style: StreetStyle }) {
  const indexed = useBakedBuildings(`/geo/street/${style.id}.glb`);
  // Facades need exact per-face normals (see materials.ts); split shared vertices once.
  const buildings = useMemo(() => {
    const flat = indexed.toNonIndexed();
    flat.computeVertexNormals();
    return flat;
  }, [indexed]);
  const { radius, size } = street.header;

  const masks = useMemo(
    () => ({
      water: street.water ? maskTexture(street.water, size) : undefined,
      bridge: street.bridge ? maskTexture(street.bridge, size, true) : undefined,
      road: street.road ? maskTexture(street.road, size) : undefined,
    }),
    [street, size],
  );

  const loaded = useTexture(style.textures as unknown as Record<string, string>) as unknown as StreetTextures;
  const surfaces = useMemo(() => prepareTextures(loaded), [loaded]);
  const buildingMaterial = useMemo(() => createFacadeMaterial(surfaces, style), [surfaces, style]);
  const groundMaterial = useMemo(
    () => createGroundMaterial(surfaces, masks, radius, style.city === "tehran" ? "#9A948C" : "#7A6E68"),
    [surfaces, masks, radius, style.city],
  );

  useEffect(
    () => () => {
      buildings.dispose();
      indexed.dispose();
      Object.values(masks).forEach((texture) => texture?.dispose());
      buildingMaterial.dispose();
      groundMaterial.dispose();
    },
    [buildings, masks, buildingMaterial, groundMaterial],
  );

  const tehran = style.city === "tehran";

  return (
    <group position={STREET_ORIGIN}>
      <DuskSky center={[0, 0, 0]} radius={650} />
      {/* Procedural reflections for glass and wet stone — no HDRI file. */}
      {/* Image-based light also shades surfaces: a cool blue hour for the canals, a warm sodium-lit
          dusk for Tehran's stone. */}
      <Environment resolution={128} frames={1}>
        <Lightformer
          form="rect"
          intensity={tehran ? 0.9 : 1.4}
          color={tehran ? "#8E8478" : "#5A74B8"}
          position={[0, 8, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[30, 30, 1]}
        />
        <Lightformer
          form="rect"
          intensity={2.2}
          color={tehran ? "#D88A4E" : "#C9683A"}
          position={[0, 2, -20]}
          scale={[40, 4, 1]}
        />
        <Lightformer
          form="rect"
          intensity={tehran ? 1.6 : 1.2}
          color="#FFB86B"
          position={[12, 3, 6]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[10, 3, 1]}
        />
      </Environment>
      <hemisphereLight args={tehran ? ["#B4A48E", "#5A4632", 0.95] : ["#6A82C4", "#2A2220", 0.75]} />
      <Moon color={tehran ? "#E2D6C4" : "#AFC6FF"} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} material={groundMaterial} receiveShadow>
        <planeGeometry args={[2 * radius, 2 * radius]} />
      </mesh>
      {street.water ? <Canals street={street} textures={surfaces} style={style} /> : null}
      <mesh geometry={buildings} material={buildingMaterial} castShadow receiveShadow />
      <StreetFurniture street={street} style={style} />
      {tehran ? <TehranExtras street={street} /> : null}

      <WalkControls street={street} />
    </group>
  );
}

/** Chapter 02 street walk at eye level: Herengracht (Amsterdam) or Tajrish (Tehran). */
export function StreetScene() {
  const id = useExperience((state) => state.walkStreet) as StreetId;
  const style = STREET_STYLES[id];
  const street = useStreetData(id);
  return <StreetWorld key={id} street={street} style={style} />;
}

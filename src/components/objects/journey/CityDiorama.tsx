"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Text } from "@react-three/drei";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DataTexture,
  LinearFilter,
  MeshStandardMaterial,
  RedFormat,
  Vector3,
  type Group,
  type Mesh,
} from "three";
import { journeyStops } from "@/data/journey";
import { typedShader } from "@/lib/shaders/materials";
import { useBakedBuildings } from "@/lib/world/bakedBuildings";
import { FONT_DISPLAY, FONT_MONO } from "@/lib/world/fonts";
import { parseContainer, useGeoBinary, type CityHeader } from "@/lib/world/geoData";
import { LAND_Y, PLINTH_HEIGHT, PLINTH_RADIUS } from "@/lib/world/journey";
import { palette } from "@/lib/world/palette";
import { runtime } from "@/lib/world/runtime";
import { useExperience } from "@/stores/experienceStore";

type TroikaText = Mesh & { fillOpacity: number };

interface CityDioramaProps {
  id: "tehran" | "amsterdam";
  center: Vector3;
  label: string;
  /** Big floating name, readable from the map overview. */
  title: string;
  subtitle: string;
  /** Window light colour. */
  windows: string;
  /** Street light colour. */
  streets: string;
  /**
   * Buildings from OSM extrusions (baked into the city .bin) or from measured
   * 3D BAG models (a meshopt-compressed .glb). 3D BAG cities can also expand
   * beyond the plinth when the story arrives there.
   */
  buildings: "osm" | "3dbag";
}

/** Shared, per-frame values the building/ground/road shaders read. */
interface RevealUniforms {
  uReveal: { value: number };
  uPower: { value: number };
}

/**
 * Building material: physically based (moonlight, shadows, reflections) with
 * lit windows in the emissive term, plus a radial reveal: buildings farther
 * than `uReveal` from the centre are hidden, and rise as the front passes them.
 */
function createBuildingMaterial(windowColor: string, shared: RevealUniforms) {
  const material = new MeshStandardMaterial({ color: "#3A4458", roughness: 0.74, metalness: 0.08, flatShading: true });
  // onBeforeCompile only runs when a program is first built: a per-colour key gives each city its own.
  material.customProgramCacheKey = () => `city-building-${windowColor}`;
  const uniforms = { uWindow: { value: new Color(windowColor) }, uFloor: { value: 0.06 }, ...shared };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nattribute float aSeed;\nattribute float aRadius;\nuniform float uReveal;\nvarying float vSeed;\nvarying float vRise;\nvarying vec3 vObj;",
      )
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvSeed = aSeed;\nvObj = position;\nvRise = clamp((uReveal - aRadius) / 1.2, 0.0, 1.0);\ntransformed.y *= vRise * vRise * (3.0 - 2.0 * vRise);",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform vec3 uWindow;\nuniform float uPower;\nuniform float uFloor;\nvarying float vSeed;\nvarying float vRise;\nvarying vec3 vObj;\nfloat wHash(vec2 p){return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5);}",
      )
      .replace("void main() {", "void main() {\n  if (vRise <= 0.001) discard;")
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        {
          vec3 objNormal = normalize(cross(dFdx(vObj), dFdy(vObj)));
          float wall = 1.0 - step(0.6, abs(objNormal.y));
          float along = abs(objNormal.x) > abs(objNormal.z) ? vObj.z : vObj.x;
          vec2 grid = vec2(along / (uFloor * 0.8), vObj.y / uFloor);
          vec2 cell = fract(grid);
          float pane = step(0.25, cell.x) * step(cell.x, 0.75) * step(0.3, cell.y) * step(cell.y, 0.8);
          float seedId = floor(vSeed * 255.0 + 0.5);
          float lit = step(0.42, wHash(floor(grid) + seedId * vec2(0.41, 0.67))) * step(0.12, seedId / 255.0);
          float groundFloor = step(uFloor * 0.9, vObj.y);
          totalEmissiveRadiance += uWindow * pane * lit * wall * groundFloor * 1.6 * uPower * vRise;
        }`,
      );
  };
  return material;
}

/** Measured 3D BAG buildings, decoded from a meshopt glTF and flattened into one geometry. */
function BagBuildings({ url, material }: { url: string; material: MeshStandardMaterial }) {
  const geometry = useBakedBuildings(url);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} material={material} castShadow receiveShadow />;
}

export function CityDiorama({ id, center, label, title, subtitle, windows, streets, buildings }: CityDioramaProps) {
  const quality = useExperience((state) => state.quality);
  const data = useGeoBinary(`/geo/${id}.bin`);
  const parsed = useMemo(() => {
    const container = parseContainer<CityHeader>(data);
    const { quant, waterSize } = container.header;
    let osmBuildings: BufferGeometry | null = null;
    const position16 = container.get("position", "Int16Array");
    if (position16.length) {
      const positions = new Float32Array(position16.length);
      const radii = new Float32Array(position16.length / 3);
      for (let index = 0; index < position16.length; index += 1) positions[index] = (position16[index] ?? 0) / quant;
      for (let index = 0; index < radii.length; index += 1) {
        radii[index] = Math.hypot(positions[index * 3] ?? 0, positions[index * 3 + 2] ?? 0);
      }
      osmBuildings = new BufferGeometry();
      osmBuildings.setAttribute("position", new BufferAttribute(positions, 3));
      osmBuildings.setAttribute(
        "aSeed",
        new BufferAttribute(
          Float32Array.from(container.get("seed", "Uint8Array"), (v) => v / 255),
          1,
        ),
      );
      osmBuildings.setAttribute("aRadius", new BufferAttribute(radii, 1));
      osmBuildings.setIndex(new BufferAttribute(container.get("index", "Uint32Array"), 1));
      osmBuildings.computeBoundingSphere();
    }

    const roads2d = container.get("roads", "Float32Array");
    const roadPositions = new Float32Array((roads2d.length / 2) * 3);
    for (let index = 0; index < roads2d.length / 2; index += 1) {
      roadPositions[index * 3] = roads2d[index * 2] ?? 0;
      roadPositions[index * 3 + 1] = 0.006;
      roadPositions[index * 3 + 2] = roads2d[index * 2 + 1] ?? 0;
    }
    const roads = new BufferGeometry().setAttribute("position", new BufferAttribute(roadPositions, 3));

    const water = new DataTexture(container.get("water", "Uint8Array"), waterSize, waterSize, RedFormat);
    water.magFilter = LinearFilter;
    water.minFilter = LinearFilter;
    water.needsUpdate = true;
    return { header: container.header, osmBuildings, roads, water };
  }, [data]);

  /** Baked extent of real city (units). Larger than the plinth for expandable cities. */
  const R = parsed.header.radius;
  const expandable = buildings === "3dbag" && R > PLINTH_RADIUS + 0.5;
  // Plinth-sized reveal for expandable cities; non-expandable cities simply show everything.
  const baseReveal = expandable ? PLINTH_RADIUS - 0.35 : R + 2;
  const shared = useMemo<RevealUniforms>(() => ({ uReveal: { value: baseReveal }, uPower: { value: 0 } }), [baseReveal]);
  const buildingMaterial = useMemo(() => createBuildingMaterial(windows, shared), [windows, shared]);

  const groundMaterial = useMemo(
    () =>
      typedShader(
        {
          uWater: { value: parsed.water },
          uRadius: { value: R },
          uTime: { value: 0 },
          uWaterColor: { value: new Color("#0E3358") },
          ...shared,
        },
        {
          vertexShader: /* glsl */ `
            varying vec2 vPos;
            void main() { vPos = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
          `,
          fragmentShader: /* glsl */ `
            varying vec2 vPos;
            uniform sampler2D uWater;
            uniform float uRadius;
            uniform float uReveal;
            uniform float uTime;
            uniform float uPower;
            uniform vec3 uWaterColor;
            void main() {
              float dist = length(vPos);
              if (dist > uReveal) discard;
              // Disc lies flat: plane x = north, plane y = -east.
              float north = vPos.x;
              float east = -vPos.y;
              vec2 uv = vec2((east + uRadius) / (2.0 * uRadius), (north + uRadius) / (2.0 * uRadius));
              float water = texture2D(uWater, uv).r;
              float ripple = 0.75 + 0.25 * sin(east * 9.0 + uTime * 1.3) * sin(north * 7.0 - uTime * 0.9);
              vec3 ground = vec3(0.03, 0.035, 0.046);
              vec3 color = mix(ground, uWaterColor * ripple, water);
              float rim = smoothstep(uReveal - 0.6, uReveal, dist);
              gl_FragColor = vec4(color * (0.35 + 0.65 * uPower) * (1.0 - rim * 0.7), 1.0);
            }
          `,
        },
      ),
    [parsed.water, R, shared],
  );

  const roadMaterial = useMemo(
    () =>
      typedShader(
        { uColor: { value: new Color(streets) }, ...shared },
        {
          vertexShader: /* glsl */ `
            varying vec2 vPos;
            void main() { vPos = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
          `,
          fragmentShader: /* glsl */ `
            varying vec2 vPos;
            uniform vec3 uColor;
            uniform float uReveal;
            uniform float uPower;
            void main() {
              float dist = length(vPos);
              if (dist > uReveal) discard;
              gl_FragColor = vec4(uColor * 1.3, uPower * (1.0 - smoothstep(uReveal - 0.8, uReveal, dist) * 0.8));
            }
          `,
          transparent: true,
          depthWrite: false,
          blending: AdditiveBlending,
          toneMapped: false,
        },
      ),
    [streets, shared],
  );

  const root = useRef<Group>(null);
  const plinth = useRef<Group>(null);
  const city = useRef<Group>(null);
  const expansion = useRef(0);
  const worldCenter = useRef(new Vector3());
  const rimMaterial = useRef<MeshStandardMaterial>(null);
  const caption = useRef<TroikaText>(null);
  const bigTitle = useRef<TroikaText>(null);
  const bigSubtitle = useRef<TroikaText>(null);

  useEffect(
    () => () => {
      parsed.osmBuildings?.dispose();
      parsed.roads.dispose();
      parsed.water.dispose();
      buildingMaterial.dispose();
      groundMaterial.dispose();
      roadMaterial.dispose();
    },
    [parsed, buildingMaterial, groundMaterial, roadMaterial],
  );

  useFrame((state, delta) => {
    root.current?.getWorldPosition(worldCenter.current);

    // Expand when the story is in this city, or when free look flies over it.
    let want = 0;
    if (expandable) {
      const { chapter, journeyStop, journeyExplore, travellingTo, reducedMotion } = useExperience.getState();
      if (chapter === "journey" && !travellingTo) {
        const stop = journeyStop === null ? null : journeyStops[journeyStop];
        if (stop?.region === id) want = 1;
        if (journeyExplore && runtime.cameraTarget.distanceTo(worldCenter.current) < R + 6) want = 1;
      }
      expansion.current = reducedMotion ? want : expansion.current + (want - expansion.current) * Math.min(1, delta * 0.7);
    }
    const e = expansion.current;
    const eased = e * e * (3 - 2 * e);

    // The plinth sinks into the land while the city spreads out to its full baked radius.
    if (plinth.current) plinth.current.position.y = -eased * (PLINTH_HEIGHT + 0.25);
    if (city.current) city.current.position.y = PLINTH_HEIGHT * (1 - eased) + 0.03 * eased;
    shared.uReveal.value = baseReveal + (R - baseReveal) * eased;
    shared.uPower.value = runtime.power;

    groundMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    if (rimMaterial.current) rimMaterial.current.emissiveIntensity = 1.2 * runtime.power * (1 - eased);
    if (caption.current) caption.current.fillOpacity = 0.7 * runtime.power * (1 - eased);
    // City names stay readable from afar but fade when the camera is close.
    const distance = state.camera.position.distanceTo(worldCenter.current);
    const far = Math.min(1, Math.max(0, (distance - 14) / 12));
    if (bigTitle.current) bigTitle.current.fillOpacity = far * runtime.power;
    if (bigSubtitle.current) bigSubtitle.current.fillOpacity = far * 0.7 * runtime.power;
  });

  const bagUrl = quality === "low" ? "/geo/amsterdam-3dbag-lite.glb" : "/geo/amsterdam-3dbag.glb";

  return (
    <group ref={root} position={[center.x, LAND_Y, center.z]}>
      {/* Museum plinth */}
      <group ref={plinth}>
        <mesh position={[0, PLINTH_HEIGHT / 2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[PLINTH_RADIUS, PLINTH_RADIUS + 0.25, PLINTH_HEIGHT, 96]} />
          <meshStandardMaterial color="#0E131D" metalness={0.75} roughness={0.32} />
        </mesh>
        <mesh position={[0, PLINTH_HEIGHT + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[PLINTH_RADIUS - 0.04, PLINTH_RADIUS, 128]} />
          <meshStandardMaterial
            ref={rimMaterial}
            color="#000000"
            emissive={palette.signal}
            emissiveIntensity={0}
            toneMapped={false}
          />
        </mesh>
      </group>

      <group ref={city} position={[0, PLINTH_HEIGHT, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} material={groundMaterial} receiveShadow>
          <circleGeometry args={[R, 160]} />
        </mesh>
        <lineSegments geometry={parsed.roads} material={roadMaterial} />
        {buildings === "3dbag" ? (
          <Suspense fallback={null}>
            <BagBuildings url={bagUrl} material={buildingMaterial} />
          </Suspense>
        ) : parsed.osmBuildings ? (
          <mesh geometry={parsed.osmBuildings} material={buildingMaterial} castShadow receiveShadow />
        ) : null}
      </group>

      {/* A pool of city light above the plinth */}
      <pointLight position={[0, 5, 0]} color={windows} intensity={45} distance={expandable ? 34 : 22} decay={1.7} />

      <Billboard position={[0, 7.5, 0]}>
        <Text
          ref={bigTitle}
          font={FONT_DISPLAY}
          fontSize={1.6}
          letterSpacing={0.18}
          anchorX="center"
          anchorY="bottom"
          color={palette.ink}
          fillOpacity={0}
        >
          {title}
        </Text>
        <Text
          ref={bigSubtitle}
          font={FONT_MONO}
          position={[0, -0.25, 0]}
          fontSize={0.42}
          anchorX="center"
          anchorY="top"
          color={windows}
          fillOpacity={0}
        >
          {subtitle}
        </Text>
      </Billboard>

      <Text
        ref={caption}
        font={FONT_MONO}
        position={[-(PLINTH_RADIUS + 0.12), PLINTH_HEIGHT * 0.5, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        fontSize={0.2}
        letterSpacing={0.18}
        anchorX="center"
        anchorY="middle"
        color={palette.ink}
        fillOpacity={0}
      >
        {label}
      </Text>
    </group>
  );
}

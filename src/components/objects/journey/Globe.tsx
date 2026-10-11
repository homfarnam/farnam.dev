"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { Billboard, Text } from "@react-three/drei";
import gsap from "gsap";
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  ExtrudeGeometry,
  Matrix3,
  Matrix4,
  Quaternion,
  Shape,
  TextureLoader,
  TubeGeometry,
  Vector3,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
} from "three";
import { typedShader } from "@/lib/shaders/materials";
import { FONT_DISPLAY, FONT_LIGHT, FONT_MONO } from "@/lib/world/fonts";
import { GEO, greatCircle } from "@/lib/world/geo";
import {
  AIRPORT_LONLAT,
  CITY_LONLAT,
  FLIGHT_KM,
  formatKm,
  GLOBE_CENTER,
  GLOBE_FOCUS,
  GLOBE_RADIUS,
  GLOBE_VIEW_DIR,
  globeDir,
  globeRotation,
} from "@/lib/world/globe";
import { palette } from "@/lib/world/palette";
import { runtime } from "@/lib/world/runtime";
import { useExperience, type ExperienceState } from "@/stores/experienceStore";

type TroikaText = Mesh & { fillOpacity: number };

const ARC_HEIGHT = 0.09;
const ARC_SAMPLES = 160;
const SEG_LON = 384;
const SEG_LAT = 192;
const LAT_LIMIT = 90;

/** The globe shows on the Journey overview (no stop picked, not in free look or on a street). */
export function wantsGlobe(state: ExperienceState): boolean {
  const chapter = state.travellingTo ?? state.chapter;
  return chapter === "journey" && state.journeyStop === null && !state.journeyExplore && !state.walking;
}

/** Spin and sway, on top of the fixed focus. Zeroed before the globe unrolls, so the unroll never smears. */
const orient = { spinLon: 0, spinLat: 0, sway: 0 };

/** Sun direction (chamber-local): from the upper left of the view, so the terminator falls on the right. */
const SUN = (() => {
  const up = new Vector3(0, 1, 0).addScaledVector(GLOBE_VIEW_DIR, -GLOBE_VIEW_DIR.y).normalize();
  const right = new Vector3().crossVectors(up, GLOBE_VIEW_DIR);
  return GLOBE_VIEW_DIR.clone().multiplyScalar(0.7).addScaledVector(up, 0.55).addScaledVector(right, -0.65).normalize();
})();

function createGlobeGeometry() {
  const count = (SEG_LON + 1) * (SEG_LAT + 1);
  const lonLat = new Float32Array(count * 2);
  for (let j = 0; j <= SEG_LAT; j += 1) {
    for (let i = 0; i <= SEG_LON; i += 1) {
      const index = j * (SEG_LON + 1) + i;
      lonLat[index * 2] = -180 + (360 * i) / SEG_LON;
      lonLat[index * 2 + 1] = -LAT_LIMIT + (2 * LAT_LIMIT * j) / SEG_LAT;
    }
  }
  const indices: number[] = [];
  for (let j = 0; j < SEG_LAT; j += 1) {
    for (let i = 0; i < SEG_LON; i += 1) {
      const a = j * (SEG_LON + 1) + i;
      const b = a + 1;
      const c = a + SEG_LON + 1;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geometry = new BufferGeometry();
  // Positions are computed in the shader; the attribute only sets the vertex count.
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(count * 3), 3));
  geometry.setAttribute("aLonLat", new BufferAttribute(lonLat, 2));
  geometry.setIndex(indices);
  return geometry;
}

/** A small airliner seen from above: nose +x, wings along y, laid on the sphere by its frame. */
function createPlaneGeometry() {
  const shape = new Shape();
  const outline: [number, number][] = [
    [1, 0],
    [0.82, 0.07],
    [0.2, 0.08],
    [-0.12, 0.62],
    [-0.28, 0.62],
    [-0.12, 0.08],
    [-0.62, 0.07],
    [-0.8, 0.26],
    [-0.92, 0.26],
    [-0.84, 0],
  ];
  shape.moveTo(1, 0);
  outline.slice(1).forEach(([x, y]) => shape.lineTo(x, y));
  [...outline].reverse().forEach(([x, y]) => shape.lineTo(x, -y));
  const geometry = new ExtrudeGeometry(shape, { depth: 0.06, bevelEnabled: false });
  geometry.translate(0, 0, -0.03);
  return geometry;
}

function useGlobeDirector() {
  useEffect(() => {
    let timeline: gsap.core.Timeline | null = null;

    function play(on: boolean, instant: boolean) {
      timeline?.kill();
      const { reducedMotion } = useExperience.getState();
      if (reducedMotion) {
        runtime.globe = on ? 1 : 0;
        runtime.globeArc = on ? 1 : 0;
        Object.assign(orient, { spinLon: 0, spinLat: 0, sway: 0 });
        return;
      }
      timeline = gsap.timeline();
      if (on) {
        if (instant) runtime.globe = 1;
        runtime.globeArc = 0;
        timeline
          .to(runtime, {
            globe: 1,
            duration: 1.8 * (1 - runtime.globe) + 0.01,
            ease: "power2.inOut",
            delay: instant ? 0.4 : 0.15,
          })
          .to(runtime, { globeArc: 1, duration: 4.8, ease: "power1.inOut" })
          .to(orient, { sway: 1, duration: 3, ease: "sine.inOut" }, "<");
      } else {
        timeline
          .to(orient, { spinLon: 0, spinLat: 0, sway: 0, duration: 0.3, ease: "power2.out" })
          .to(runtime, { globe: 0, duration: 1.15 * runtime.globe + 0.01, ease: "power2.inOut" });
      }
    }

    const on = wantsGlobe(useExperience.getState());
    runtime.globe = on ? 1 : 0;
    play(on, true);
    const unsubscribe = useExperience.subscribe(wantsGlobe, (next) => play(next, false));
    return () => {
      unsubscribe();
      timeline?.kill();
    };
  }, []);
}

const wrapDegrees = (value: number) => ((((value + 180) % 360) + 360) % 360) - 180;

/** Drag the globe to spin it; it drifts back to the route after a few seconds. */
function useGlobeSpin() {
  const gl = useThree((state) => state.gl);
  const drag = useRef({ active: false, x: 0, y: 0, vLon: 0, vLat: 0, idle: 0, lastMove: 0 });

  useEffect(() => {
    const element = gl.domElement;
    const state = drag.current;
    function eligible() {
      const s = useExperience.getState();
      return runtime.globe > 0.999 && wantsGlobe(s) && !s.travellingTo && !s.panel && s.phase === "explore";
    }
    function down(event: PointerEvent) {
      if (!eligible()) return;
      Object.assign(state, { active: true, x: event.clientX, y: event.clientY, vLon: 0, vLat: 0 });
      element.style.cursor = "grabbing";
    }
    function move(event: PointerEvent) {
      if (!state.active) return;
      const dx = event.clientX - state.x;
      const dy = event.clientY - state.y;
      state.x = event.clientX;
      state.y = event.clientY;
      state.vLon = -dx * 0.22;
      state.vLat = dy * 0.16;
      state.lastMove = performance.now();
      orient.spinLon = wrapDegrees(orient.spinLon + state.vLon);
      orient.spinLat = Math.max(-35, Math.min(35, orient.spinLat + state.vLat));
      state.idle = 0;
    }
    function up() {
      if (!state.active) return;
      state.active = false;
      element.style.cursor = "";
      // Held still before letting go: no fling.
      if (performance.now() - state.lastMove > 80) {
        state.vLon = 0;
        state.vLat = 0;
      }
    }
    element.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      element.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [gl]);

  useFrame((_, delta) => {
    const state = drag.current;
    if (state.active || runtime.globe < 0.999) return;
    // Inertia, then a slow return to the route.
    // Velocities are per pointer event (~60 Hz); scale so a fling travels as far at any frame rate.
    const decay = Math.exp(-delta * 4);
    state.vLon *= decay;
    state.vLat *= decay;
    orient.spinLon = wrapDegrees(orient.spinLon + state.vLon * delta * 60);
    orient.spinLat = Math.max(-35, Math.min(35, orient.spinLat + state.vLat * delta * 60));
    state.idle += delta;
    if (state.idle > 2.5) {
      const ease = 1 - Math.exp(-delta * 1.2);
      orient.spinLon -= orient.spinLon * ease;
      orient.spinLat -= orient.spinLat * ease;
    }
  });
}

function GlobeLabel({
  position,
  text,
  size,
  color,
  font = FONT_MONO,
  offsetX = 0,
  offsetY = 0,
  showAt = 0,
  letterSpacing = 0,
}: {
  /** Anchor on (or above) the unit sphere, in model space. */
  position: Vector3;
  text: string;
  size: number;
  color: string;
  font?: string;
  /** Screen-space offsets (model units). offsetX > 0 anchors the label on its left, < 0 on its right. */
  offsetX?: number;
  offsetY?: number;
  /** Fade in once the arc has been drawn this far. */
  showAt?: number;
  letterSpacing?: number;
}) {
  const ref = useRef<TroikaText>(null);
  const anchor = useRef<Group>(null);
  const scratch = useMemo(() => ({ label: new Vector3(), center: new Vector3() }), []);
  useEffect(() => {
    // Labels float in front of the globe; facing (below) hides the ones on the far side.
    const material = ref.current?.material as { depthTest?: boolean } | undefined;
    if (material) material.depthTest = false;
  }, []);
  useFrame((state, delta) => {
    const text = ref.current;
    const group = anchor.current;
    if (!text || !group?.parent) return;
    group.getWorldPosition(scratch.label);
    group.parent.getWorldPosition(scratch.center);
    const outward = scratch.label.sub(scratch.center).normalize();
    const facing = outward.dot(scratch.center.sub(state.camera.position).multiplyScalar(-1).normalize());
    const shown = runtime.globeArc >= showAt && facing > 0.25;
    const target = shown ? Math.max(0, (runtime.globe - 0.92) / 0.08) * runtime.power : 0;
    text.fillOpacity += (target - text.fillOpacity) * Math.min(1, delta * 4);
    text.visible = text.fillOpacity > 0.01;
  });
  return (
    <Billboard ref={anchor} position={position}>
      <Text
        ref={ref}
        font={font}
        fontSize={size}
        position={[offsetX, offsetY, 0]}
        anchorX={offsetX > 0 ? "left" : offsetX < 0 ? "right" : "center"}
        anchorY="middle"
        color={color}
        letterSpacing={letterSpacing}
        fillOpacity={0}
        renderOrder={10}
      >
        {text}
      </Text>
    </Billboard>
  );
}

function CityPin({ lonLat, color }: { lonLat: [number, number]; color: string }) {
  const ring = useRef<Mesh>(null);
  const ringMaterial = useRef<MeshBasicMaterial>(null);
  const beam = useRef<MeshBasicMaterial>(null);
  const normal = useMemo(() => globeDir(...lonLat), [lonLat]);
  const quaternion = useMemo(() => new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), normal), [normal]);
  useFrame((state) => {
    const fade = Math.max(0, (runtime.globe - 0.92) / 0.08) * runtime.power;
    const t = useExperience.getState().reducedMotion ? 0.35 : (state.clock.elapsedTime * 0.6) % 1;
    if (ring.current) ring.current.scale.setScalar(0.4 + t * 1.6);
    if (ringMaterial.current) ringMaterial.current.opacity = (1 - t) * 0.9 * fade;
    if (beam.current) beam.current.opacity = 0.9 * fade;
  });
  return (
    <group position={normal} quaternion={quaternion}>
      <mesh ref={ring}>
        <ringGeometry args={[0.009, 0.012, 40]} />
        <meshBasicMaterial ref={ringMaterial} color={color} transparent depthWrite={false} toneMapped={false} side={DoubleSide} />
      </mesh>
      <mesh position={[0, 0, 0.025]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.0018, 0.0018, 0.05, 8]} />
        <meshBasicMaterial ref={beam} color={color} transparent depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Pins, labels, the route arc and the airliner — in model space, carried by the globe's rotation. */
function GlobeOverlay({ frame }: { frame: React.RefObject<Group | null> }) {
  const ika = AIRPORT_LONLAT.ika;
  const ams = AIRPORT_LONLAT.ams;
  const curve = useMemo(() => {
    const points = greatCircle(ika, ams, ARC_SAMPLES).map(([lon, lat], index) =>
      globeDir(lon, lat).multiplyScalar(1 + ARC_HEIGHT * Math.sin((Math.PI * index) / ARC_SAMPLES)),
    );
    return new CatmullRomCurve3(points, false, "centripetal");
  }, [ika, ams]);
  const tube = useMemo(() => new TubeGeometry(curve, 320, 0.0032, 8, false), [curve]);
  const plane = useMemo(createPlaneGeometry, []);
  const arcMaterial = useMemo(() => {
    const a = globeDir(...ika);
    const b = globeDir(...ams);
    return typedShader(
      {
        uDraw: { value: 0 },
        uFade: { value: 0 },
        uA: { value: a },
        uOmega: { value: a.angleTo(b) },
        uWarm: { value: new Color(palette.ember) },
        uCool: { value: new Color(palette.cyan) },
      },
      {
        vertexShader: /* glsl */ `
          uniform vec3 uA;
          uniform float uOmega;
          varying float vT;
          void main() {
            // Progress along the great circle, from the vertex's direction (exact, unlike the tube's u).
            vT = acos(clamp(dot(normalize(position), uA), -1.0, 1.0)) / uOmega;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uDraw;
          uniform float uFade;
          uniform vec3 uWarm;
          uniform vec3 uCool;
          varying float vT;
          void main() {
            vec3 color = mix(uWarm, uCool, smoothstep(0.15, 0.85, vT));
            float drawn = step(vT, uDraw);
            float head = exp(-max(uDraw - vT, 0.0) * 28.0) * step(uDraw, 0.999);
            float ghost = step(0.5, fract(vT * 70.0)) * 0.22;
            float alpha = mix(ghost, 1.0, drawn) * uFade;
            gl_FragColor = vec4(color * (1.15 + head * 2.6 * drawn), alpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        toneMapped: false,
      },
    );
  }, [ika, ams]);

  useEffect(
    () => () => {
      tube.dispose();
      plane.dispose();
      arcMaterial.dispose();
    },
    [tube, plane, arcMaterial],
  );

  const planeRef = useRef<Mesh>(null);
  const planeMaterial = useRef<MeshBasicMaterial>(null);
  const loop = useRef({ time: 0 });
  const scratch = useMemo(
    () => ({ p: new Vector3(), q: new Vector3(), x: new Vector3(), y: new Vector3(), z: new Vector3(), m: new Matrix4() }),
    [],
  );

  useFrame((_, delta) => {
    const fade = Math.max(0, (runtime.globe - 0.92) / 0.08) * runtime.power;
    if (frame.current) frame.current.visible = fade > 0.001;
    arcMaterial.uniforms.uDraw.value = runtime.globeArc;
    arcMaterial.uniforms.uFade.value = fade;

    // The airliner rides the head of the line, then keeps flying the route.
    let t = runtime.globeArc;
    if (runtime.globeArc >= 1 && !useExperience.getState().reducedMotion) {
      loop.current.time += delta;
      const cycle = 9;
      const phase = loop.current.time % cycle;
      t = phase < 1.5 ? 1 : Math.min(1, (phase - 1.5) / (cycle - 2.5));
    } else loop.current.time = 0;
    const s = Math.min(Math.max(t, 0.0005), 0.9995);
    const { p, q, x, y, z, m } = scratch;
    curve.getPoint(s, p);
    curve.getPoint(Math.min(1, s + 0.002), q);
    x.copy(q).sub(p).normalize();
    z.copy(p).normalize();
    y.crossVectors(z, x).normalize();
    x.crossVectors(y, z);
    m.makeBasis(x, y, z);
    if (planeRef.current) {
      planeRef.current.position.copy(p);
      planeRef.current.quaternion.setFromRotationMatrix(m);
    }
    if (planeMaterial.current) {
      const ends = Math.min(1, t / 0.03, (1 - t) / 0.03);
      planeMaterial.current.opacity = fade * (runtime.globeArc >= 1 ? Math.max(0.15, ends) : 1);
    }
  });

  const apex = useMemo(() => curve.getPoint(0.5).multiplyScalar(1.02), [curve]);
  const ticks = useMemo(
    () =>
      [1000, 2000, 3000].map((km) => {
        const t = km / FLIGHT_KM;
        return { km, t, point: curve.getPoint(t) };
      }),
    [curve],
  );

  return (
    <>
      <mesh geometry={tube} material={arcMaterial} renderOrder={2} />
      <mesh ref={planeRef} geometry={plane} scale={0.028} renderOrder={3}>
        <meshBasicMaterial ref={planeMaterial} color={palette.ink} transparent toneMapped={false} />
      </mesh>

      <CityPin lonLat={CITY_LONLAT.tehran} color={palette.ember} />
      <CityPin lonLat={CITY_LONLAT.amsterdam} color={palette.cyan} />

      <GlobeLabel
        position={globeDir(...CITY_LONLAT.tehran)}
        text="Tehran"
        size={0.068}
        color={palette.ink}
        font={FONT_DISPLAY}
        offsetX={0.035}
        offsetY={0.012}
      />
      <GlobeLabel
        position={globeDir(...CITY_LONLAT.tehran)}
        text="IRAN · IKA · 2014–2022"
        size={0.028}
        color={palette.ember}
        offsetX={0.037}
        offsetY={-0.045}
        letterSpacing={0.04}
      />
      <GlobeLabel
        position={globeDir(...CITY_LONLAT.amsterdam)}
        text="Amsterdam"
        size={0.068}
        color={palette.ink}
        font={FONT_DISPLAY}
        offsetX={-0.035}
        offsetY={0.012}
      />
      <GlobeLabel
        position={globeDir(...CITY_LONLAT.amsterdam)}
        text="THE NETHERLANDS · AMS · 2022–TODAY"
        size={0.028}
        color={palette.cyan}
        offsetX={-0.037}
        offsetY={-0.045}
        letterSpacing={0.04}
      />

      {/* Seas, for orientation only. */}
      <GlobeLabel position={globeDir(35.5, 42.4)} text="Black Sea" size={0.028} color="#8EA2C4" font={FONT_LIGHT} />
      <GlobeLabel position={globeDir(17.5, 34.6)} text="Mediterranean Sea" size={0.028} color="#8EA2C4" font={FONT_LIGHT} />

      {ticks.map(({ km, t, point }) => (
        <GlobeLabel
          key={km}
          position={point}
          text={`${formatKm(km)} km`}
          size={0.022}
          color="#C8D3E6"
          showAt={t}
          offsetX={0.014}
          offsetY={0.022}
        />
      ))}
      <GlobeLabel
        position={apex}
        text={`${formatKm(FLIGHT_KM)} km`}
        size={0.075}
        color={palette.ink}
        font={FONT_DISPLAY}
        showAt={1}
        offsetX={0.05}
        offsetY={0.105}
      />
      <GlobeLabel
        position={apex}
        text="GREAT-CIRCLE DISTANCE · IKA → AMS"
        size={0.022}
        color="#C8D3E6"
        showAt={1}
        offsetX={0.052}
        offsetY={0.055}
        letterSpacing={0.08}
      />
    </>
  );
}

/**
 * The Earth, for the Journey overview. One mesh is both the globe and the
 * flat map: each vertex knows its longitude/latitude, and `runtime.globe`
 * blends between its place on the sphere and its place on the Mercator map,
 * so starting the story unrolls the planet into the map below.
 */
useLoader.preload(TextureLoader, "/geo/globe.png");

export function Globe() {
  useGlobeDirector();
  useGlobeSpin();

  const texture = useLoader(TextureLoader, "/geo/globe.png");
  const geometry = useMemo(createGlobeGeometry, []);
  const rotation = useMemo(() => new Matrix4(), []);
  const rotation3 = useMemo(() => new Matrix3(), []);
  const mesh = useRef<Mesh>(null);
  const atmosphereMesh = useRef<Mesh>(null);
  const frame = useRef<Group>(null);

  const material = useMemo(() => {
    const { lonMin, lonMax, latMin, latMax } = GEO.bounds;
    return typedShader(
      {
        uMap: { value: texture },
        uRot: { value: new Matrix3() },
        uCenter: { value: GLOBE_CENTER.clone() },
        uRadius: { value: GLOBE_RADIUS },
        uMorph: { value: 1 },
        uFocusDir: { value: globeDir(...GLOBE_FOCUS) },
        uBounds: { value: [lonMin, lonMax, latMin, latMax] },
        uProj: { value: [GEO.scale, GEO.lon0, GEO.merc0, GEO.zOffset] },
        uLandHeight: { value: GEO.landHeight },
        uSun: { value: SUN.clone() },
        uPower: { value: 0 },
        uTime: { value: 0 },
        uWarm: { value: new Color(palette.ember) },
        uCool: { value: new Color(palette.cyan) },
        uSignal: { value: new Color(palette.signal) },
      },
      {
        vertexShader: /* glsl */ `
          uniform sampler2D uMap;
          uniform mat3 uRot;
          uniform vec3 uCenter;
          uniform float uRadius;
          uniform float uMorph;
          uniform vec3 uFocusDir;
          uniform float uBounds[4];
          uniform float uProj[4];
          uniform float uLandHeight;
          attribute vec2 aLonLat;
          varying vec2 vLonLat;
          varying float vM;
          varying float vInside;
          varying vec3 vLocalNormal;
          varying vec3 vNormal;
          varying vec3 vWorld;
          const float DEG = 0.017453292519943295;

          float merc(float lat) { return log(tan(0.7853981633974483 + lat * DEG * 0.5)); }

          void main() {
            vec2 ll = aLonLat;
            vLonLat = ll;
            vec2 c = vec2(clamp(ll.x, uBounds[0], uBounds[1]), clamp(ll.y, uBounds[2], uBounds[3]));
            vInside = (ll.x >= uBounds[0] && ll.x <= uBounds[1] && ll.y >= uBounds[2] && ll.y <= uBounds[3]) ? 1.0 : 0.0;
            float land = texture2D(uMap, vec2((ll.x + 180.0) / 360.0, (ll.y + 90.0) / 180.0)).r;
            vec3 flatPos = vec3(
              (merc(c.y) - uProj[2]) * uProj[0],
              smoothstep(0.3, 0.8, land) * uLandHeight,
              (c.x - uProj[1]) * DEG * uProj[0] + uProj[3]
            );

            float phi = ll.y * DEG;
            float lambda = ll.x * DEG;
            vec3 dir = vec3(cos(phi) * cos(lambda), sin(phi), -cos(phi) * sin(lambda));
            vec3 n = uRot * dir;
            vec3 spherePos = uCenter + n * uRadius;

            // The route region lays down first and wraps up last.
            float d = acos(clamp(dot(dir, uFocusDir), -1.0, 1.0)) / 3.14159265;
            float m = clamp(uMorph * 1.8 - 0.8 * (1.0 - d), 0.0, 1.0);
            m = m * m * (3.0 - 2.0 * m);
            vM = m;

            vec3 pos = mix(flatPos, spherePos, m);
            pos.y += sin(m * 3.14159265) * 2.5;
            vLocalNormal = normalize(mix(vec3(0.0, 1.0, 0.0), n, m));
            vec4 world = modelMatrix * vec4(pos, 1.0);
            vWorld = world.xyz;
            vNormal = normalize(mat3(modelMatrix) * vLocalNormal);
            gl_Position = projectionMatrix * viewMatrix * world;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform sampler2D uMap;
          uniform vec3 uSun;
          uniform float uPower;
          uniform float uTime;
          uniform vec3 uWarm;
          uniform vec3 uCool;
          uniform vec3 uSignal;
          varying vec2 vLonLat;
          varying float vM;
          varying float vInside;
          varying vec3 vLocalNormal;
          varying vec3 vNormal;
          varying vec3 vWorld;
          const float DEG = 0.017453292519943295;

          float gridLine(float coord, float spacing, float width) {
            float f = abs(fract(coord / spacing - 0.5) - 0.5) * spacing;
            float w = fwidth(coord);
            return 1.0 - smoothstep(width, width + w * 1.5, f);
          }
          // Interleaved gradient noise, for a screen-door dissolve without sorting.
          float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }

          void main() {
            // Off-map parts of the world dissolve as the globe flattens onto the map.
            float alpha = mix(vInside, 1.0, smoothstep(0.1, 0.6, vM));
            if (alpha < 0.999 && alpha <= ign(gl_FragCoord.xy)) discard;

            float lon = vLonLat.x;
            float lat = vLonLat.y;
            vec2 uv = vec2((lon + 180.0) / 360.0, (lat + 90.0) / 180.0);
            vec3 tex = texture2D(uMap, uv).rgb;
            float land = smoothstep(0.2, 0.8, tex.r);

            // Dot matrix in roughly equal-area cells, warm towards Tehran, cool towards Amsterdam.
            vec2 cell = vec2(lon * cos(lat * DEG), lat) / 0.85;
            float dots = smoothstep(0.36, 0.2, length(fract(cell) - 0.5));
            vec3 tint = mix(uWarm, uCool, smoothstep(0.2, 0.8, clamp((51.0 - lon) / 46.0, 0.0, 1.0)));

            vec3 sea = vec3(0.012, 0.032, 0.066);
            vec3 ground = vec3(0.05, 0.062, 0.088) + tint * dots * 0.26;
            vec3 color = mix(sea, ground, land);

            // Iran and the Netherlands, told apart by longitude.
            bool iran = lon > 30.0;
            vec3 home = iran ? uWarm : uCool;
            float pulse = 0.85 + 0.15 * sin(uTime * 1.6 + (iran ? 0.0 : 2.0));
            color = mix(color, home * 0.42 * pulse + home * dots * 0.35, tex.b * 0.9);

            // Coastlines faint; the two home countries outlined bright.
            vec2 o = vec2(0.0009, 0.0018);
            float near = max(
              max(texture2D(uMap, uv + vec2(o.x, 0.0)).b, texture2D(uMap, uv - vec2(o.x, 0.0)).b),
              max(texture2D(uMap, uv + vec2(0.0, o.y)).b, texture2D(uMap, uv - vec2(0.0, o.y)).b)
            );
            float homeEdge = step(0.05, near);
            color += uSignal * tex.g * 0.4 * (1.0 - homeEdge);
            color += home * tex.g * homeEdge * 1.8;

            // Graticule and night side only on the globe.
            float grat = max(gridLine(lon, 15.0, 0.08), gridLine(lat, 15.0, 0.08));
            color += uSignal * grat * 0.1 * vM;
            float day = smoothstep(-0.3, 0.6, dot(normalize(vLocalNormal), uSun));
            color *= mix(1.0, 0.28 + 0.72 * day, vM);

            vec3 n = normalize(vNormal);
            vec3 view = normalize(cameraPosition - vWorld);
            float rim = pow(1.0 - clamp(abs(dot(n, view)), 0.0, 1.0), 3.0);
            color += vec3(0.22, 0.5, 1.0) * rim * 0.6 * vM;

            gl_FragColor = vec4(color * (0.3 + 0.7 * uPower), 1.0);
          }
        `,
        side: DoubleSide,
      },
    );
  }, [texture]);

  const atmosphere = useMemo(
    () =>
      typedShader(
        { uFade: { value: 0 } },
        {
          vertexShader: /* glsl */ `
            varying vec3 vView;
            void main() {
              vView = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: /* glsl */ `
            uniform float uFade;
            varying vec3 vView;
            void main() {
              // Back faces of a slightly larger sphere: brightest where it meets the globe's edge.
              float glow = pow(smoothstep(0.0, 0.55, -vView.z), 1.6);
              gl_FragColor = vec4(vec3(0.25, 0.55, 1.0) * glow * 0.75 * uFade, 1.0);
            }
          `,
          side: BackSide,
          transparent: true,
          depthWrite: false,
          blending: AdditiveBlending,
          toneMapped: false,
        },
      ),
    [],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
      atmosphere.dispose();
    },
    [geometry, material, atmosphere],
  );

  useFrame((state) => {
    const globe = runtime.globe;
    if (mesh.current) mesh.current.visible = globe > 0.0005;
    // Spin and sway only once fully round (orient is zeroed before every unroll).
    const time = state.clock.elapsedTime;
    const lon = GLOBE_FOCUS[0] + orient.spinLon + orient.sway * Math.sin(time * 0.13) * 6;
    const lat = GLOBE_FOCUS[1] + orient.spinLat + orient.sway * Math.sin(time * 0.09) * 1.5;
    globeRotation(lon, lat, GLOBE_VIEW_DIR, rotation);
    material.uniforms.uRot.value.copy(rotation3.setFromMatrix4(rotation));
    material.uniforms.uMorph.value = globe;
    material.uniforms.uPower.value = runtime.power;
    material.uniforms.uTime.value = time;
    const fade = Math.max(0, (globe - 0.85) / 0.15) * runtime.power;
    atmosphere.uniforms.uFade.value = fade;
    if (atmosphereMesh.current) atmosphereMesh.current.visible = fade > 0.001;
    if (frame.current) frame.current.quaternion.setFromRotationMatrix(rotation);
  });

  return (
    <group>
      <mesh ref={mesh} geometry={geometry} material={material} frustumCulled={false} />
      <mesh ref={atmosphereMesh} position={GLOBE_CENTER} material={atmosphere}>
        <sphereGeometry args={[GLOBE_RADIUS * 1.13, 64, 32]} />
      </mesh>
      <group ref={frame} position={GLOBE_CENTER} scale={GLOBE_RADIUS}>
        <GlobeOverlay frame={frame} />
      </group>
    </group>
  );
}

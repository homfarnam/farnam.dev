"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  ExtrudeGeometry,
  LatheGeometry,
  Quaternion,
  Shape,
  Vector2,
  Vector3,
  type Group,
  type MeshStandardMaterial,
} from "three";
import { journeyStops } from "@/data/journey";
import { typedShader } from "@/lib/shaders/materials";
import { AIRPORT_TOP, flightProgress, route, stopProgress } from "@/lib/world/journey";
import { runtime } from "@/lib/world/runtime";
import { useExperience } from "@/stores/experienceStore";

/** The move, gate to gate: taxi, take-off roll, flight, landing roll, taxi, then a pause. */
const p = flightProgress;
const SEGMENTS: { from: number; to: number; seconds: number; ease: (x: number) => number }[] = [
  { from: p.gateA, to: p.runwayA, seconds: 2.2, ease: (x) => x * x * (3 - 2 * x) },
  { from: p.runwayA, to: p.liftoff, seconds: 1.8, ease: (x) => x * x },
  { from: p.liftoff, to: p.touchdown, seconds: 6.5, ease: (x) => x },
  { from: p.touchdown, to: p.rollout, seconds: 1.8, ease: (x) => 1 - (1 - x) * (1 - x) },
  { from: p.rollout, to: p.gateB, seconds: 2.2, ease: (x) => x * x * (3 - 2 * x) },
];
const HOLD_SECONDS = 2.2;
const CYCLE = SEGMENTS.reduce((sum, segment) => sum + segment.seconds, 0) + HOLD_SECONDS;
/** Small on the apron, larger at cruise so it stays readable from the wide shot. */
const GROUND_SCALE = 0.34;
const CRUISE_SCALE = 1.5;

function progressAtTime(seconds: number): number {
  let remaining = seconds;
  for (const segment of SEGMENTS) {
    if (remaining <= segment.seconds)
      return segment.from + (segment.to - segment.from) * segment.ease(remaining / segment.seconds);
    remaining -= segment.seconds;
  }
  return p.gateB;
}
const TRAIL = 140;
const moveIndex = journeyStops.findIndex((stop) => stop.region === "flight");

/** Fuselage profile (radius, length) — revolved, then laid along +X (nose forward). */
function createFuselage() {
  const profile: [number, number][] = [
    [0, -1.0],
    [0.05, -0.97],
    [0.1, -0.88],
    [0.125, -0.7],
    [0.13, -0.3],
    [0.13, 0.5],
    [0.12, 0.72],
    [0.08, 0.9],
    [0.03, 1.0],
    [0, 1.02],
  ];
  const geometry = new LatheGeometry(
    profile.map(([r, y]) => new Vector2(r, y)),
    28,
  );
  geometry.rotateZ(-Math.PI / 2); // lathe axis Y → X, nose at -X…
  geometry.rotateY(Math.PI); // …flip so the nose points +X
  return geometry;
}

/** Swept, tapered surface in the XZ plane (chord along X), extruded thin. */
function createSurface(rootChord: number, tipChord: number, span: number, sweep: number, thickness: number) {
  const shape = new Shape();
  shape.moveTo(0, 0);
  shape.lineTo(-sweep, span);
  shape.lineTo(-sweep - tipChord, span);
  shape.lineTo(-rootChord, 0);
  shape.closePath();
  const geometry = new ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
  geometry.rotateX(Math.PI / 2); // shape Y → -Z (span sideways)
  geometry.translate(0, thickness / 2, 0);
  return geometry;
}

/**
 * A generic twin-engine airliner (no airline livery) that flies the
 * great-circle leg when the visitor reaches "The move", and otherwise waits
 * on the apron at whichever end of the story they're in.
 */
export function Airliner() {
  const plane = useRef<Group>(null);
  const strobe = useRef<MeshStandardMaterial>(null);
  const clock = useRef(0);
  const scratch = useMemo(
    () => ({ point: new Vector3(), ahead: new Vector3(), quat: new Quaternion(), forward: new Vector3(1, 0, 0) }),
    [],
  );

  const parts = useMemo(
    () => ({
      fuselage: createFuselage(),
      wing: createSurface(0.42, 0.14, 0.95, 0.42, 0.025),
      tail: createSurface(0.22, 0.08, 0.36, 0.2, 0.02),
      fin: (() => {
        const shape = new Shape();
        shape.moveTo(0, 0);
        shape.lineTo(-0.2, 0.36);
        shape.lineTo(-0.32, 0.36);
        shape.lineTo(-0.3, 0);
        shape.closePath();
        const geometry = new ExtrudeGeometry(shape, { depth: 0.02, bevelEnabled: false });
        geometry.translate(0, 0, -0.01);
        return geometry;
      })(),
    }),
    [],
  );

  const trail = useMemo(() => {
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(new Float32Array(TRAIL * 3), 3));
    geometry.setAttribute(
      "aAge",
      new BufferAttribute(
        Float32Array.from({ length: TRAIL }, (_, index) => index / (TRAIL - 1)),
        1,
      ),
    );
    geometry.setDrawRange(0, 0);
    const material = typedShader(
      { uColor: { value: new Color("#DCE8FF") }, uPower: { value: 0 } },
      {
        vertexShader: /* glsl */ `
          attribute float aAge;
          varying float vAge;
          void main() {
            vAge = aAge;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = (1.0 - aAge) * 9.0 * (10.0 / -mv.z) + 1.0;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          uniform float uPower;
          varying float vAge;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            float alpha = smoothstep(0.5, 0.0, d) * (1.0 - vAge) * 0.55 * uPower;
            gl_FragColor = vec4(uColor, alpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      },
    );
    return { geometry, material, history: [] as Vector3[] };
  }, []);

  useEffect(
    () => () => {
      Object.values(parts).forEach((geometry) => geometry.dispose());
      trail.geometry.dispose();
      trail.material.dispose();
    },
    [parts, trail],
  );

  useFrame((state, delta) => {
    const group = plane.current;
    if (!group) return;
    const { journeyStop, chapter } = useExperience.getState();
    const flying = chapter === "journey" && journeyStop === moveIndex;
    let t: number;

    if (flying) {
      clock.current = (clock.current + delta) % CYCLE;
      t = progressAtTime(clock.current);
    } else {
      clock.current = 0;
      // At the IKA gate until the story reaches the move, at the Schiphol gate after.
      const reachedMove = runtime.journeyProgress >= (stopProgress[moveIndex] ?? 0.5) - 0.01;
      t = reachedMove ? p.gateB : p.gateA;
    }

    runtime.planeProgress = t;
    route.getPointAt(t, scratch.point);
    route.getPointAt(Math.min(1, t + 0.002), scratch.ahead);
    if (scratch.ahead.distanceToSquared(scratch.point) < 1e-8) {
      // At the very end of the route: look back and mirror, so the nose still points forward.
      route.getPointAt(Math.max(0, t - 0.002), scratch.ahead);
      scratch.ahead.sub(scratch.point).negate().add(scratch.point);
    }
    group.position.copy(scratch.point);
    const altitude = scratch.point.y - AIRPORT_TOP;
    const lift = Math.min(1, Math.max(0, (altitude - 0.2) / 3.3));
    const scale = GROUND_SCALE + (CRUISE_SCALE - GROUND_SCALE) * lift * lift * (3 - 2 * lift);
    group.scale.setScalar(scale);
    // Wheels on the tarmac: the model's origin is mid-fuselage.
    group.position.y = Math.max(scratch.point.y, AIRPORT_TOP) + 0.16 * scale;
    const direction = scratch.ahead.clone().sub(scratch.point).normalize();
    scratch.quat.setFromUnitVectors(scratch.forward, direction);
    group.quaternion.slerp(scratch.quat, Math.min(1, delta * 6));
    group.getWorldPosition(runtime.planeWorld);

    // Contrail: record positions while airborne, let it fade when parked.
    const history = trail.history;
    if (flying && altitude > 0.8) history.unshift(group.position.clone());
    else if (history.length) history.pop();
    if (history.length > TRAIL) history.length = TRAIL;
    const positions = trail.geometry.getAttribute("position") as BufferAttribute;
    history.forEach((point, index) => positions.setXYZ(index, point.x, point.y, point.z));
    positions.needsUpdate = true;
    trail.geometry.setDrawRange(0, history.length);
    trail.material.uniforms.uPower.value = runtime.power;

    if (strobe.current) strobe.current.emissiveIntensity = (Math.sin(state.clock.elapsedTime * 9) > 0.92 ? 6 : 0) * runtime.power;
  });

  return (
    <>
      <group ref={plane} scale={GROUND_SCALE}>
        <mesh geometry={parts.fuselage} castShadow>
          <meshStandardMaterial color="#E8EDF5" metalness={0.35} roughness={0.32} />
        </mesh>
        {/* Cockpit glazing */}
        <mesh position={[0.86, 0.05, 0]} rotation={[0, 0, -0.35]}>
          <boxGeometry args={[0.1, 0.035, 0.13]} />
          <meshStandardMaterial color="#0B1020" metalness={0.9} roughness={0.1} />
        </mesh>
        {[1, -1].map((side) => (
          <group key={side} scale={[1, 1, side]}>
            <mesh geometry={parts.wing} position={[0.22, -0.04, 0.08]} castShadow>
              <meshStandardMaterial color="#D9E0EA" metalness={0.4} roughness={0.35} side={2} />
            </mesh>
            <mesh geometry={parts.tail} position={[-0.72, 0.02, 0.05]}>
              <meshStandardMaterial color="#D9E0EA" metalness={0.4} roughness={0.35} side={2} />
            </mesh>
            {/* Engine nacelle under each wing */}
            <mesh position={[0.12, -0.12, 0.36]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.055, 0.05, 0.26, 18]} />
              <meshStandardMaterial color="#B9C2CF" metalness={0.6} roughness={0.25} />
            </mesh>
            {/* Navigation light: red port (left), green starboard (right) */}
            <mesh position={[-0.25, -0.03, 1.04]}>
              <sphereGeometry args={[0.022, 8, 8]} />
              <meshStandardMaterial
                color="#000000"
                emissive={side > 0 ? "#22FF66" : "#FF2A2A"}
                emissiveIntensity={4}
                toneMapped={false}
              />
            </mesh>
          </group>
        ))}
        <mesh geometry={parts.fin} position={[-0.7, 0.1, 0]}>
          <meshStandardMaterial color="#D9E0EA" metalness={0.4} roughness={0.35} side={2} />
        </mesh>
        <mesh position={[-1.0, 0.44, 0]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial ref={strobe} color="#000000" emissive="#FFFFFF" emissiveIntensity={0} toneMapped={false} />
        </mesh>
      </group>
      <points geometry={trail.geometry} material={trail.material} frustumCulled={false} />
    </>
  );
}

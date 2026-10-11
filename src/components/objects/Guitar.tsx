"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BufferGeometry, ExtrudeGeometry, Float32BufferAttribute, Shape, type LineBasicMaterial } from "three";
import { palette } from "@/lib/world/palette";
import { runtime } from "@/lib/world/runtime";

/** Original offset double-cutaway body outline, drawn around the origin (units ≈ metres). */
function createBodyShape() {
  const shape = new Shape();
  shape.moveTo(0, -0.24);
  shape.bezierCurveTo(0.2, -0.25, 0.27, -0.12, 0.25, 0.0);
  shape.bezierCurveTo(0.24, 0.07, 0.17, 0.08, 0.16, 0.13);
  shape.bezierCurveTo(0.15, 0.2, 0.2, 0.27, 0.13, 0.3); // upper horn
  shape.bezierCurveTo(0.08, 0.31, 0.06, 0.22, 0.04, 0.2);
  shape.lineTo(-0.04, 0.2);
  shape.bezierCurveTo(-0.06, 0.24, -0.1, 0.26, -0.13, 0.24); // lower horn
  shape.bezierCurveTo(-0.17, 0.2, -0.16, 0.12, -0.18, 0.08);
  shape.bezierCurveTo(-0.24, 0.02, -0.27, -0.1, -0.23, -0.18);
  shape.bezierCurveTo(-0.17, -0.26, -0.08, -0.25, 0, -0.24);
  return shape;
}

/**
 * Procedural electric guitar on a stand — a glimpse of the sound chamber
 * from the lab floor. Display only: the music chapter is still sealed.
 */
export function Guitar(props: { position: [number, number, number]; rotationY: number; scale?: number }) {
  const strings = useRef<LineBasicMaterial>(null);

  const body = useMemo(() => {
    const geometry = new ExtrudeGeometry(createBodyShape(), {
      depth: 0.045,
      bevelEnabled: true,
      bevelSize: 0.012,
      bevelThickness: 0.012,
      bevelSegments: 3,
      curveSegments: 24,
    });
    geometry.translate(0, 0, -0.022);
    return geometry;
  }, []);

  const stringLines = useMemo(() => {
    const positions: number[] = [];
    for (let index = 0; index < 6; index += 1) {
      const x = (index - 2.5) * 0.009;
      positions.push(x, -0.14, 0.04, x * 0.8, 1.04, 0.035);
    }
    return new BufferGeometry().setAttribute("position", new Float32BufferAttribute(positions, 3));
  }, []);

  useFrame((state) => {
    if (strings.current) strings.current.opacity = 0.25 + runtime.power * 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.05;
  });

  return (
    <group position={props.position} rotation={[0, props.rotationY, 0]} scale={props.scale ?? 1.6}>
      <group position={[0, 0.42, 0]} rotation={[-0.16, 0, 0]}>
        <mesh geometry={body} castShadow>
          <meshPhysicalMaterial color="#121826" metalness={0.3} roughness={0.25} clearcoat={1} clearcoatRoughness={0.15} />
        </mesh>
        {/* Pickguard */}
        <mesh position={[0.02, -0.02, 0.036]}>
          <circleGeometry args={[0.11, 24]} />
          <meshStandardMaterial color="#0A0E16" metalness={0.2} roughness={0.6} />
        </mesh>
        {/* Pickups */}
        {[0.06, -0.06].map((y) => (
          <mesh key={y} position={[0, y, 0.042]}>
            <boxGeometry args={[0.075, 0.03, 0.012]} />
            <meshStandardMaterial color={palette.metal} metalness={0.9} roughness={0.2} />
          </mesh>
        ))}
        {/* Neck and headstock */}
        <mesh position={[0, 0.62, 0.012]} castShadow>
          <boxGeometry args={[0.05, 0.86, 0.025]} />
          <meshStandardMaterial color="#2A1C14" roughness={0.7} />
        </mesh>
        <mesh position={[0.012, 1.1, 0.005]} rotation={[0, 0, -0.12]}>
          <boxGeometry args={[0.07, 0.18, 0.02]} />
          <meshStandardMaterial color="#121826" roughness={0.4} />
        </mesh>
        <lineSegments geometry={stringLines}>
          <lineBasicMaterial ref={strings} color={palette.ember} transparent opacity={0.4} toneMapped={false} />
        </lineSegments>
      </group>
      {/* A-frame stand */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.1, 0.2, -0.05]} rotation={[0.25, 0, side * -0.3]}>
          <cylinderGeometry args={[0.008, 0.008, 0.44, 6]} />
          <meshStandardMaterial color={palette.metal} metalness={0.9} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  EdgesGeometry,
  Float32BufferAttribute,
  type Group,
} from "three";
import type { ArtifactVisualProps } from "@/components/objects/ProjectArtifact";
import { typedShader } from "@/lib/shaders/materials";
import { palette } from "@/lib/world/palette";
import { runtime } from "@/lib/world/runtime";
import { useExperience } from "@/stores/experienceStore";

/** One particle per user: the bot has served more than 40,000 people. */
const USER_PARTICLES = 40000;

/** Folded paper dart — faceted, flat shaded. */
function createDartGeometry() {
  const nose = [0.6, 0.1, 0];
  const tailTop = [-0.45, 0.36, -0.02];
  const wing = [-0.5, -0.02, 0.3];
  const tailLow = [-0.36, -0.28, 0];
  const keel = [-0.18, -0.02, -0.16];
  const triangles = [nose, tailTop, wing, nose, wing, tailLow, nose, tailLow, keel, nose, keel, tailTop].flat();
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(triangles, 3));
  geometry.computeVertexNormals();
  return geometry;
}

/** Telegram bot: a paper dart inside a swarm where every point is one user. */
export function MessengerArtifact({ focused, accent }: ArtifactVisualProps) {
  const quality = useExperience((state) => state.quality);
  const dpr = useThree((state) => state.viewport.dpr);
  const dart = useRef<Group>(null);
  const count = quality === "low" ? 8000 : USER_PARTICLES;

  const dartGeometry = useMemo(createDartGeometry, []);
  const dartEdges = useMemo(() => new EdgesGeometry(dartGeometry), [dartGeometry]);

  const swarm = useMemo(() => {
    const orbit = new Float32Array(count * 4);
    for (let index = 0; index < count; index += 1) {
      orbit[index * 4] = 0.55 + Math.pow(Math.random(), 0.6) * 0.5; // radius
      orbit[index * 4 + 1] = 0.15 + Math.random() * 0.5; // speed
      orbit[index * 4 + 2] = Math.random() * Math.PI * 2; // phase
      orbit[index * 4 + 3] = (Math.random() - 0.5) * Math.PI; // tilt
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(new Float32Array(count * 3), 3));
    geometry.setAttribute("aOrbit", new BufferAttribute(orbit, 4));
    return geometry;
  }, [count]);

  const swarmMaterial = useMemo(
    () =>
      typedShader(
        {
          uTime: { value: 0 },
          uPower: { value: 0 },
          uFocus: { value: 0 },
          uColor: { value: new Color(accent) },
          uPixelRatio: { value: 1 },
        },
        {
          vertexShader: /* glsl */ `
            attribute vec4 aOrbit;
            uniform float uTime;
            uniform float uFocus;
            uniform float uPixelRatio;
            varying float vGlint;
            void main() {
              float radius = aOrbit.x * (1.0 + uFocus * 0.25);
              float angle = aOrbit.z + uTime * aOrbit.y * (1.0 + uFocus * 1.5);
              float tilt = aOrbit.w;
              vec3 p = vec3(cos(angle) * radius, sin(angle) * radius * sin(tilt), sin(angle) * radius * cos(tilt));
              vec4 mv = modelViewMatrix * vec4(p, 1.0);
              gl_Position = projectionMatrix * mv;
              gl_PointSize = uPixelRatio * (1.4 + uFocus) * (3.0 / -mv.z);
              vGlint = step(0.985, fract(aOrbit.z * 13.7));
            }
          `,
          fragmentShader: /* glsl */ `
            uniform vec3 uColor;
            uniform float uPower;
            varying float vGlint;
            void main() {
              float d = length(gl_PointCoord - 0.5);
              float alpha = smoothstep(0.5, 0.1, d) * 0.7 * uPower;
              vec3 color = mix(uColor, vec3(0.976, 0.451, 0.086), vGlint);
              gl_FragColor = vec4(color, alpha);
            }
          `,
          transparent: true,
          depthWrite: false,
          blending: AdditiveBlending,
        },
      ),
    [accent],
  );

  useEffect(() => () => swarmMaterial.dispose(), [swarmMaterial]);

  useFrame((state, delta) => {
    const { uniforms } = swarmMaterial;
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uPower.value = runtime.power;
    uniforms.uPixelRatio.value = dpr;
    uniforms.uFocus.value += ((focused ? 1 : 0) - uniforms.uFocus.value) * Math.min(1, delta * 2);
    if (dart.current) {
      dart.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.2) * 0.08;
      dart.current.position.y = Math.sin(state.clock.elapsedTime * 1.6) * 0.03;
    }
  });

  return (
    <group>
      <group ref={dart} rotation={[0.1, -0.5, 0]}>
        <mesh geometry={dartGeometry}>
          <meshStandardMaterial
            color="#DDEBFF"
            emissive={accent}
            emissiveIntensity={0.25}
            metalness={0.1}
            roughness={0.5}
            flatShading
            side={2}
          />
        </mesh>
        <lineSegments geometry={dartEdges}>
          <lineBasicMaterial color={palette.cyan} toneMapped={false} />
        </lineSegments>
      </group>
      <points geometry={swarm} material={swarmMaterial} frustumCulled={false} />
    </group>
  );
}

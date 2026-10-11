"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BufferAttribute, BufferGeometry, Color, DataTexture, LinearFilter, RedFormat, type LineBasicMaterial } from "three";
import { typedShader } from "@/lib/shaders/materials";
import { GEO } from "@/lib/world/geo";
import { parseContainer, useGeoBinary, type MapHeader } from "@/lib/world/geoData";
import { AMSTERDAM_CENTER, LAND_Y, TEHRAN_CENTER } from "@/lib/world/journey";
import { palette } from "@/lib/world/palette";
import { runtime } from "@/lib/world/runtime";

const SEGMENTS_ALONG = 420;

/**
 * The real map as relief: Natural Earth land is lifted into raised continents
 * with soft coastal slopes, the sea sits below with a slow shimmer, and the
 * land carries a lit dot matrix that warms towards Tehran and cools towards Amsterdam.
 */
export function WorldMap() {
  const data = useGeoBinary("/geo/map.bin");
  const { header, landTexture, coastGeometry } = useMemo(() => {
    const container = parseContainer<MapHeader>(data);
    const texture = new DataTexture(
      container.get("land", "Uint8Array"),
      container.header.width,
      container.header.height,
      RedFormat,
    );
    texture.magFilter = LinearFilter;
    texture.minFilter = LinearFilter;
    texture.needsUpdate = true;
    const coast = container.get("coast", "Float32Array");
    const positions = new Float32Array((coast.length / 2) * 3);
    for (let index = 0; index < coast.length / 2; index += 1) {
      positions[index * 3] = coast[index * 2] ?? 0;
      positions[index * 3 + 1] = LAND_Y * 0.55;
      positions[index * 3 + 2] = coast[index * 2 + 1] ?? 0;
    }
    const geometry = new BufferGeometry().setAttribute("position", new BufferAttribute(positions, 3));
    return { header: container.header, landTexture: texture, coastGeometry: geometry };
  }, [data]);

  const { xMin, xMax, zMin, zMax } = header.bounds;
  const coastMaterial = useRef<LineBasicMaterial>(null);

  const material = useMemo(
    () =>
      typedShader(
        {
          uLand: { value: landTexture },
          uTexel: { value: [1 / header.width, 1 / header.height] },
          uLandHeight: { value: GEO.landHeight },
          uTime: { value: 0 },
          uPower: { value: 0 },
          uProgress: { value: 0 },
          uWarm: { value: new Color(palette.ember) },
          uCool: { value: new Color(palette.cyan) },
          uTehran: { value: TEHRAN_CENTER.z },
          uAmsterdam: { value: AMSTERDAM_CENTER.z },
          uBounds: { value: [xMin, xMax, zMin, zMax] },
          uCenter: { value: [(xMin + xMax) / 2, (zMin + zMax) / 2] },
        },
        {
          vertexShader: /* glsl */ `
            uniform sampler2D uLand;
            uniform float uTexel[2];
            uniform float uLandHeight;
            uniform float uCenter[2];
            uniform float uBounds[4];
            varying vec2 vMap;
            varying vec2 vUv;
            varying float vHeight;

            float landAt(vec2 uv) {
              // Small blur so coastlines become slopes, not cliffs.
              float sum = 0.0;
              for (int i = -2; i <= 2; i++) {
                for (int j = -2; j <= 2; j++) {
                  sum += texture2D(uLand, uv + vec2(float(i) * uTexel[0], float(j) * uTexel[1]) * 1.6).r;
                }
              }
              return sum / 25.0;
            }

            void main() {
              // Plane is laid flat (rotated -90° on X): plane x → north, plane y → -east, plane z → up.
              vMap = vec2(position.x + uCenter[0], -position.y + uCenter[1]);
              vUv = vec2((vMap.y - uBounds[2]) / (uBounds[3] - uBounds[2]), (vMap.x - uBounds[0]) / (uBounds[1] - uBounds[0]));
              vHeight = smoothstep(0.15, 0.85, landAt(vUv));
              vec3 displaced = position + vec3(0.0, 0.0, vHeight * uLandHeight);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
            }
          `,
          fragmentShader: /* glsl */ `
            uniform sampler2D uLand;
            uniform float uTexel[2];
            uniform float uTime;
            uniform float uPower;
            uniform float uProgress;
            uniform vec3 uWarm;
            uniform vec3 uCool;
            uniform float uTehran;
            uniform float uAmsterdam;
            varying vec2 vMap;
            varying vec2 vUv;
            varying float vHeight;

            void main() {
              float x = vMap.x;
              float z = vMap.y;

              // Relief shading from the height gradient, lit from the north-west dusk sky.
              float hx = texture2D(uLand, vUv + vec2(uTexel[0] * 2.0, 0.0)).r - texture2D(uLand, vUv - vec2(uTexel[0] * 2.0, 0.0)).r;
              float hy = texture2D(uLand, vUv + vec2(0.0, uTexel[1] * 2.0)).r - texture2D(uLand, vUv - vec2(0.0, uTexel[1] * 2.0)).r;
              float relief = clamp(0.6 + (-hx * 0.9 + hy * 0.6), 0.25, 1.25);
              float coast = clamp(length(vec2(hx, hy)) * 2.5, 0.0, 1.0);

              float t = clamp((uTehran - z) / (uTehran - uAmsterdam), 0.0, 1.0);
              vec3 tint = mix(uWarm, uCool, smoothstep(0.3, 0.7, t));
              float revealed = smoothstep(uProgress + 0.06, uProgress - 0.02, t);

              // Dot matrix, one dot per cell, only where the cell centre is land.
              vec2 cellCoord = vec2(x, z) / 0.42;
              float dots = smoothstep(0.17, 0.07, length(fract(cellCoord) - 0.5));
              float landCell = step(0.5, texture2D(uLand, vUv).r);

              vec3 seaDeep = vec3(0.012, 0.03, 0.06);
              vec3 seaShallow = vec3(0.03, 0.075, 0.13);
              float shimmer = 0.5 + 0.5 * sin(z * 0.9 + uTime * 0.6 + sin(x * 0.7 + uTime * 0.3) * 2.0);
              vec3 sea = mix(seaDeep, seaShallow, smoothstep(0.0, 0.4, vHeight) + shimmer * 0.15);

              vec3 landBase = vec3(0.05, 0.06, 0.085) * relief;
              vec3 land = landBase + tint * dots * landCell * (0.16 + revealed * 0.55) + tint * coast * 0.25;

              vec3 color = mix(sea, land, smoothstep(0.35, 0.6, vHeight));
              vec2 edge2 = smoothstep(vec2(0.0), vec2(0.07), vUv) * smoothstep(vec2(1.0), vec2(0.93), vUv);
              color *= edge2.x * edge2.y;
              gl_FragColor = vec4(color * (0.3 + 0.7 * uPower), 1.0);
            }
          `,
        },
      ),
    [landTexture, header.width, header.height, xMin, xMax, zMin, zMax],
  );

  useEffect(
    () => () => {
      material.dispose();
      landTexture.dispose();
      coastGeometry.dispose();
    },
    [material, landTexture, coastGeometry],
  );

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uPower.value = runtime.power;
    material.uniforms.uProgress.value = runtime.journeyProgress;
    if (coastMaterial.current) coastMaterial.current.opacity = 0.4 * runtime.power;
  });

  const segmentsAcross = Math.round((SEGMENTS_ALONG * (xMax - xMin)) / (zMax - zMin));

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(xMin + xMax) / 2, 0, (zMin + zMax) / 2]} material={material}>
        <planeGeometry args={[xMax - xMin, zMax - zMin, segmentsAcross, SEGMENTS_ALONG]} />
      </mesh>
      <lineSegments geometry={coastGeometry}>
        <lineBasicMaterial ref={coastMaterial} color={palette.signal} transparent opacity={0} toneMapped={false} />
      </lineSegments>
    </group>
  );
}

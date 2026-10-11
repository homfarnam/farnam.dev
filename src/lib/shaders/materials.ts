import { AdditiveBlending, Color, DoubleSide, ShaderMaterial, type ShaderMaterialParameters } from "three";

type UniformMap = Record<string, { value: unknown }>;
/** ShaderMaterial whose uniforms are statically known — no undefined checks in render loops. */
export type TypedShaderMaterial<U extends UniformMap> = ShaderMaterial & { uniforms: U };

export function typedShader<U extends UniformMap>(
  uniforms: U,
  parameters: Omit<ShaderMaterialParameters, "uniforms">,
): TypedShaderMaterial<U> {
  return new ShaderMaterial({ ...parameters, uniforms }) as TypedShaderMaterial<U>;
}

/**
 * Hand-written shader materials. Each factory returns a fresh material whose
 * uniforms are updated from useFrame. Kept as template strings so they work
 * with any bundler without loaders.
 */

const commonVaryings = /* glsl */ `
  varying vec3 vWorldPos;
  varying vec3 vNormalW;
  varying vec2 vUv;
`;

/** Fresnel rim + drifting scanlines. Used for every holographic surface. */
export function createHologramMaterial(color: string, opacity = 1) {
  return typedShader(
    {
      uTime: { value: 0 },
      uColor: { value: new Color(color) },
      uPower: { value: 0 },
      uOpacity: { value: opacity },
      uHover: { value: 0 },
    },
    {
      vertexShader: /* glsl */ `
      ${commonVaryings}
      void main() {
        vUv = uv;
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorldPos = world.xyz;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
      fragmentShader: /* glsl */ `
      ${commonVaryings}
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uPower;
      uniform float uOpacity;
      uniform float uHover;
      void main() {
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        float fresnel = pow(1.0 - abs(dot(viewDir, normalize(vNormalW))), 2.2);
        float scan = smoothstep(0.35, 1.0, sin(vWorldPos.y * 38.0 - uTime * 2.4) * 0.5 + 0.5);
        float band = smoothstep(0.0, 0.08, fract(vWorldPos.y * 0.6 - uTime * 0.25)) *
                     (1.0 - smoothstep(0.08, 0.16, fract(vWorldPos.y * 0.6 - uTime * 0.25)));
        float flicker = 0.92 + 0.08 * sin(uTime * 37.0 + vWorldPos.x * 3.0);
        float alpha = (fresnel * 0.85 + scan * 0.12 + band * 0.35 + 0.05) * flicker;
        alpha *= uPower * uOpacity * (1.0 + uHover * 0.8);
        vec3 color = uColor * (1.2 + uHover * 0.8) + fresnel * 0.25;
        gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
      }
    `,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
    },
  );
}

/** Lab floor: fine square grid + polar rings, a boot pulse and distance fade. */
export function createGridFloorMaterial(lineColor: string, radius: number) {
  return typedShader(
    {
      uTime: { value: 0 },
      uColor: { value: new Color(lineColor) },
      uPower: { value: 0 },
      uPulse: { value: 0 },
      uRadius: { value: radius },
    },
    {
      vertexShader: /* glsl */ `
      varying vec3 vWorldPos;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorldPos = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
      fragmentShader: /* glsl */ `
      varying vec3 vWorldPos;
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uPower;
      uniform float uPulse;
      uniform float uRadius;

      float gridLine(vec2 coord, float width) {
        vec2 grid = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
        return 1.0 - min(min(grid.x, grid.y) / width, 1.0);
      }

      void main() {
        vec2 p = vWorldPos.xz;
        float r = length(p);
        float fine = gridLine(p * 1.0, 1.0) * 0.18;
        float coarse = gridLine(p * 0.25, 1.2) * 0.35;
        float rings = 1.0 - min(abs(fract(r * 0.5) - 0.5) / fwidth(r * 0.5) / 1.3, 1.0);
        float edgeFade = 1.0 - smoothstep(uRadius * 0.55, uRadius, r);
        float pulse = exp(-pow((r - uPulse) * 1.6, 2.0)) * step(0.01, uPulse);
        float breathing = 0.75 + 0.25 * sin(uTime * 0.8 - r * 0.4);
        float intensity = (fine + coarse + rings * 0.22) * edgeFade * breathing * uPower + pulse * 1.4;
        vec3 base = vec3(0.016, 0.024, 0.04);
        vec3 color = base + uColor * intensity;
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    },
  );
}

/** Soft round particles that drift on a slow noise field. */
export function createDustMaterial(color: string, size: number) {
  return typedShader(
    {
      uTime: { value: 0 },
      uColor: { value: new Color(color) },
      uPower: { value: 0 },
      uSize: { value: size },
      uPixelRatio: { value: 1 },
      uBurst: { value: 0 },
    },
    {
      vertexShader: /* glsl */ `
      attribute float aSeed;
      uniform float uTime;
      uniform float uSize;
      uniform float uPixelRatio;
      uniform float uBurst;
      varying float vAlpha;
      void main() {
        vec3 p = position;
        float t = uTime * (0.08 + aSeed * 0.06);
        p.x += sin(t + aSeed * 40.0) * 0.6;
        p.y += sin(t * 1.3 + aSeed * 13.0) * 0.4 + uBurst * aSeed * 3.0;
        p.z += cos(t + aSeed * 21.0) * 0.6;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * uPixelRatio * (0.4 + aSeed) * (12.0 / -mv.z);
        vAlpha = 0.35 + 0.65 * (sin(uTime * (0.5 + aSeed) + aSeed * 30.0) * 0.5 + 0.5);
      }
    `,
      fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uPower;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float alpha = smoothstep(0.5, 0.0, d) * vAlpha * (0.25 + 0.75 * uPower);
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    },
  );
}

const noiseChunk = /* glsl */ `
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p);
      p *= 2.03;
      amplitude *= 0.5;
    }
    return value;
  }
`;

/** Door surface: drifting fog for open chambers, a ribbed energy barrier for sealed ones. */
export function createPortalMaterial(color: string, sealed: boolean) {
  return typedShader(
    {
      uTime: { value: 0 },
      uColor: { value: new Color(color) },
      uPower: { value: 0 },
      uHover: { value: 0 },
      uSealed: { value: sealed ? 1 : 0 },
    },
    {
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec2 vUv;
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uPower;
        uniform float uHover;
        uniform float uSealed;
        ${noiseChunk}
        void main() {
          vec2 p = vUv - 0.5;
          float swirl = fbm(vec2(p.x * 3.0 + fbm(p * 4.0 + uTime * 0.12) * 1.5, p.y * 2.0 - uTime * 0.18));
          float depth = smoothstep(0.75, 0.0, length(p * vec2(1.6, 1.0)));
          float open = (swirl * 0.9 + depth * 0.5) * (0.45 + uHover * 0.7);

          float ribs = smoothstep(0.42, 0.5, abs(fract(vUv.y * 22.0 - uTime * 0.4) - 0.5));
          float barrier = (0.12 + ribs * 0.35) * (0.6 + 0.4 * sin(uTime * 2.0)) + swirl * 0.15;

          float intensity = mix(open, barrier * (0.7 + uHover * 0.6), uSealed);
          float edge = smoothstep(0.38, 0.5, max(abs(p.x) * 1.0, abs(p.y)));
          vec3 color = uColor * intensity + uColor * edge * 0.6;
          gl_FragColor = vec4(color * uPower, clamp(intensity + edge * 0.5, 0.0, 1.0) * uPower);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
    },
  );
}

import { Color, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace, type DataTexture, type Texture } from "three";
import type { StreetStyle } from "@/lib/world/street";

/**
 * Street-level materials. All texture coordinates are derived in world space
 * (metres), so they work on raw building meshes without UVs.
 * Textures: ambientCG (CC0) — see README for the list.
 */

export interface StreetTextures {
  wall: Texture;
  wallNormal: Texture;
  alt: Texture;
  altNormal: Texture;
  roof: Texture;
  roofNormal: Texture;
  ground: Texture;
  groundNormal: Texture;
  road?: Texture;
  roadNormal?: Texture;
}

export function prepareTextures(textures: StreetTextures): StreetTextures {
  for (const [key, texture] of Object.entries(textures) as [keyof StreetTextures, Texture | undefined][]) {
    if (!texture) continue;
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.anisotropy = 8;
    // Albedo is sRGB; normal maps are linear data.
    if (!key.toLowerCase().includes("normal")) texture.colorSpace = SRGBColorSpace;
  }
  return textures;
}

const facadeChunk = /* glsl */ `
  uniform sampler2D uWall;
  uniform sampler2D uWallN;
  uniform sampler2D uAlt;
  uniform sampler2D uAltN;
  uniform sampler2D uRoof;
  uniform sampler2D uRoofN;
  uniform float uNight;
  uniform float uFloor;
  uniform float uBay;
  uniform float uAltShare;
  uniform float uTehran;
  uniform vec3 uFrame;
  varying vec3 vObj;
  varying float vSeed;

  float fHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  float aaBox(vec2 c, vec2 lo, vec2 hi, vec2 fw) {
    vec2 inside = smoothstep(lo - fw, lo + fw, c) * (1.0 - smoothstep(hi - fw, hi + fw, c));
    return inside.x * inside.y;
  }
  float aaLine(float c, float center, float w, float f) {
    float d = abs(c - center);
    return (1.0 - smoothstep(w - f, w + f, d)) * clamp(w / f, 0.0, 1.0);
  }

  // Amsterdam brick: deep red, brown, near-black, sandy. Tehran brick: yellow ajor tones.
  vec3 wallTint(float seed) {
    if (uTehran > 0.5) return mix(vec3(1.0, 0.94, 0.82), vec3(0.86, 0.74, 0.6), seed);
    return seed < 0.35 ? vec3(1.0, 0.92, 0.88) : seed < 0.6 ? vec3(0.72, 0.58, 0.52) : seed < 0.75 ? vec3(0.42, 0.38, 0.38) : vec3(1.05, 0.95, 0.78);
  }
  // Amsterdam: white/grey plaster. Tehran: travertine from cream to warm grey.
  vec3 altTint(float seed) {
    if (uTehran > 0.5) return mix(vec3(0.86, 0.78, 0.62), vec3(0.72, 0.64, 0.52), seed);
    return mix(vec3(0.92, 0.9, 0.86), vec3(0.75, 0.78, 0.8), seed);
  }
  // Shop sign colours (Tehran ground floors).
  vec3 signColor(float h) {
    return h < 0.25 ? vec3(1.0, 0.85, 0.55) : h < 0.45 ? vec3(0.95, 0.25, 0.2) : h < 0.65 ? vec3(0.2, 0.85, 0.95) : h < 0.85 ? vec3(0.35, 0.95, 0.45) : vec3(1.0, 0.6, 0.15);
  }
`;

/**
 * Facades for both cities: textured walls (brick, or plaster/stone on a share of
 * buildings), roofs, and an anti-aliased window grid with frames and lit rooms.
 * Tehran adds ground-floor shopfronts with glowing sign bands.
 */
export function createFacadeMaterial(textures: StreetTextures, style: StreetStyle, variant = "buildings") {
  const material = new MeshStandardMaterial({
    color: "#ffffff",
    roughness: 0.85,
    metalness: 0,
    flatShading: true,
    envMapIntensity: 0.55,
  });
  // A distinct key per material instance: onBeforeCompile (and its uniforms) only runs for new programs.
  material.customProgramCacheKey = () => `street-facade-${style.id}-${variant}`;
  const uniforms = {
    uWall: { value: textures.wall },
    uWallN: { value: textures.wallNormal },
    uAlt: { value: textures.alt },
    uAltN: { value: textures.altNormal },
    uRoof: { value: textures.roof },
    uRoofN: { value: textures.roofNormal },
    uNight: { value: 1 },
    uFloor: { value: style.facade.floor },
    uBay: { value: style.facade.bay },
    uAltShare: { value: style.facade.altShare },
    uTehran: { value: style.city === "tehran" ? 1 : 0 },
    uFrame: { value: new Color(style.facade.frames) },
  };

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nattribute float aSeed;\nvarying vec3 vObj;\nvarying vec3 vObjN;\nvarying float vSeed;",
      )
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvObj = position;\nvObjN = normal;\nvSeed = aSeed;");

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>\nvarying vec3 vObjN;\n${facadeChunk}\nfloat gGlass = 0.0;\nvec3 gLight = vec3(0.0);\nvec3 gWorldN = vec3(0.0, 1.0, 0.0);\nvec3 gTangent = vec3(1.0, 0.0, 0.0);\nvec3 gBitangent = vec3(0.0, 0.0, 1.0);\nvec2 gUv = vec2(0.0);\nfloat gKind = 0.0;\nfloat gAltScale = 0.6;`,
      )
      .replace(
        "#include <map_fragment>",
        /* glsl */ `
        {
          // Exact per-face normal from the (non-indexed) geometry. Screen-space derivatives of
          // positions ~150 m from the origin jitter enough to scatter the window grid.
          vec3 n = normalize(vObjN);
          gWorldN = n;
          float wall = 1.0 - step(0.5, abs(n.y));
          float flatRoof = step(0.96, n.y);
          // Interpolation adds float noise to the per-building seed; snap it before hashing.
          float seedId = floor(vSeed * 255.0 + 0.5);
          float seed = seedId / 255.0;
          bool alt = fract(seed * 3.7) < uAltShare;
          vec3 albedo;
          if (wall > 0.5) {
            gTangent = normalize(vec3(-n.z, 0.0, n.x));
            gBitangent = vec3(0.0, 1.0, 0.0);
            float along = dot(vObj, gTangent);
            gUv = vec2(along, vObj.y) / 1.25;
            gKind = alt ? 2.0 : 0.0;
            gAltScale = uTehran > 0.5 ? 0.35 : 0.6;
            if (alt) {
              vec3 stone = texture2D(uAlt, gUv * gAltScale).rgb;
              // Tehran: keep only the stone's light/dark veining; colour comes from the tint
              // (the source texture has a cool cast that reads lilac at dusk).
              float veins = dot(stone, vec3(0.299, 0.587, 0.114));
              albedo = uTehran > 0.5 ? altTint(fract(seed * 7.0)) * (0.45 + 0.75 * veins) : stone * altTint(fract(seed * 7.0));
            } else {
              albedo = texture2D(uWall, gUv).rgb * wallTint(fract(seed * 13.7));
            }

            float floorY = vObj.y - (uTehran > 0.5 ? 0.0 : 0.6);
            vec2 gridCoord = vec2(along / uBay, floorY / uFloor);
            vec2 cellId = floor(gridCoord);
            vec2 cell = fract(gridCoord);
            vec2 fw = max(fwidth(gridCoord), vec2(1e-4));
            float aboveGround = step(1.0, cellId.y);
            float detail = 1.0 - smoothstep(0.08, 0.3, max(fw.x, fw.y));
            vec3 plain = albedo;
            float lit = step(0.55, fHash(cellId * 1.7 + seedId * vec2(0.53, 0.29)));

            float frame;
            float glass;
            vec3 light = vec3(0.0);
            if (uTehran > 0.5) {
              // Apartment windows: wide, dark aluminium frames, a single mullion.
              float inWin = aaBox(cell, vec2(0.18, 0.3), vec2(0.82, 0.78), fw);
              float inGlass = aaBox(cell, vec2(0.21, 0.33), vec2(0.79, 0.75), fw);
              float mullion = aaLine(cell.x, 0.5, 0.008, fw.x);
              frame = aboveGround * (inWin * (1.0 - inGlass) + inGlass * mullion);
              glass = aboveGround * inGlass * (1.0 - mullion);
              // Ground floor: shopfront glass under a glowing sign band.
              float ground = 1.0 - aboveGround;
              float shop = ground * aaBox(cell, vec2(0.05, 0.05), vec2(0.95, 0.72), fw);
              float sign = ground * aaBox(cell, vec2(0.04, 0.78), vec2(0.96, 0.93), fw);
              float shopHash = fHash(cellId + seedId * vec2(0.11, 0.91));
              float shopLit = step(0.4, shopHash);
              glass += shop;
              albedo = mix(albedo, vec3(0.08, 0.08, 0.09), sign);
              // Shop interiors: warm or cool white, brighter towards the bottom (counters, displays).
              vec3 shopTone = mix(vec3(1.0, 0.78, 0.5), vec3(0.85, 0.9, 1.0), step(0.7, shopHash));
              light += shopTone * shop * shopLit * (0.45 + 0.4 * (1.0 - cell.y));
              light += signColor(fHash(cellId * 3.1 + seedId)) * sign * shopLit * 1.6;
              // Apartments: about a third lit, curtains dim and vary the glow.
              float homeLit = step(0.66, fHash(cellId * 1.3 + seedId * vec2(0.29, 0.61)));
              float curtain = 0.45 + 0.4 * fHash(cellId * 5.7 + seedId);
              light += mix(vec3(1.0, 0.72, 0.45), vec3(0.95, 0.9, 0.8), fHash(cellId + 7.0)) * inGlass * aboveGround * homeLit * curtain * 0.75;
            } else {
              // Canal-house sashes: white frames and a glazing cross; tall ground-floor windows, some doors.
              float inWin = aaBox(cell, vec2(0.22, 0.18), vec2(0.78, 0.8), fw);
              float inGlass = aaBox(cell, vec2(0.26, 0.22), vec2(0.74, 0.76), fw);
              float bar = max(aaLine(cell.x, 0.5, 0.012, fw.x), aaLine(cell.y, 0.52, 0.015, fw.y));
              frame = aboveGround * (inWin * (1.0 - inGlass) + inGlass * bar);
              float ground = 1.0 - aboveGround;
              vec2 groundCell = vec2(cell.x, vObj.y / 3.0);
              vec2 groundFw = vec2(fw.x, max(fwidth(vObj.y / 3.0), 1e-4));
              float groundWin = ground * aaBox(groundCell, vec2(0.15, 0.14), vec2(0.85, 0.95), groundFw);
              float door = groundWin * step(0.82, fHash(cellId + seedId * vec2(0.37, 0.73)));
              glass = clamp(aboveGround * inGlass * (1.0 - bar) + groundWin * (1.0 - door), 0.0, 1.0);
              albedo = mix(albedo, vec3(0.12, 0.08, 0.06), door);
              light += vec3(1.0, 0.72, 0.42) * glass * lit * 1.25;
            }
            albedo = mix(albedo, uFrame, frame);
            albedo = mix(albedo, vec3(0.02, 0.025, 0.035), clamp(glass, 0.0, 1.0));
            albedo = mix(plain * 0.72, albedo, detail);
            gGlass = clamp(glass, 0.0, 1.0) * detail;
            // Far away, lit windows become a soft average glow instead of sparkles.
            gLight = mix(vec3(1.0, 0.75, 0.5) * 0.12 * aboveGround, light, detail);
          } else if (flatRoof > 0.5 || uTehran > 0.5) {
            gTangent = vec3(1.0, 0.0, 0.0);
            gBitangent = vec3(0.0, 0.0, 1.0);
            gUv = vObj.xz / 3.0;
            gKind = 3.0;
            albedo = uTehran > 0.5 ? vec3(0.16, 0.15, 0.14) : vec3(0.09, 0.09, 0.1);
          } else {
            gTangent = normalize(vec3(-n.z, 0.0, n.x));
            gBitangent = normalize(cross(n, gTangent));
            gUv = vec2(dot(vObj, gTangent), dot(vObj, gBitangent)) / 2.2;
            gKind = 1.0;
            albedo = texture2D(uRoof, gUv).rgb * vec3(0.55, 0.45, 0.42);
          }
          diffuseColor.rgb *= albedo;
        }`,
      )
      .replace(
        "#include <normal_fragment_maps>",
        /* glsl */ `
        if (gGlass < 0.5 && gKind < 2.5) {
          vec3 mapN = gKind < 0.5 ? texture2D(uWallN, gUv).xyz : gKind < 1.5 ? texture2D(uRoofN, gUv).xyz : texture2D(uAltN, gUv * gAltScale).xyz;
          mapN = mapN * 2.0 - 1.0;
          vec3 worldN = normalize(gTangent * mapN.x + gBitangent * mapN.y + gWorldN * mapN.z);
          normal = normalize((viewMatrix * vec4(worldN, 0.0)).xyz);
        }`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        "#include <roughnessmap_fragment>\nroughnessFactor = mix(gKind > 2.5 ? 0.6 : 0.88, 0.16, gGlass);",
      )
      .replace("#include <metalnessmap_fragment>", "#include <metalnessmap_fragment>\nmetalnessFactor = gGlass * 0.45;")
      .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance += gLight * uNight;");
  };
  return material;
}

interface GroundMasks {
  water?: DataTexture;
  bridge?: DataTexture;
  road?: DataTexture;
}

/**
 * Ground: pavers / sidewalk tiles everywhere, asphalt where the road mask says
 * so (Tehran), cut away over open water (Amsterdam canals, except bridges).
 * Normal maps are applied in world space (the plane is flat).
 */
export function createGroundMaterial(textures: StreetTextures, masks: GroundMasks, radius: number, tint: string) {
  const material = new MeshStandardMaterial({ color: tint, roughness: 0.62, metalness: 0.05, envMapIntensity: 0.7 });
  material.customProgramCacheKey = () => `street-ground-${masks.road ? "road" : "canal"}`;
  const uniforms = {
    uGround: { value: textures.ground },
    uGroundN: { value: textures.groundNormal },
    uRoad: { value: textures.road ?? textures.ground },
    uRoadN: { value: textures.roadNormal ?? textures.groundNormal },
    uWater: { value: masks.water ?? null },
    uBridge: { value: masks.bridge ?? null },
    uRoadMask: { value: masks.road ?? null },
    uHasWater: { value: masks.water ? 1 : 0 },
    uHasRoad: { value: masks.road ? 1 : 0 },
    // Tiles about 2.2 m (pavers) / 3 m (asphalt grain) per texture repeat.
    uRepeat: { value: (2 * radius) / 2.2 },
    uRoadRepeat: { value: (2 * radius) / 3 },
  };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec2 vGround;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvGround = uv;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform sampler2D uGround; uniform sampler2D uGroundN; uniform sampler2D uRoad; uniform sampler2D uRoadN;
        uniform sampler2D uWater; uniform sampler2D uBridge; uniform sampler2D uRoadMask;
        uniform float uHasWater; uniform float uHasRoad; uniform float uRepeat; uniform float uRoadRepeat;
        varying vec2 vGround;
        float gRoad = 0.0;`,
      )
      .replace(
        "void main() {",
        // Plane uv: x → north, y → −east. Mask uv: (east, north).
        `void main() {
          vec2 maskUv = vec2(1.0 - vGround.y, vGround.x);
          if (uHasWater > 0.5 && texture2D(uWater, maskUv).r > 0.5 && texture2D(uBridge, maskUv).r < 0.5) discard;
          gRoad = uHasRoad > 0.5 ? texture2D(uRoadMask, maskUv).r : 0.0;`,
      )
      .replace(
        "#include <map_fragment>",
        `vec3 groundTex = texture2D(uGround, vGround * uRepeat).rgb;
         vec3 roadTex = texture2D(uRoad, vGround * uRoadRepeat).rgb * 0.75;
         diffuseColor.rgb *= mix(groundTex, roadTex, gRoad);`,
      )
      .replace(
        "#include <normal_fragment_maps>",
        `{
          vec3 mapN = mix(texture2D(uGroundN, vGround * uRepeat).xyz, texture2D(uRoadN, vGround * uRoadRepeat).xyz, gRoad) * 2.0 - 1.0;
          // Flat ground: tangent = +x (north), bitangent = −z, normal = +y.
          vec3 worldN = normalize(vec3(mapN.x, mapN.z, -mapN.y));
          normal = normalize((viewMatrix * vec4(worldN, 0.0)).xyz);
        }`,
      )
      .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\nroughnessFactor = mix(0.62, 0.78, gRoad);");
  };
  return material;
}

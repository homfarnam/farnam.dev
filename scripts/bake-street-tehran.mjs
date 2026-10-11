// Bakes the Tajrish (Tehran) street walk at real scale (1 unit = 1 m):
//   public/geo/street/tajrish.glb  — buildings (OSM footprints + generated infill), meshopt
//   public/geo/street/tajrish.bin  — walk + road masks, jubs, trees, lamps, landmarks
//
//   node scripts/fetch-street.mjs tajrish && node scripts/bake-street-tehran.mjs
//
// Honesty notes: streets, mapped buildings and landmarks come from OpenStreetMap
// (ODbL). Tehran's OSM building coverage is incomplete, so empty street frontage
// is filled with generated apartment blocks (attribute _KIND = 1). Heights are
// from OSM where tagged, otherwise plausible. Chenar trees, jubs and lamps along
// the main roads are generated decor.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { Document, NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { meshopt, quantize, weld } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";
import { ShapeUtils, Vector2 } from "three";
import { STREETS } from "./street.config.mjs";

const root = new URL("../", import.meta.url);
await mkdir(new URL("public/geo/street/", root), { recursive: true });
await MeshoptDecoder.ready;
await MeshoptEncoder.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.decoder": MeshoptDecoder, "meshopt.encoder": MeshoptEncoder });

const street = STREETS.find((candidate) => candidate.id === "tajrish");
const R = street.radius;
const CELL = 0.5;
const SIZE = Math.ceil((2 * R) / CELL);
const FLOOR = 3.2;

/** Road widths (metres) by OSM class; asphalt for vehicles, paved for pedestrian ways. */
const ROAD_WIDTH = {
  motorway: 22,
  trunk: 20,
  primary: 18,
  primary_link: 9,
  secondary: 13,
  secondary_link: 8,
  tertiary: 10,
  tertiary_link: 7,
  residential: 7,
  unclassified: 7,
  living_street: 6,
  service: 4.5,
};
const PAVED_WIDTH = { pedestrian: 7, footway: 2.5, path: 2, steps: 2.5, cycleway: 2.5 };
const MAJOR = new Set(["trunk", "primary", "secondary", "tertiary"]);

let rngState = 20220301;
const random = () => {
  rngState = (rngState * 16807) % 2147483647;
  return (rngState - 1) / 2147483646;
};

const cosLat = Math.cos((street.lat * Math.PI) / 180);
const local = (lon, lat) => [(lat - street.lat) * 110540, (lon - street.lon) * 111320 * cosLat]; // [north, east]
const toCell = ([north, east]) => [(east + R) / CELL, (north + R) / CELL];
const index = (u, v) => v * SIZE + u;
const inside = (u, v) => u >= 0 && v >= 0 && u < SIZE && v < SIZE;

const road = new Uint8Array(SIZE * SIZE); // asphalt
const paved = new Uint8Array(SIZE * SIZE); // pedestrian paving (visual only)
const built = new Uint8Array(SIZE * SIZE); // any building footprint

function stampDisc(north, east, radius, target) {
  const [cu, cv] = toCell([north, east]);
  const r = radius / CELL;
  for (let dv = -Math.ceil(r); dv <= r; dv += 1) {
    for (let du = -Math.ceil(r); du <= r; du += 1) {
      if (du * du + dv * dv > r * r) continue;
      const u = Math.round(cu + du);
      const v = Math.round(cv + dv);
      if (inside(u, v)) target[index(u, v)] = 1;
    }
  }
}
function stampLine(a, b, halfWidth, target) {
  const steps = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / (CELL * 0.75)));
  for (let s = 0; s <= steps; s += 1) {
    stampDisc(a[0] + ((b[0] - a[0]) * s) / steps, a[1] + ((b[1] - a[1]) * s) / steps, halfWidth, target);
  }
}
function fillPolygon(points, target) {
  const cells = points.map(toCell);
  for (let v = 0; v < SIZE; v += 1) {
    const sy = v + 0.5;
    const xs = [];
    for (let i = 0; i < cells.length; i += 1) {
      const a = cells[i];
      const b = cells[(i + 1) % cells.length];
      if ((a[1] <= sy && b[1] > sy) || (b[1] <= sy && a[1] > sy)) xs.push(a[0] + ((sy - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      for (let u = Math.max(0, Math.ceil(xs[k] - 0.5)); u <= Math.min(SIZE - 1, Math.floor(xs[k + 1] - 0.5)); u += 1)
        target[index(u, v)] = 1;
    }
  }
}

const raw = JSON.parse(await readFile(new URL("data-raw/osm/street-tajrish.json", root), "utf8"));

// ───────── Roads ─────────
const roadLines = []; // { points, width, major }
for (const element of raw.elements) {
  const tags = element.tags ?? {};
  if (element.type !== "way" || !tags.highway || !element.geometry) continue;
  const points = element.geometry.map(({ lon, lat }) => local(lon, lat));
  const asphalt = ROAD_WIDTH[tags.highway];
  const pavedWidth = PAVED_WIDTH[tags.highway];
  if (asphalt) {
    for (let i = 0; i + 1 < points.length; i += 1) stampLine(points[i], points[i + 1], asphalt / 2, road);
    roadLines.push({ points, width: asphalt, major: MAJOR.has(tags.highway.replace("_link", "")) });
  } else if (pavedWidth) {
    for (let i = 0; i + 1 < points.length; i += 1) stampLine(points[i], points[i + 1], pavedWidth / 2, paved);
  }
}

// ───────── Buildings ─────────
const positions = [];
const seeds = [];
const kinds = [];
const indices = [];
const landmarks = []; // north, east, radius, kind (1 = Imamzadeh Saleh)

function addPrism(footprint, height, seed, kind) {
  // footprint: [north, east][] (not closed). Contour in shape space (east, north), CCW.
  let contour = footprint.map(([n, e]) => new Vector2(e, n));
  if (ShapeUtils.isClockWise(contour)) contour = contour.reverse();
  const base = positions.length / 3;
  const count = contour.length;
  for (const point of contour) {
    positions.push(point.y, 0, point.x);
    seeds.push(seed);
    kinds.push(kind);
  }
  for (const point of contour) {
    positions.push(point.y, height, point.x);
    seeds.push(seed);
    kinds.push(kind);
  }
  for (let i = 0; i < count; i += 1) {
    const j = (i + 1) % count;
    indices.push(base + i, base + count + i, base + j, base + j, base + count + i, base + count + j);
  }
  for (const [a, b, c] of ShapeUtils.triangulateShape(contour, []))
    indices.push(base + count + a, base + count + c, base + count + b);
}

// OSM sometimes maps a place twice (e.g. a bazaar outline plus each shop inside it).
// Coincident walls z-fight, so keep the detailed footprints: smallest first, and skip
// any footprint that mostly overlaps what is already built.
const footprints = [];
for (const element of raw.elements) {
  const tags = element.tags ?? {};
  if (element.type !== "way" || !tags.building || !element.geometry) continue;
  const ring = element.geometry.map(({ lon, lat }) => local(lon, lat));
  if (ring.length > 1 && ring[0][0] === ring.at(-1)[0] && ring[0][1] === ring.at(-1)[1]) ring.pop();
  if (ring.length < 3) continue;
  let area = 0;
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    area += a[1] * b[0] - b[1] * a[0];
  }
  footprints.push({ element, tags, ring, area: Math.abs(area / 2) });
}
footprints.sort((a, b) => a.area - b.area);

// Named shrine points (OSM often names the point, not the building outline).
const namedShrines = raw.elements
  .filter(
    (e) =>
      e.type === "node" &&
      e.tags?.amenity === "place_of_worship" &&
      /صالح|Saleh/.test(`${e.tags.name ?? ""} ${e.tags["name:en"] ?? ""}`),
  )
  .map((e) => local(e.lon, e.lat));

let osmBuildings = 0;
let overlapping = 0;
for (const { tags, ring } of footprints) {
  const cn = ring.reduce((sum, p) => sum + p[0], 0) / ring.length;
  const ce = ring.reduce((sum, p) => sum + p[1], 0) / ring.length;
  if (Math.hypot(cn, ce) > R - 4) continue;
  const mask = new Uint8Array(SIZE * SIZE);
  fillPolygon(ring, mask);
  let total = 0;
  let covered = 0;
  for (let i = 0; i < mask.length; i += 1) {
    if (!mask[i]) continue;
    total += 1;
    if (built[i]) covered += 1;
  }
  if (total && covered / total > 0.35) {
    overlapping += 1;
    continue;
  }
  for (let i = 0; i < mask.length; i += 1) if (mask[i]) built[i] = 1;
  const worship = tags.amenity === "place_of_worship" || tags.building === "mosque";
  const named = `${tags.name ?? ""} ${tags["name:en"] ?? ""}`;
  const isMainShrine = worship && (/صالح|Saleh/.test(named) || namedShrines.some(([n, e]) => Math.hypot(n - cn, e - ce) < 30));
  if (isMainShrine) {
    // Rendered as dome + minarets on this footprint by the client, not as a windowed block.
    const radius = Math.sqrt(ring.reduce((m, p) => Math.max(m, (p[0] - cn) ** 2 + (p[1] - ce) ** 2), 0));
    landmarks.push(cn, ce, radius, 1);
    osmBuildings += 1;
    continue;
  }
  const shrine = tags.amenity === "place_of_worship" || tags.building === "mosque";
  const levels = parseFloat(tags["building:levels"] ?? "");
  const height = parseFloat(tags.height ?? "");
  const h = Number.isFinite(height)
    ? height
    : Number.isFinite(levels)
      ? levels * FLOOR + 0.6
      : shrine
        ? 9
        : (2 + Math.floor(random() * 4)) * FLOOR + 0.6;
  addPrism(ring, h, random(), 0);
  osmBuildings += 1;
  if (shrine) {
    const radius = Math.sqrt(ring.reduce((m, p) => Math.max(m, (p[0] - cn) ** 2 + (p[1] - ce) ** 2), 0));
    const name = `${tags.name ?? ""} ${tags["name:en"] ?? ""}`;
    landmarks.push(cn, ce, radius, 0);
  }
}
// Shrines mapped only as nodes still get a landmark marker.
for (const element of raw.elements) {
  const tags = element.tags ?? {};
  if (element.type === "node" && tags.amenity === "place_of_worship") {
    const [n, e] = local(element.lon, element.lat);
    if (
      Math.hypot(n, e) < R &&
      !landmarks.some((_, i) => i % 4 === 0 && Math.hypot(landmarks[i] - n, landmarks[i + 1] - e) < 25)
    ) {
      landmarks.push(n, e, 10, /صالح|Saleh/.test(`${tags.name ?? ""} ${tags["name:en"] ?? ""}`) ? 1 : 0);
    }
  }
}

// ───────── Generated infill along real streets ─────────
let generated = 0;
const free = (n, e) => {
  const [cu, cv] = toCell([n, e]);
  const u = Math.floor(cu);
  const v = Math.floor(cv);
  return inside(u, v) && !road[index(u, v)] && !paved[index(u, v)] && !built[index(u, v)] && Math.hypot(n, e) < R - 6;
};
for (const { points, width } of roadLines) {
  for (let i = 0; i + 1 < points.length; i += 1) {
    const [n1, e1] = points[i];
    const [n2, e2] = points[i + 1];
    const length = Math.hypot(n2 - n1, e2 - e1);
    if (length < 6) continue;
    const dir = [(n2 - n1) / length, (e2 - e1) / length];
    for (const side of [1, -1]) {
      const normal = [-dir[1] * side, dir[0] * side];
      const setback = width / 2 + 3.2; // sidewalk
      let t = 1;
      while (t < length - 6) {
        const frontage = 8 + random() * 8;
        const depth = 12 + random() * 9;
        const a = [n1 + dir[0] * t + normal[0] * setback, e1 + dir[1] * t + normal[1] * setback];
        const corners = [
          a,
          [a[0] + dir[0] * frontage, a[1] + dir[1] * frontage],
          [a[0] + dir[0] * frontage + normal[0] * depth, a[1] + dir[1] * frontage + normal[1] * depth],
          [a[0] + normal[0] * depth, a[1] + normal[1] * depth],
        ];
        let ok = true;
        for (let s = 0; s <= frontage && ok; s += 1) {
          for (let d = 0; d <= depth && ok; d += 1) {
            if (!free(a[0] + dir[0] * s + normal[0] * d, a[1] + dir[1] * s + normal[1] * d)) ok = false;
          }
        }
        if (ok) {
          fillPolygon(corners, built);
          const floors = 3 + Math.floor(random() * 4);
          addPrism(corners, floors * FLOOR + 0.6, random(), 1);
          generated += 1;
          t += frontage;
        } else {
          t += 1.5;
        }
      }
    }
  }
}

// ───────── Chenar trees, jubs and lamps along the main roads (generated decor) ─────────
const trees = [];
const lamps = [];
const jubs = [];
for (const element of raw.elements) {
  if (element.type === "node" && element.tags?.natural === "tree") {
    const [n, e] = local(element.lon, element.lat);
    if (Math.hypot(n, e) < R) trees.push(n, e, 1);
  }
  if (element.type === "node" && element.tags?.highway === "street_lamp") {
    const [n, e] = local(element.lon, element.lat);
    if (Math.hypot(n, e) < R) lamps.push(n, e);
  }
}
const osmLamps = lamps.length / 2;
const notBuilt = (n, e) => {
  const [cu, cv] = toCell([n, e]);
  const u = Math.floor(cu);
  const v = Math.floor(cv);
  return inside(u, v) && !built[index(u, v)] && Math.hypot(n, e) < R - 3;
};
for (const { points, width, major } of roadLines) {
  if (!major) continue;
  let sinceTree = 0;
  let sinceLamp = 12;
  for (let i = 0; i + 1 < points.length; i += 1) {
    const [n1, e1] = points[i];
    const [n2, e2] = points[i + 1];
    const length = Math.hypot(n2 - n1, e2 - e1);
    if (length < 0.5) continue;
    const dir = [(n2 - n1) / length, (e2 - e1) / length];
    const normal = [-dir[1], dir[0]];
    for (const side of [1, -1]) {
      const jubOffset = width / 2 + 0.45;
      const a = [n1 + normal[0] * side * jubOffset, e1 + normal[1] * side * jubOffset];
      const b = [n2 + normal[0] * side * jubOffset, e2 + normal[1] * side * jubOffset];
      if (notBuilt(...a) && notBuilt(...b)) jubs.push(...a, ...b);
    }
    for (let t = 0; t < length; t += 1) {
      sinceTree += 1;
      sinceLamp += 1;
      for (const side of [1, -1]) {
        const n = n1 + dir[0] * t + normal[0] * side * (width / 2 + 1.4);
        const e = e1 + dir[1] * t + normal[1] * side * (width / 2 + 1.4);
        if (sinceTree >= 8 && notBuilt(n, e)) trees.push(n, e, 0);
        if (sinceLamp >= 30 && side === 1 && notBuilt(n, e)) lamps.push(n + normal[0] * 0.6, e + normal[1] * 0.6);
      }
      if (sinceTree >= 8) sinceTree = 0;
      if (sinceLamp >= 30) sinceLamp = 0;
    }
  }
}

// ───────── Walk mask and spawn ─────────
const walk = new Uint8Array(SIZE * SIZE);
for (let v = 0; v < SIZE; v += 1) {
  for (let u = 0; u < SIZE; u += 1) {
    const n = v * CELL - R;
    const e = u * CELL - R;
    walk[index(u, v)] = !built[index(u, v)] && Math.hypot(n, e) < R - 2 ? 1 : 0;
  }
}
let spawn = null;
for (let r = 0; r < SIZE / 2 && !spawn; r += 1) {
  for (let dv = -r; dv <= r && !spawn; dv += 1) {
    for (let du = -r; du <= r && !spawn; du += 1) {
      const u = SIZE / 2 + du;
      const v = SIZE / 2 + dv;
      // Start on a sidewalk: walkable, not asphalt, but near a road.
      if (inside(u, v) && walk[index(u, v)] && !road[index(u, v)] && inside(u, v - 6) && road[index(u, v - 6)]) {
        spawn = [v * CELL - R + CELL / 2, u * CELL - R + CELL / 2];
      }
    }
  }
}

// ───────── Write ─────────
const document = new Document();
const buffer = document.createBuffer();
const primitive = document
  .createPrimitive()
  .setAttribute("POSITION", document.createAccessor().setType("VEC3").setArray(new Float32Array(positions)).setBuffer(buffer))
  .setAttribute("_SEED", document.createAccessor().setType("SCALAR").setArray(new Float32Array(seeds)).setBuffer(buffer))
  .setAttribute("_KIND", document.createAccessor().setType("SCALAR").setArray(new Float32Array(kinds)).setBuffer(buffer))
  .setIndices(document.createAccessor().setType("SCALAR").setArray(new Uint32Array(indices)).setBuffer(buffer));
document
  .createScene("scene")
  .addChild(document.createNode(street.id).setMesh(document.createMesh(street.id).addPrimitive(primitive)));
document.getRoot().getAsset().copyright = "Footprints © OpenStreetMap contributors (ODbL); infill generated";
await document.transform(
  weld(),
  quantize({ quantizePosition: 16, pattern: /^(POSITION|_SEED|_KIND)$/ }),
  meshopt({ encoder: MeshoptEncoder, level: "high" }),
);
const glb = await io.writeBinary(document);
await writeFile(new URL(`public/geo/street/${street.id}.glb`, root), glb);

const buffers = {
  walk,
  road,
  paved,
  jubs: new Float32Array(jubs),
  trees: new Float32Array(trees),
  lamps: new Float32Array(lamps),
  landmarks: new Float32Array(landmarks),
};
let offset = 0;
const layout = {};
for (const [key, array] of Object.entries(buffers)) {
  layout[key] = { offset, length: array.length, type: array.constructor.name };
  offset = Math.ceil((offset + array.byteLength) / 4) * 4;
}
const header = {
  id: street.id,
  name: street.name,
  radius: R,
  cell: CELL,
  size: SIZE,
  spawn,
  facing: street.facing,
  buffers: layout,
};
const json = new TextEncoder().encode(JSON.stringify(header));
const headerLength = Math.ceil((json.length + 4) / 4) * 4;
const out = new Uint8Array(headerLength + offset);
new DataView(out.buffer).setUint32(0, json.length, true);
out.set(json, 4);
for (const [key, array] of Object.entries(buffers))
  out.set(new Uint8Array(array.buffer, array.byteOffset, array.byteLength), headerLength + layout[key].offset);
await writeFile(new URL(`public/geo/street/${street.id}.bin`, root), out);

console.log(
  `tajrish: ${osmBuildings} OSM buildings (${overlapping} overlapping outlines skipped) + ${generated} generated, ${indices.length / 3} tris, glb ${(glb.byteLength / 1048576).toFixed(2)} MB; ` +
    `${roadLines.length} roads, ${jubs.length / 4} jub segments, ${trees.length / 3} trees, ${lamps.length / 2} lamps (${osmLamps} OSM), ` +
    `${landmarks.length / 4} landmarks; spawn ${spawn?.map((v) => v.toFixed(1))}; bin ${(out.byteLength / 1048576).toFixed(2)} MB`,
);

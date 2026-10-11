// Bakes 3D BAG LoD2.2 buildings (real measured roofs and heights) around Dam
// Square into public/geo/amsterdam-3dbag.bin.
//
//   node scripts/bake-3dbag.mjs        # downloads tiles once into data-raw/3dbag (gitignored)
//
// Data: 3DBAG by tudelft3d and 3DGI, CC BY 4.0 — https://3dbag.nl
import { writeFile, readFile } from "node:fs/promises";
import { Document, NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { meshopt, quantize, weld } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";
import { cached, ecef, tilesAround } from "./3dbag-tiles.mjs";
import { CITIES } from "./cities.config.mjs";

const root = new URL("../", import.meta.url);
const geo = JSON.parse(await readFile(new URL("src/data/geo.json", root), "utf8"));
const city = CITIES.find((candidate) => candidate.id === "amsterdam");
// `node scripts/bake-3dbag.mjs lite` bakes a smaller set for phones / low quality.
const LITE = process.argv[2] === "lite";
const RADIUS = LITE ? 800 : city.radius; // metres of real city to keep
const metresToUnits = geo.diorama.radius / city.displayRadius;
const HEIGHT_SCALE = 1.5; // gentle lift so streets read from above; footprints stay true

await MeshoptDecoder.ready;
await MeshoptEncoder.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.decoder": MeshoptDecoder, "meshopt.encoder": MeshoptEncoder });
const MIN_FOOTPRINT_M2 = 30;

// ECEF → local East-North-Up at Dam.
const φ = (city.lat * Math.PI) / 180;
const λ = (city.lon * Math.PI) / 180;
const origin = ecef(city.lat, city.lon, 0);
const east = [-Math.sin(λ), Math.cos(λ), 0];
const north = [-Math.sin(φ) * Math.cos(λ), -Math.sin(φ) * Math.sin(λ), Math.cos(φ)];
const up = [Math.cos(φ) * Math.cos(λ), Math.cos(φ) * Math.sin(λ), Math.sin(φ)];
function toENU(x, y, z) {
  const d = [x - origin[0], y - origin[1], z - origin[2]];
  return [
    d[0] * east[0] + d[1] * east[1] + d[2] * east[2],
    d[0] * north[0] + d[1] * north[1] + d[2] * north[2],
    d[0] * up[0] + d[1] * up[1] + d[2] * up[2],
  ];
}

const uris = await tilesAround(city.lat, city.lon, RADIUS);
console.log(`3D BAG: ${uris.length} tiles within ${RADIUS} m`);

/** building key → { vertices: [e,n,u][], triangles: [a,b,c][] } */
const buildings = new Map();

for (const uri of uris) {
  const document = await io.readBinary(new Uint8Array(await cached(uri)));
  for (const node of document.getRoot().listNodes()) {
    const mesh = node.getMesh();
    if (!mesh) continue;
    const m = node.getWorldMatrix();
    for (const primitive of mesh.listPrimitives()) {
      const position = primitive.getAttribute("POSITION");
      const feature = primitive.getAttribute("_FEATURE_ID_0");
      const indices = primitive.getIndices();
      if (!position || !indices) continue;
      const local = [0, 0, 0];
      const enu = new Array(position.getCount());
      const ids = new Array(position.getCount());
      for (let i = 0; i < position.getCount(); i += 1) {
        position.getElement(i, local);
        // glTF is Y-up; 3D Tiles content maps glTF (x, y, z) → ECEF (x, -z, y) after the node transform.
        const gx = m[0] * local[0] + m[4] * local[1] + m[8] * local[2] + m[12];
        const gy = m[1] * local[0] + m[5] * local[1] + m[9] * local[2] + m[13];
        const gz = m[2] * local[0] + m[6] * local[1] + m[10] * local[2] + m[14];
        enu[i] = toENU(gx, -gz, gy);
        ids[i] = feature ? feature.getScalar(i) : 0;
      }
      for (let t = 0; t < indices.getCount(); t += 3) {
        const a = indices.getScalar(t);
        const b = indices.getScalar(t + 1);
        const c = indices.getScalar(t + 2);
        const key = `${uri}#${ids[a]}`;
        let building = buildings.get(key);
        if (!building) {
          building = { map: new Map(), vertices: [], triangles: [] };
          buildings.set(key, building);
        }
        const tri = [a, b, c].map((index) => {
          let mapped = building.map.get(index);
          if (mapped === undefined) {
            mapped = building.vertices.length;
            building.vertices.push(enu[index]);
            building.map.set(index, mapped);
          }
          return mapped;
        });
        building.triangles.push(tri);
      }
    }
  }
}

// Keep whole buildings whose footprint centre is inside the circle; rest each on the ground.
const positions = [];
const seeds = [];
const radii = [];
const indices = [];
let kept = 0;
let seedCounter = 0;
const seenBuildings = new Set();
let duplicateBuildings = 0;
for (const building of buildings.values()) {
  const n = building.vertices.length;
  if (!n) continue;
  let ce = 0;
  let cn = 0;
  let minUp = Infinity;
  for (const [e, nn, u] of building.vertices) {
    ce += e;
    cn += nn;
    minUp = Math.min(minUp, u);
  }
  ce /= n;
  cn /= n;
  const distance = Math.hypot(ce, cn);
  if (distance > RADIUS) continue;
  // Buildings straddling tile borders appear in both tiles; keep one copy (z-fighting otherwise).
  const identity = `${Math.round(ce)}|${Math.round(cn)}|${building.triangles.length}`;
  if (seenBuildings.has(identity)) {
    duplicateBuildings += 1;
    continue;
  }
  seenBuildings.add(identity);
  // Skip sheds and kiosks: bounding footprint under ~30 m².
  let minE = Infinity;
  let maxE = -Infinity;
  let minN = Infinity;
  let maxN = -Infinity;
  for (const [e, nn] of building.vertices) {
    minE = Math.min(minE, e);
    maxE = Math.max(maxE, e);
    minN = Math.min(minN, nn);
    maxN = Math.max(maxN, nn);
  }
  if ((maxE - minE) * (maxN - minN) < MIN_FOOTPRINT_M2) continue;
  const base = positions.length / 3;
  const seed = ((seedCounter++ * 2654435761) % 1000) / 1000;
  for (const [e, nn, u] of building.vertices) {
    // Chamber axes: x = north, z = east, y = up.
    positions.push(nn * metresToUnits, (u - minUp) * metresToUnits * HEIGHT_SCALE, e * metresToUnits);
    seeds.push(seed);
    radii.push(distance * metresToUnits);
  }
  // glTF→ECEF, ECEF→ENU and ENU→(north, up, east) are all proper rotations (det +1),
  // so the source winding stays outward-facing.
  for (const [a, b, c] of building.triangles) indices.push(base + a, base + b, base + c);
  kept += 1;
}

// Pack as a meshopt-compressed glTF: welded, quantized, decoded in the browser by
// three's bundled MeshoptDecoder (no external download).
const document = new Document();
const buffer = document.createBuffer();
const primitive = document
  .createPrimitive()
  .setAttribute("POSITION", document.createAccessor().setType("VEC3").setArray(new Float32Array(positions)).setBuffer(buffer))
  .setAttribute("_SEED", document.createAccessor().setType("SCALAR").setArray(new Float32Array(seeds)).setBuffer(buffer))
  .setAttribute("_RADIUS", document.createAccessor().setType("SCALAR").setArray(new Float32Array(radii)).setBuffer(buffer))
  .setIndices(document.createAccessor().setType("SCALAR").setArray(new Uint32Array(indices)).setBuffer(buffer));
const mesh = document.createMesh("amsterdam-3dbag").addPrimitive(primitive);
const sceneNode = document.createNode("amsterdam-3dbag").setMesh(mesh);
document.createScene("scene").addChild(sceneNode);
document.getRoot().getAsset().copyright = "3DBAG by tudelft3d and 3DGI, CC BY 4.0";
await document.transform(
  weld(),
  quantize({ quantizePosition: 14, pattern: /^(POSITION|_SEED|_RADIUS)$/ }),
  meshopt({ encoder: MeshoptEncoder, level: "high" }),
);
const glb = await io.writeBinary(document);
await writeFile(new URL(`public/geo/amsterdam-3dbag${LITE ? "-lite" : ""}.glb`, root), glb);
console.log(
  `amsterdam-3dbag: ${kept} buildings (${duplicateBuildings} tile-border duplicates removed), ${positions.length / 3} verts (pre-weld), ${indices.length / 3} tris → ${(glb.byteLength / 1048576).toFixed(2)} MB glb`,
);

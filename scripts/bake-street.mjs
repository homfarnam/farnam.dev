// Bakes a street-level walk area at real scale (1 unit = 1 m):
//   public/geo/street/<id>.glb  — 3D BAG LoD2.2 buildings (meshopt), CC BY 4.0
//   public/geo/street/<id>.bin  — water + walk masks, quay edges, bridges, trees, lamps
//
//   node scripts/fetch-street.mjs && node scripts/bake-street.mjs
//
// Axes: x = north, z = east, y = up, origin at the walk centre.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { Document, NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { meshopt, quantize, weld } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";
import { cached, ecef, tilesAround } from "./3dbag-tiles.mjs";
import { STREETS } from "./street.config.mjs";

const root = new URL("../", import.meta.url);
await mkdir(new URL("public/geo/street/", root), { recursive: true });
await MeshoptDecoder.ready;
await MeshoptEncoder.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.decoder": MeshoptDecoder, "meshopt.encoder": MeshoptEncoder });

const CELL = 0.5; // metres per mask cell
const BRIDGE_HALF_WIDTH = 3.6;
const TREE_SPACING = 11; // generated canal-side trees, where OSM has none nearby

function writeContainer(path, header, buffers) {
  let offset = 0;
  const layout = {};
  for (const [key, array] of Object.entries(buffers)) {
    layout[key] = { offset, length: array.length, type: array.constructor.name };
    offset = Math.ceil((offset + array.byteLength) / 4) * 4;
  }
  const json = new TextEncoder().encode(JSON.stringify({ ...header, buffers: layout }));
  const headerLength = Math.ceil((json.length + 4) / 4) * 4;
  const out = new Uint8Array(headerLength + offset);
  new DataView(out.buffer).setUint32(0, json.length, true);
  out.set(json, 4);
  for (const [key, array] of Object.entries(buffers)) {
    out.set(new Uint8Array(array.buffer, array.byteOffset, array.byteLength), headerLength + layout[key].offset);
  }
  return writeFile(path, out).then(() => out.byteLength);
}

for (const street of STREETS.filter((candidate) => candidate.buildings === "3dbag")) {
  const R = street.radius;
  const size = Math.ceil((2 * R) / CELL);
  const cosLat = Math.cos((street.lat * Math.PI) / 180);
  const local = (lon, lat) => [(lat - street.lat) * 110540, (lon - street.lon) * 111320 * cosLat]; // [north, east]
  const toCell = ([north, east]) => [(east + R) / CELL, (north + R) / CELL]; // [u, v] → u along east, v along north

  // ───────── Buildings (3D BAG), real metres ─────────
  const φ = (street.lat * Math.PI) / 180;
  const λ = (street.lon * Math.PI) / 180;
  const origin = ecef(street.lat, street.lon, 0);
  const E = [-Math.sin(λ), Math.cos(λ), 0];
  const N = [-Math.sin(φ) * Math.cos(λ), -Math.sin(φ) * Math.sin(λ), Math.cos(φ)];
  const U = [Math.cos(φ) * Math.cos(λ), Math.cos(φ) * Math.sin(λ), Math.sin(φ)];
  const enu = (x, y, z) => {
    const d = [x - origin[0], y - origin[1], z - origin[2]];
    return [
      d[0] * E[0] + d[1] * E[1] + d[2] * E[2],
      d[0] * N[0] + d[1] * N[1] + d[2] * N[2],
      d[0] * U[0] + d[1] * U[1] + d[2] * U[2],
    ];
  };

  const buildings = new Map();
  for (const uri of await tilesAround(street.lat, street.lon, R + 50)) {
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
        const p = [0, 0, 0];
        const points = [];
        const ids = [];
        for (let i = 0; i < position.getCount(); i += 1) {
          position.getElement(i, p);
          const gx = m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12];
          const gy = m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13];
          const gz = m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14];
          points.push(enu(gx, -gz, gy));
          ids.push(feature ? feature.getScalar(i) : 0);
        }
        for (let t = 0; t < indices.getCount(); t += 3) {
          const tri = [indices.getScalar(t), indices.getScalar(t + 1), indices.getScalar(t + 2)];
          const key = `${uri}#${ids[tri[0]]}`;
          let building = buildings.get(key);
          if (!building) buildings.set(key, (building = { map: new Map(), vertices: [], triangles: [] }));
          building.triangles.push(
            tri.map((index) => {
              let mapped = building.map.get(index);
              if (mapped === undefined) {
                mapped = building.vertices.length;
                building.vertices.push(points[index]);
                building.map.set(index, mapped);
              }
              return mapped;
            }),
          );
        }
      }
    }
  }

  const positions = [];
  const seeds = [];
  const indices = [];
  const footprints = [];
  let kept = 0;
  let counter = 0;
  // Buildings straddling tile borders appear in both tiles; keep one copy (z-fighting otherwise).
  const seen = new Set();
  let duplicates = 0;
  for (const building of buildings.values()) {
    const n = building.vertices.length;
    if (!n) continue;
    let ce = 0;
    let cn = 0;
    let minUp = Infinity;
    let maxUp = -Infinity;
    for (const [e, nn, u] of building.vertices) {
      ce += e;
      cn += nn;
      minUp = Math.min(minUp, u);
      maxUp = Math.max(maxUp, u);
    }
    if (Math.hypot(ce / n, cn / n) > R) continue;
    const identity = `${Math.round(ce / n)}|${Math.round(cn / n)}|${Math.round(maxUp - minUp)}|${building.triangles.length}`;
    if (seen.has(identity)) {
      duplicates += 1;
      continue;
    }
    seen.add(identity);
    const base = positions.length / 3;
    const seed = ((counter++ * 2654435761) % 1000) / 1000;
    for (const [e, nn, u] of building.vertices) {
      positions.push(nn, u - minUp, e);
      seeds.push(seed);
    }
    for (const [a, b, c] of building.triangles) {
      indices.push(base + a, base + b, base + c);
      const va = building.vertices[a];
      const vb = building.vertices[b];
      const vc = building.vertices[c];
      footprints.push([va[1], va[0]], [vb[1], vb[0]], [vc[1], vc[0]]); // [north, east]
    }
    kept += 1;
  }

  // ───────── Masks ─────────
  const raw = JSON.parse(await readFile(new URL(`data-raw/osm/street-${street.id}.json`, root), "utf8"));
  const water = new Uint8Array(size * size);
  const bridge = new Uint8Array(size * size);
  const building = new Uint8Array(size * size);

  /** Even-odd fill from a bag of edges (order-free, so relation members needn't form tidy rings). */
  function fillEdges(edges, target) {
    for (let y = 0; y < size; y += 1) {
      const sy = y + 0.5;
      const xs = [];
      for (const [a, b] of edges) {
        const [lo, hi] = a[1] < b[1] ? [a, b] : [b, a];
        if (sy >= lo[1] && sy < hi[1]) xs.push(lo[0] + ((sy - lo[1]) / (hi[1] - lo[1])) * (hi[0] - lo[0]));
      }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        for (let x = Math.max(0, Math.ceil(xs[k] - 0.5)); x <= Math.min(size - 1, Math.floor(xs[k + 1] - 0.5)); x += 1)
          target[y * size + x] = 1;
      }
    }
  }

  const waterEdges = [];
  const trees = [];
  const lamps = [];
  const bridges = [];
  for (const element of raw.elements) {
    const tags = element.tags ?? {};
    if (element.type === "node") {
      const [north, east] = local(element.lon, element.lat);
      if (Math.hypot(north, east) > R) continue;
      if (tags.natural === "tree") trees.push(north, east, 1);
      else if (tags.highway === "street_lamp") lamps.push(north, east);
    } else if (tags.bridge && tags.highway && element.geometry) {
      const line = element.geometry.map(({ lon, lat }) => local(lon, lat));
      bridges.push(line);
    } else if (tags.natural === "water" || tags.waterway === "riverbank") {
      const ways =
        element.type === "way" ? [element.geometry] : (element.members ?? []).filter((m) => m.geometry).map((m) => m.geometry);
      for (const way of ways) {
        for (let i = 0; i + 1 < way.length; i += 1) {
          waterEdges.push([toCell(local(way[i].lon, way[i].lat)), toCell(local(way[i + 1].lon, way[i + 1].lat))]);
        }
      }
    }
  }
  fillEdges(waterEdges, water);

  // Bridges: stamp a deck around each bridge way.
  const bridgeSegments = [];
  for (const line of bridges) {
    for (let i = 0; i + 1 < line.length; i += 1) {
      const [n1, e1] = line[i];
      const [n2, e2] = line[i + 1];
      bridgeSegments.push(n1, e1, n2, e2);
      const steps = Math.ceil(Math.hypot(n2 - n1, e2 - e1) / (CELL * 0.5));
      for (let s = 0; s <= steps; s += 1) {
        const n = n1 + ((n2 - n1) * s) / steps;
        const e = e1 + ((e2 - e1) * s) / steps;
        const [cu, cv] = toCell([n, e]);
        const r = BRIDGE_HALF_WIDTH / CELL;
        for (let dv = -r; dv <= r; dv += 1) {
          for (let du = -r; du <= r; du += 1) {
            if (du * du + dv * dv > r * r) continue;
            const u = Math.round(cu + du);
            const v = Math.round(cv + dv);
            if (u >= 0 && v >= 0 && u < size && v < size) bridge[v * size + u] = 1;
          }
        }
      }
    }
  }

  // Building footprints: rasterise every triangle's ground projection.
  for (let i = 0; i < footprints.length; i += 3) {
    const [a, b, c] = [footprints[i], footprints[i + 1], footprints[i + 2]].map(toCell);
    const minU = Math.max(0, Math.floor(Math.min(a[0], b[0], c[0])));
    const maxU = Math.min(size - 1, Math.ceil(Math.max(a[0], b[0], c[0])));
    const minV = Math.max(0, Math.floor(Math.min(a[1], b[1], c[1])));
    const maxV = Math.min(size - 1, Math.ceil(Math.max(a[1], b[1], c[1])));
    const area = (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]);
    if (Math.abs(area) < 1e-6) continue;
    for (let v = minV; v <= maxV; v += 1) {
      for (let u = minU; u <= maxU; u += 1) {
        const px = u + 0.5;
        const py = v + 0.5;
        const w0 = ((b[0] - px) * (c[1] - py) - (c[0] - px) * (b[1] - py)) / area;
        const w1 = ((c[0] - px) * (a[1] - py) - (a[0] - px) * (c[1] - py)) / area;
        const w2 = 1 - w0 - w1;
        if (w0 >= -0.02 && w1 >= -0.02 && w2 >= -0.02) building[v * size + u] = 1;
      }
    }
  }

  // Walkable: not inside a building, and not over water unless on a bridge.
  const walk = new Uint8Array(size * size);
  for (let i = 0; i < walk.length; i += 1) walk[i] = !building[i] && (!water[i] || bridge[i]) ? 1 : 0;

  // Quay edges: marching squares on the water mask → segments (metres) for quay walls.
  const quay = [];
  const at = (u, v) => (u < 0 || v < 0 || u >= size || v >= size ? 0 : water[v * size + u]);
  const toMetres = (u, v) => [v * CELL - R, u * CELL - R]; // [north, east] of a cell corner
  for (let v = 0; v < size - 1; v += 1) {
    for (let u = 0; u < size - 1; u += 1) {
      const code = at(u, v) | (at(u + 1, v) << 1) | (at(u + 1, v + 1) << 2) | (at(u, v + 1) << 3);
      if (code === 0 || code === 15) continue;
      const mid = { b: [u + 1, v + 0.5], r: [u + 1.5, v + 1], t: [u + 1, v + 1.5], l: [u + 0.5, v + 1] };
      const table = {
        1: ["l", "b"],
        2: ["b", "r"],
        3: ["l", "r"],
        4: ["r", "t"],
        6: ["b", "t"],
        7: ["l", "t"],
        8: ["t", "l"],
        9: ["t", "b"],
        11: ["t", "r"],
        12: ["r", "l"],
        13: ["r", "b"],
        14: ["b", "l"],
      };
      const pair = table[code];
      if (code === 5) quay.push(...toMetres(...mid.l), ...toMetres(...mid.t), ...toMetres(...mid.r), ...toMetres(...mid.b));
      else if (code === 10) quay.push(...toMetres(...mid.b), ...toMetres(...mid.l), ...toMetres(...mid.t), ...toMetres(...mid.r));
      else if (pair) quay.push(...toMetres(...mid[pair[0]]), ...toMetres(...mid[pair[1]]));
    }
  }

  // Canal-side trees: OSM is incomplete, so fill gaps along quays (decor, marked kind = 0).
  const nearTree = (n, e, r) => {
    for (let i = 0; i < trees.length; i += 3) if (Math.hypot(trees[i] - n, trees[i + 1] - e) < r) return true;
    return false;
  };
  for (let i = 0; i < quay.length; i += 4) {
    const n = (quay[i] + quay[i + 2]) / 2;
    const e = (quay[i + 1] + quay[i + 3]) / 2;
    // Step 2.5 m inland from the water edge.
    const [cu, cv] = toCell([n, e]);
    let best = null;
    for (const [du, dv] of [
      [5, 0],
      [-5, 0],
      [0, 5],
      [0, -5],
    ]) {
      const u = Math.round(cu + du);
      const v = Math.round(cv + dv);
      if (u >= 0 && v >= 0 && u < size && v < size && walk[v * size + u] && !bridge[v * size + u])
        best = [v * CELL - R, u * CELL - R];
    }
    if (best && !nearTree(best[0], best[1], TREE_SPACING) && Math.hypot(...best) < R - 5) trees.push(best[0], best[1], 0);
  }

  // Spawn: nearest walkable cell to the centre, preferring the quay.
  let spawn = null;
  for (let r = 0; r < size / 2 && !spawn; r += 1) {
    for (let dv = -r; dv <= r && !spawn; dv += 1) {
      for (let du = -r; du <= r && !spawn; du += 1) {
        const u = Math.floor(size / 2) + du;
        const v = Math.floor(size / 2) + dv;
        if (walk[v * size + u] && !bridge[v * size + u]) spawn = [v * CELL - R + CELL / 2, u * CELL - R + CELL / 2];
      }
    }
  }

  // Buildings GLB
  const document = new Document();
  const buffer = document.createBuffer();
  const primitive = document
    .createPrimitive()
    .setAttribute("POSITION", document.createAccessor().setType("VEC3").setArray(new Float32Array(positions)).setBuffer(buffer))
    .setAttribute("_SEED", document.createAccessor().setType("SCALAR").setArray(new Float32Array(seeds)).setBuffer(buffer))
    .setIndices(document.createAccessor().setType("SCALAR").setArray(new Uint32Array(indices)).setBuffer(buffer));
  document
    .createScene("scene")
    .addChild(document.createNode(street.id).setMesh(document.createMesh(street.id).addPrimitive(primitive)));
  document.getRoot().getAsset().copyright = "3DBAG by tudelft3d and 3DGI, CC BY 4.0";
  await document.transform(
    weld(),
    quantize({ quantizePosition: 16, pattern: /^(POSITION|_SEED)$/ }),
    meshopt({ encoder: MeshoptEncoder, level: "high" }),
  );
  const glb = await io.writeBinary(document);
  await writeFile(new URL(`public/geo/street/${street.id}.glb`, root), glb);

  const bytes = await writeContainer(
    new URL(`public/geo/street/${street.id}.bin`, root),
    { id: street.id, name: street.name, radius: R, cell: CELL, size, spawn, facing: street.facing },
    {
      water,
      walk,
      bridge,
      quay: new Float32Array(quay),
      bridges: new Float32Array(bridgeSegments),
      trees: new Float32Array(trees),
      lamps: new Float32Array(lamps),
    },
  );
  const walkable = walk.reduce((sum, value) => sum + value, 0);
  console.log(
    `${street.id}: ${kept} buildings, ${indices.length / 3} tris, glb ${(glb.byteLength / 1048576).toFixed(2)} MB; ` +
      `masks ${size}² (${((100 * walkable) / walk.length).toFixed(0)}% walkable), ${quay.length / 4} quay segments, ` +
      `${bridges.length} bridges, ${trees.length / 3} trees (${trees.filter((_, i) => i % 3 === 2 && trees[i] === 1).length} from OSM), ${lamps.length / 2} lamps; ` +
      `spawn ${spawn?.map((v) => v.toFixed(1))} → bin ${(bytes / 1048576).toFixed(2)} MB`,
  );
}

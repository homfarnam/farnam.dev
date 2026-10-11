// Bakes raw OSM + Natural Earth data (data-raw/, gitignored) into compact binaries
// under public/geo/ that the Journey chapter streams in when it mounts.
//
//   node scripts/fetch-osm.mjs   # once, needs network
//   node scripts/bake-geo.mjs    # offline, deterministic
//
// City data © OpenStreetMap contributors (ODbL). Land: Natural Earth (public domain).
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { ShapeUtils, Vector2 } from "three";
import { CITIES } from "./cities.config.mjs";

const root = new URL("../", import.meta.url);
const geo = JSON.parse(await readFile(new URL("src/data/geo.json", root), "utf8"));
await mkdir(new URL("public/geo/", root), { recursive: true });

const DEG = Math.PI / 180;
const merc = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * DEG) / 2));

/** Big-map projection → chamber-local (x = north, z = east). */
function project(lon, lat) {
  return [(merc(lat) - geo.merc0) * geo.scale, (lon - geo.lon0) * DEG * geo.scale + geo.zOffset];
}

/** Deterministic hash so default heights are stable between bakes. */
function hash(n) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** Write a little container: [u32 headerLength][JSON header][padding to 4][buffers…]. */
async function writeContainer(name, header, buffers) {
  let offset = 0;
  const layout = {};
  for (const [key, array] of Object.entries(buffers)) {
    layout[key] = { offset, length: array.length, type: array.constructor.name };
    offset += array.byteLength;
    offset = Math.ceil(offset / 4) * 4;
  }
  const json = new TextEncoder().encode(JSON.stringify({ ...header, buffers: layout }));
  const headerLength = Math.ceil((json.length + 4) / 4) * 4;
  const out = new Uint8Array(headerLength + offset);
  new DataView(out.buffer).setUint32(0, json.length, true);
  out.set(json, 4);
  for (const [key, array] of Object.entries(buffers)) {
    out.set(new Uint8Array(array.buffer, array.byteOffset, array.byteLength), headerLength + layout[key].offset);
  }
  await writeFile(new URL(`public/geo/${name}.bin`, root), out);
  return out.byteLength;
}

/** Even-odd scanline fill of polygon rings into a Uint8 mask. Rings are arrays of [u, v] in pixel space. */
function rasterize(rings, width, height) {
  const mask = new Uint8Array(width * height);
  const edges = [];
  for (const ring of rings) {
    for (let i = 0; i < ring.length; i += 1) {
      const a = ring[i];
      const b = ring[(i + 1) % ring.length];
      if (a[1] !== b[1]) edges.push(a[1] < b[1] ? [a, b] : [b, a]);
    }
  }
  for (let y = 0; y < height; y += 1) {
    const sy = y + 0.5;
    const xs = [];
    for (const [a, b] of edges) {
      if (sy >= a[1] && sy < b[1]) xs.push(a[0] + ((sy - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const from = Math.max(0, Math.ceil(xs[k] - 0.5));
      const to = Math.min(width - 1, Math.floor(xs[k + 1] - 0.5));
      for (let x = from; x <= to; x += 1) mask[y * width + x] = 255;
    }
  }
  return mask;
}

// ───────────────────────────── Big map: land mask + coastlines ─────────────────────────────
{
  const land = JSON.parse(await readFile(new URL("data-raw/naturalearth/ne_50m_land.geojson", root), "utf8"));
  const { lonMin, lonMax, latMin, latMax } = geo.bounds;
  const [xMin, zMin] = project(lonMin, latMin);
  const [xMax, zMax] = project(lonMax, latMax);
  const width = 1400; // along z (east)
  const height = Math.round((width * (xMax - xMin)) / (zMax - zMin)); // along x (north)
  const toPixel = (lon, lat) => {
    const [x, z] = project(lon, lat);
    return [((z - zMin) / (zMax - zMin)) * width, ((x - xMin) / (xMax - xMin)) * height];
  };

  const rings = [];
  const coast = [];
  for (const feature of land.features) {
    const polygons = feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
    for (const polygon of polygons) {
      for (const ring of polygon) {
        const inView = ring.some(
          ([lon, lat]) => lon > lonMin - 10 && lon < lonMax + 10 && lat > latMin - 10 && lat < latMax + 10,
        );
        if (!inView) continue;
        const clamped = ring.map(([lon, lat]) => [
          Math.max(lonMin - 5, Math.min(lonMax + 5, lon)),
          Math.max(latMin - 5, Math.min(latMax + 5, lat)),
        ]);
        rings.push(clamped.map(([lon, lat]) => toPixel(lon, lat)));
        for (let i = 0; i + 1 < ring.length; i += 1) {
          const [aLon, aLat] = ring[i];
          const [bLon, bLat] = ring[i + 1];
          const inside = (lon, lat) => lon >= lonMin && lon <= lonMax && lat >= latMin && lat <= latMax;
          if (!inside(aLon, aLat) || !inside(bLon, bLat)) continue;
          coast.push(...project(aLon, aLat), ...project(bLon, bLat));
        }
      }
    }
  }
  const mask = rasterize(rings, width, height);
  const bytes = await writeContainer(
    "map",
    { width, height, bounds: { xMin, xMax, zMin, zMax } },
    { land: mask, coast: new Float32Array(coast) },
  );
  console.log(`map: ${width}×${height} land mask, ${coast.length / 4} coast segments, ${(bytes / 1024).toFixed(0)} KB`);
}

// ───────────────────────────── City dioramas ─────────────────────────────
const LEVEL_HEIGHT = 3.2;

function heightOf(tags, id, city) {
  const explicit = parseFloat(tags.height ?? "");
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  const levels = parseFloat(tags["building:levels"] ?? "");
  if (Number.isFinite(levels) && levels > 0) return levels * LEVEL_HEIGHT + 1;
  // No data: plausible defaults per city (marked as approximated in the credits).
  const r = hash(id);
  return city.id === "amsterdam" ? 11 + r * 6 : 7 + r * r * 18;
}

function ringArea(points) {
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    area += a.x * b.y - b.x * a.y;
  }
  return area / 2;
}

for (const city of CITIES) {
  const raw = JSON.parse(await readFile(new URL(`data-raw/osm/${city.id}.json`, root), "utf8"));
  const metresToUnits = geo.diorama.radius / city.displayRadius;
  const R = city.radius * metresToUnits; // baked extent in units (≥ the plinth)
  const lift = geo.diorama.heightExaggeration;
  const cosLat = Math.cos(city.lat * DEG);
  // Local diorama coords: x = north, z = east (same orientation as the big map).
  const local = (lon, lat) => [(lat - city.lat) * 110540 * metresToUnits, (lon - city.lon) * 111320 * cosLat * metresToUnits];

  const positions = [];
  const seeds = [];
  const indices = [];
  const roads = [];
  const waterRings = [];
  let buildings = 0;
  let skipped = 0;

  for (const element of raw.elements) {
    const tags = element.tags ?? {};
    if (element.type === "way" && tags.building && element.geometry) {
      if (!city.osmBuildings) continue;
      const ring = element.geometry.map(({ lon, lat }) => local(lon, lat));
      if (ring.length > 1 && ring[0][0] === ring.at(-1)[0] && ring[0][1] === ring.at(-1)[1]) ring.pop();
      if (ring.length < 3) continue;
      const cx = ring.reduce((sum, p) => sum + p[0], 0) / ring.length;
      const cz = ring.reduce((sum, p) => sum + p[1], 0) / ring.length;
      if (Math.hypot(cx, cz) > R) continue;
      // Shape space: u = z (east), v = x (north).
      let contour = ring.map(([x, z]) => new Vector2(z, x));
      const area = Math.abs(ringArea(contour)) / metresToUnits ** 2;
      if (area < 18) {
        skipped += 1;
        continue;
      }
      if (ringArea(contour) < 0) contour = contour.reverse();
      const height = heightOf(tags, element.id, city) * metresToUnits * lift;
      const seed = hash(element.id + 7);
      const base = positions.length / 3;
      const n = contour.length;
      for (const point of contour) {
        positions.push(point.y, 0, point.x);
        seeds.push(seed);
      }
      for (const point of contour) {
        positions.push(point.y, height, point.x);
        seeds.push(seed);
      }
      for (let i = 0; i < n; i += 1) {
        const j = (i + 1) % n;
        // Contour is CCW in (east, north); with x = north, z = east this winding faces outward.
        indices.push(base + i, base + n + i, base + j, base + j, base + n + i, base + n + j);
      }
      for (const [a, b, c] of ShapeUtils.triangulateShape(contour, [])) {
        indices.push(base + n + a, base + n + c, base + n + b);
      }
      buildings += 1;
    } else if (tags.highway && element.type === "way" && element.geometry) {
      for (let i = 0; i + 1 < element.geometry.length; i += 1) {
        const a = local(element.geometry[i].lon, element.geometry[i].lat);
        const b = local(element.geometry[i + 1].lon, element.geometry[i + 1].lat);
        if (Math.hypot(...a) > R || Math.hypot(...b) > R) continue;
        roads.push(a[0], a[1], b[0], b[1]);
      }
    } else if ((tags.natural === "water" || tags.waterway === "riverbank") && (element.geometry || element.members)) {
      const ways = element.type === "way" ? [element.geometry] : element.members.filter((m) => m.geometry).map((m) => m.geometry);
      for (const way of ways) waterRings.push(way.map(({ lon, lat }) => local(lon, lat)));
    }
  }

  // Water mask over the diorama square [-R, R]², u = east (z), v = north (x).
  const size = city.radius > city.displayRadius ? 1024 : 512;
  const toPixel = ([x, z]) => [((z + R) / (2 * R)) * size, ((x + R) / (2 * R)) * size];
  const water = rasterize(
    waterRings.map((ring) => ring.map(toPixel)),
    size,
    size,
  );

  const quant = 2048; // positions stored as Int16 / quant → covers ±16 units at ~4 cm (real-world) precision
  const position16 = Int16Array.from(positions, (value) => Math.round(value * quant));
  const seed8 = Uint8Array.from(seeds, (value) => Math.round(value * 255));
  const bytes = await writeContainer(
    city.id,
    {
      id: city.id,
      name: city.name,
      lat: city.lat,
      lon: city.lon,
      radiusMetres: city.radius,
      radius: R,
      plinthRadius: geo.diorama.radius,
      quant,
      waterSize: size,
    },
    {
      position: position16,
      seed: seed8,
      index: new Uint32Array(indices),
      roads: new Float32Array(roads),
      water,
    },
  );
  console.log(
    `${city.id}: ${buildings} buildings (${skipped} tiny skipped), ${positions.length / 3} verts, ${indices.length / 3} tris, ${roads.length / 4} road segments, ${waterRings.length} water rings → ${(bytes / 1024).toFixed(0)} KB`,
  );
}

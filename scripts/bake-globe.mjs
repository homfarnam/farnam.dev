// Bakes the Journey globe texture from Natural Earth (public domain):
//   data-raw/naturalearth/ne_50m_land.geojson
//   data-raw/naturalearth/ne_50m_admin_0_countries.geojson
// into public/geo/globe.png, an equirectangular RGB image:
//   R = land, G = coastlines + the outlines of Iran and the Netherlands,
//   B = Iran and the Netherlands filled (the shader tells them apart by longitude).
// Only these two countries get borders: no other (possibly contested) borders are drawn.
//
//   node scripts/bake-globe.mjs
import { statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = new URL("../", import.meta.url);
const WIDTH = 2048;
const HEIGHT = 1024;
/** Rasterise at 2× and box-filter down for anti-aliased edges. */
const SS = 2;
const W = WIDTH * SS;
const H = HEIGHT * SS;

const toPixel = ([lon, lat]) => [((lon + 180) / 360) * W, ((90 - lat) / 180) * H];

function polygonsOf(geometry) {
  return geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
}

/** Even-odd scanline fill of rings (already in pixel space). */
function fill(rings, mask) {
  const edges = [];
  for (const ring of rings) {
    for (let i = 0; i < ring.length; i += 1) {
      const a = ring[i];
      const b = ring[(i + 1) % ring.length];
      if (a[1] !== b[1]) edges.push(a[1] < b[1] ? [a, b] : [b, a]);
    }
  }
  for (let y = 0; y < H; y += 1) {
    const sy = y + 0.5;
    const xs = [];
    for (const [a, b] of edges) {
      if (sy >= a[1] && sy < b[1]) xs.push(a[0] + ((sy - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const from = Math.max(0, Math.ceil(xs[k] - 0.5));
      const to = Math.min(W - 1, Math.floor(xs[k + 1] - 0.5));
      for (let x = from; x <= to; x += 1) mask[y * W + x] = 1;
    }
  }
}

/** Thick line segments (pixel space) stamped into a mask. */
function stroke(ring, mask, radius) {
  for (let i = 0; i + 1 < ring.length; i += 1) {
    const [ax, ay] = ring[i];
    const [bx, by] = ring[i + 1];
    // Rings split at the antimeridian would otherwise draw a line across the whole map.
    if (Math.abs(bx - ax) > W / 2) continue;
    const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 0.5));
    for (let s = 0; s <= steps; s += 1) {
      const px = ax + ((bx - ax) * s) / steps;
      const py = ay + ((by - ay) * s) / steps;
      for (let dy = -radius; dy <= radius; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          if (dx * dx + dy * dy > radius * radius) continue;
          const x = Math.round(px + dx);
          const y = Math.round(py + dy);
          if (x >= 0 && y >= 0 && x < W && y < H) mask[y * W + x] = 1;
        }
      }
    }
  }
}

const land = JSON.parse(await readFile(new URL("data-raw/naturalearth/ne_50m_land.geojson", root), "utf8"));
const countries = JSON.parse(await readFile(new URL("data-raw/naturalearth/ne_50m_admin_0_countries.geojson", root), "utf8"));

const landMask = new Uint8Array(W * H);
const lineMask = new Uint8Array(W * H);
const homeMask = new Uint8Array(W * H);

// Land: fill each polygon (outer ring + holes, even-odd) and stroke its coastline.
for (const feature of land.features) {
  for (const polygon of polygonsOf(feature.geometry)) {
    const rings = polygon.map((ring) => ring.map(toPixel));
    fill(rings, landMask);
    // Antarctica's ring runs along the bottom edge; skip coast segments hugging the pole.
    for (const ring of polygon) stroke(ring.filter(([, lat]) => lat > -85).map(toPixel), lineMask, 0);
  }
}

// Iran and the European Netherlands (the Caribbean islands are left out).
for (const code of ["IRN", "NLD"]) {
  const feature = countries.features.find((candidate) => candidate.properties.ADM0_A3 === code);
  if (!feature) throw new Error(`${code} not found in Natural Earth countries`);
  for (const polygon of polygonsOf(feature.geometry)) {
    if (polygon[0].every(([lon]) => lon < -20)) continue;
    fill(
      polygon.map((ring) => ring.map(toPixel)),
      homeMask,
    );
    for (const ring of polygon) stroke(ring.map(toPixel), lineMask, 1);
  }
}

const out = Buffer.alloc(WIDTH * HEIGHT * 3);
for (let y = 0; y < HEIGHT; y += 1) {
  for (let x = 0; x < WIDTH; x += 1) {
    let l = 0;
    let g = 0;
    let b = 0;
    for (let sy = 0; sy < SS; sy += 1) {
      for (let sx = 0; sx < SS; sx += 1) {
        const index = (y * SS + sy) * W + x * SS + sx;
        l += landMask[index];
        g += lineMask[index];
        b += homeMask[index];
      }
    }
    const n = SS * SS;
    const o = (y * WIDTH + x) * 3;
    out[o] = Math.round((l / n) * 255);
    out[o + 1] = Math.round((g / n) * 255);
    out[o + 2] = Math.round((b / n) * 255);
  }
}

const file = fileURLToPath(new URL("public/geo/globe.png", root));
await sharp(out, { raw: { width: WIDTH, height: HEIGHT, channels: 3 } })
  .png({ compressionLevel: 9 })
  .toFile(file);
console.log(`globe: ${WIDTH}×${HEIGHT}, ${(statSync(file).size / 1024).toFixed(0)} KB`);

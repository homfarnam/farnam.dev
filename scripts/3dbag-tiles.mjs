// Walks the 3D BAG 3D Tiles hierarchy (following external tilesets) and returns
// the .glb tiles whose bounding boxes intersect a circle around a lat/lon.
// Data: 3DBAG by tudelft3d and 3DGI, CC BY 4.0 — https://3dbag.nl
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export const TILESET_BASE = "https://data.3dbag.nl/v20250903/cesium3dtiles/lod22/";
const CACHE = new URL("../data-raw/3dbag/", import.meta.url);

export function ecef(lat, lon, h = 0) {
  const a = 6378137;
  const e2 = 6.69437999014e-3;
  const φ = (lat * Math.PI) / 180;
  const λ = (lon * Math.PI) / 180;
  const N = a / Math.sqrt(1 - e2 * Math.sin(φ) ** 2);
  return [(N + h) * Math.cos(φ) * Math.cos(λ), (N + h) * Math.cos(φ) * Math.sin(λ), (N * (1 - e2) + h) * Math.sin(φ)];
}

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

function boxDistance(box, point) {
  const center = box.slice(0, 3);
  const d = sub(point, center);
  let outside = 0;
  for (const axis of [box.slice(3, 6), box.slice(6, 9), box.slice(9, 12)]) {
    const length = Math.hypot(...axis);
    if (length === 0) continue;
    outside += Math.max(0, Math.abs(dot(d, axis) / length) - length) ** 2;
  }
  return Math.sqrt(outside);
}

/** Fetch a file from the 3D BAG, caching it under data-raw/3dbag/. */
export async function cached(relative) {
  const target = new URL(relative, CACHE);
  try {
    return await readFile(target);
  } catch {
    const response = await fetch(TILESET_BASE + relative, { headers: { "User-Agent": "farnam-portfolio-build/1.0" } });
    if (!response.ok) throw new Error(`${relative} → ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    await mkdir(dirname(target.pathname.replaceAll("%20", " ")), { recursive: true });
    await writeFile(target, buffer);
    return buffer;
  }
}

export async function tilesAround(lat, lon, radius) {
  const target = ecef(lat, lon, 0);
  const found = [];
  async function walk(node, base) {
    if (boxDistance(node.boundingVolume.box, target) > radius) return;
    const uri = node.content?.uri;
    if (uri?.endsWith(".json")) {
      const child = JSON.parse((await cached(base + uri)).toString());
      await walk(child.root, base + uri.slice(0, uri.lastIndexOf("/") + 1));
    } else if (uri && !node.children?.length) {
      // Tiles refine by REPLACE: only the finest level carries full-detail buildings.
      found.push(base + uri);
    }
    for (const child of node.children ?? []) await walk(child, base);
  }
  const root = JSON.parse((await cached("tileset.json")).toString());
  await walk(root.root, "");
  return found;
}

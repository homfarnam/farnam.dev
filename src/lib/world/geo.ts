import geo from "@/data/geo.json";

/**
 * Journey map projection (Web Mercator), shared with scripts/bake-geo.mjs via
 * src/data/geo.json. Chamber-local axes: +x = north, +z = east, so standing at
 * the entrance (+z) and looking down the chamber you face west.
 */
const DEG = Math.PI / 180;
const merc = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * DEG) / 2));

export const GEO = geo;

export function project(lon: number, lat: number): [number, number] {
  return [(merc(lat) - geo.merc0) * geo.scale, (lon - geo.lon0) * DEG * geo.scale + geo.zOffset];
}

/** Great-circle samples between two [lon, lat] points (inclusive), as [lon, lat]. */
export function greatCircle(from: [number, number], to: [number, number], samples: number): [number, number][] {
  const toVector = ([lon, lat]: [number, number]) => [
    Math.cos(lat * DEG) * Math.cos(lon * DEG),
    Math.cos(lat * DEG) * Math.sin(lon * DEG),
    Math.sin(lat * DEG),
  ];
  const a = toVector(from);
  const b = toVector(to);
  const dot = a.reduce((sum, value, index) => sum + value * (b[index] ?? 0), 0);
  const omega = Math.acos(Math.min(1, Math.max(-1, dot)));
  const result: [number, number][] = [];
  for (let index = 0; index <= samples; index += 1) {
    const t = index / samples;
    const wa = Math.sin((1 - t) * omega) / Math.sin(omega);
    const wb = Math.sin(t * omega) / Math.sin(omega);
    const [x, y, z] = a.map((value, k) => value * wa + (b[k] ?? 0) * wb) as [number, number, number];
    result.push([Math.atan2(y, x) / DEG, Math.atan2(z, Math.hypot(x, y)) / DEG]);
  }
  return result;
}

export const CITY_GEO = {
  tehran: { lon: 51.4339, lat: 35.8044 },
  amsterdam: { lon: 4.8926, lat: 52.3731 },
} as const;

export type CityId = keyof typeof CITY_GEO;

/** Mean Earth radius (km), as used for great-circle distances. */
const EARTH_RADIUS_KM = 6371.0088;

/** Great-circle (shortest path) distance in km between two [lon, lat] points. */
export function greatCircleKm(from: [number, number], to: [number, number]): number {
  const [lon1, lat1] = from.map((value) => value * DEG) as [number, number];
  const [lon2, lat2] = to.map((value) => value * DEG) as [number, number];
  const h = Math.sin((lat2 - lat1) / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

import { Matrix3, Matrix4, Vector3 } from "three";
import { CITY_GEO, GEO, greatCircle, greatCircleKm, project } from "./geo";

/**
 * The Journey's opening view: the whole Earth floating over the map, which
 * unrolls into the flat map when the story starts. Chamber-local coordinates
 * (+x = north, +z = east, y = up).
 *
 * Globe model space (before rotation): unit sphere, +y = north pole,
 * +x = (0°, 0°), longitude increasing towards −z.
 */

const DEG = Math.PI / 180;

export const GLOBE_RADIUS = 20;

/** Above the middle of the flat map, so the unroll lays the land straight down onto it. */
const mapCenter = (() => {
  const { lonMin, lonMax, latMin, latMax } = GEO.bounds;
  const [x1, z1] = project(lonMin, latMin);
  const [x2, z2] = project(lonMax, latMax);
  return new Vector3((x1 + x2) / 2, 0, (z1 + z2) / 2);
})();
export const GLOBE_CENTER = mapCenter.clone().setY(27);

/** From the globe towards the camera: from the east (the entrance), a little south and above. */
export const GLOBE_VIEW_DIR = new Vector3(-0.22, 0.3, 0.93).normalize();
export const GLOBE_DISTANCE = { wide: 60, compact: 108 };

export const AIRPORT_LONLAT = {
  ika: [51.1522, 35.4161] as [number, number],
  ams: [4.7683, 52.3105] as [number, number],
};
export const CITY_LONLAT = {
  tehran: [CITY_GEO.tehran.lon, CITY_GEO.tehran.lat] as [number, number],
  amsterdam: [CITY_GEO.amsterdam.lon, CITY_GEO.amsterdam.lat] as [number, number],
};

/** The flight, airport to airport, and the two city centres: real great-circle distances. */
export const FLIGHT_KM = greatCircleKm(AIRPORT_LONLAT.ika, AIRPORT_LONLAT.ams);
export const CITY_KM = greatCircleKm(CITY_LONLAT.tehran, CITY_LONLAT.amsterdam);

export function formatKm(km: number): string {
  return Math.round(km).toLocaleString("en-US");
}

/** What faces the camera: the middle of the route, nudged south so the arc sits centred. */
const [midLon, midLat] = greatCircle(AIRPORT_LONLAT.ika, AIRPORT_LONLAT.ams, 2)[1] ?? [28, 45];
export const GLOBE_FOCUS: [number, number] = [midLon, midLat - 3];

/** Point on the unit sphere (model space) for a longitude/latitude in degrees. */
export function globeDir(lon: number, lat: number, target = new Vector3()): Vector3 {
  const phi = lat * DEG;
  const lambda = lon * DEG;
  return target.set(Math.cos(phi) * Math.cos(lambda), Math.sin(phi), -Math.cos(phi) * Math.sin(lambda));
}

const scratch = { f: new Vector3(), n: new Vector3(), e: new Vector3(), up: new Vector3(), right: new Vector3() };
const model = new Matrix4();
const world = new Matrix4();

/**
 * Rotation (model → chamber-local) that turns (lon, lat) to face along
 * `view` with north pointing up on screen.
 */
export function globeRotation(lon: number, lat: number, view: Vector3, out = new Matrix4()): Matrix4 {
  const { f, n, e, up, right } = scratch;
  globeDir(lon, lat, f);
  e.set(-Math.sin(lon * DEG), 0, -Math.cos(lon * DEG));
  n.crossVectors(f, e); // f × e = north
  up.set(0, 1, 0).addScaledVector(view, -view.y).normalize();
  right.crossVectors(up, view);
  model.makeBasis(e, n, f);
  world.makeBasis(right, up, view);
  return out.multiplyMatrices(world, model.transpose());
}

export function rotation3(matrix: Matrix4, out = new Matrix3()): Matrix3 {
  return out.setFromMatrix4(matrix);
}

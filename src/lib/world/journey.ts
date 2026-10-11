import { CatmullRomCurve3, Vector3 } from "three";
import { journeyStops, type Region } from "@/data/journey";
import { CITY_GEO, GEO, greatCircle, project } from "./geo";
import { chamberToWorld, type CameraShot, type Vec3 } from "./layout";

/**
 * Journey layout (chamber-local, +x = north, +z = east; the entrance is east).
 * Two city dioramas sit on a real map at their true positions. The route
 * circles Tehran's plinth, flies the great circle to Amsterdam, then circles
 * Amsterdam's plinth. Stops are spaced around the plinths, not pinned to
 * addresses — we don't know where the offices were.
 */

/** Continents are raised above the sea; everything on land sits on this level. */
export const LAND_Y = GEO.landHeight;
export const ROUTE_Y = LAND_Y + 0.12;
export const PLINTH_HEIGHT = 0.9;
export const PLINTH_RADIUS = GEO.diorama.radius + 0.35;
const RING_RADIUS = PLINTH_RADIUS + 1.3;
const FLIGHT_ALTITUDE = 13;

function cityCenter(id: keyof typeof CITY_GEO): Vector3 {
  const [x, z] = project(CITY_GEO[id].lon, CITY_GEO[id].lat);
  return new Vector3(x, 0, z);
}

export const TEHRAN_CENTER = cityCenter("tehran");
export const AMSTERDAM_CENTER = cityCenter("amsterdam");

/** Angle (radians) of a direction on the ground: 0 = north (+x), π/2 = east (+z). */
const angleOf = (from: Vector3, to: Vector3) => Math.atan2(to.z - from.z, to.x - from.x);
const ringPoint = (center: Vector3, angle: number, radius = RING_RADIUS) =>
  new Vector3(center.x + Math.cos(angle) * radius, ROUTE_Y, center.z + Math.sin(angle) * radius);

const DEG = Math.PI / 180;

/**
 * Airports: Imam Khomeini (IKA) for Tehran and Schiphol (AMS) for Amsterdam.
 * At map scale both real airports fall inside their city plinths, so each one
 * gets its own small plinth on the side of its city that faces the other city.
 * That keeps the flight on the great circle between the two real airports.
 * The label states the real direction and distance and says "not to scale".
 */
export const AIRPORT_RADIUS = 4.2;
export const AIRPORT_HEIGHT = 0.5;
export const AIRPORT_TOP = LAND_Y + AIRPORT_HEIGHT + 0.04;
const RUNWAY_HALF = 3.5;

export const AIRPORT_GEO = {
  ika: { code: "IKA", name: "Imam Khomeini International", lon: 51.1522, lat: 35.4161, city: "tehran", distanceFromCity: 14 },
  ams: { code: "AMS", name: "Schiphol", lon: 4.7683, lat: 52.3105, city: "amsterdam", distanceFromCity: 23 },
} as const;
export type AirportId = keyof typeof AIRPORT_GEO;

function trueBearing(id: AirportId) {
  const airport = AIRPORT_GEO[id];
  const city = CITY_GEO[airport.city];
  const north = (airport.lat - city.lat) * 110540;
  const east = (airport.lon - city.lon) * 111320 * Math.cos(city.lat * DEG);
  return { angle: Math.atan2(east, north), km: Math.hypot(north, east) / 1000 };
}

function airportCenter(id: AirportId): Vector3 {
  const tehran = AIRPORT_GEO[id].city === "tehran";
  const city = tehran ? TEHRAN_CENTER : AMSTERDAM_CENTER;
  const other = tehran ? AMSTERDAM_CENTER : TEHRAN_CENTER;
  const towards = other.clone().sub(city).setY(0).normalize();
  return city.clone().addScaledVector(towards, AIRPORT_GEO[id].distanceFromCity).setY(0);
}

const COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
/** Real direction and distance from the city centre, e.g. "50 km SSW". */
export function airportBearingLabel(id: AirportId): string {
  const { angle, km } = trueBearing(id);
  const degrees = ((angle * 180) / Math.PI + 360) % 360;
  return `${km.toFixed(0)} km ${COMPASS[Math.round(degrees / 45) % 8]}`;
}

export const IKA_CENTER = airportCenter("ika");
export const AMS_CENTER = airportCenter("ams");
/** Both runways are laid along the flight, so take-off and landing read in one line. */
export const RUNWAY_AXIS = AMS_CENTER.clone().sub(IKA_CENTER).setY(0).normalize();
const RUNWAY_SIDE = new Vector3(-RUNWAY_AXIS.z, 0, RUNWAY_AXIS.x);

export interface AirportLayout {
  id: AirportId;
  center: Vector3;
  realDistanceKm: number;
  gate: Vector3;
  taxi: Vector3;
  runwayStart: Vector3;
  runwayEnd: Vector3;
}

function airportLayout(id: AirportId): AirportLayout {
  const center = airportCenter(id);
  const at = (along: number, side: number) =>
    center.clone().addScaledVector(RUNWAY_AXIS, along).addScaledVector(RUNWAY_SIDE, side).setY(AIRPORT_TOP);
  const departure = id === "ika";
  return {
    id,
    center,
    realDistanceKm: trueBearing(id).km,
    gate: at(departure ? -1.6 : 1.6, 1.75),
    taxi: at(departure ? -3.1 : 3.1, 0.75),
    runwayStart: at(-RUNWAY_HALF + 0.2, 0),
    runwayEnd: at(RUNWAY_HALF - 0.2, 0),
  };
}

export const AIRPORTS = { ika: airportLayout("ika"), ams: airportLayout("ams") };

const departAngle = angleOf(TEHRAN_CENTER, IKA_CENTER);
const arriveAngle = angleOf(AMSTERDAM_CENTER, AMS_CENTER);
/** Unwrap an angle so it is greater than `after` (for sweeping arcs). */
const after = (angle: number, reference: number) => {
  let value = angle;
  while (value <= reference) value += 2 * Math.PI;
  return value;
};

/** Stops sweep around each plinth: Tehran from the entrance side round towards IKA; Amsterdam from Schiphol's side all the way round. */
const REGION_ARCS: Record<Exclude<Region, "flight">, { center: Vector3; from: number; to: number }> = {
  tehran: { center: TEHRAN_CENTER, from: 80 * DEG, to: after(departAngle, 80 * DEG) - 16 * DEG },
  amsterdam: { center: AMSTERDAM_CENTER, from: arriveAngle + 18 * DEG, to: arriveAngle + 2 * Math.PI - 40 * DEG },
};

/** Ground (or air) anchor for each stop. */
export const stopAnchors: Vector3[] = (() => {
  const anchors: Vector3[] = [];
  (["tehran", "amsterdam"] as const).forEach((region) => {
    const indices = journeyStops.map((stop, index) => (stop.region === region ? index : -1)).filter((index) => index >= 0);
    const { center, from, to } = REGION_ARCS[region];
    indices.forEach((stopIndex, order) => {
      const t = indices.length === 1 ? 0 : order / (indices.length - 1);
      anchors[stopIndex] = ringPoint(center, from + (to - from) * t);
    });
  });
  return anchors;
})();

/**
 * The flight: lift-off at the end of IKA's runway, a great circle between the
 * real airports (bent so it starts and ends on the schematic runways), and
 * touchdown at the start of Schiphol's runway.
 */
export const flightPath: Vector3[] = (() => {
  const ika = AIRPORT_GEO.ika;
  const ams = AIRPORT_GEO.ams;
  const samples = greatCircle([ika.lon, ika.lat], [ams.lon, ams.lat], 56);
  const projected = samples.map(([lon, lat]) => {
    const [x, z] = project(lon, lat);
    return new Vector3(x, 0, z);
  });
  const first = projected[0] ?? new Vector3();
  const last = projected[projected.length - 1] ?? new Vector3();
  const liftoff = AIRPORTS.ika.runwayStart.clone().lerp(AIRPORTS.ika.runwayEnd, 0.78);
  const touchdown = AIRPORTS.ams.runwayStart.clone().lerp(AIRPORTS.ams.runwayEnd, 0.22);
  const startOffset = liftoff.clone().sub(first).setY(0);
  const endOffset = touchdown.clone().sub(last).setY(0);
  return projected.map((point, index) => {
    const t = index / (projected.length - 1);
    const bent = point.clone().add(startOffset.clone().lerp(endOffset, t));
    // Climb and descent ease in near the airports; cruise in the middle.
    const altitude = Math.sin(Math.pow(Math.sin(t * Math.PI), 0.6) * (Math.PI / 2)) * FLIGHT_ALTITUDE;
    bent.y = AIRPORT_TOP + altitude;
    return bent;
  });
})();

const moveIndex = journeyStops.findIndex((stop) => stop.region === "flight");
const apex = flightPath.reduce((best, point) => (point.y > best.y ? point : best), flightPath[0] ?? new Vector3());
if (moveIndex >= 0) stopAnchors[moveIndex] = apex.clone();

/** Arc points between two angles on a plinth ring, for a smooth circular route. */
function arc(center: Vector3, from: number, to: number) {
  const steps = Math.max(2, Math.ceil(Math.abs(to - from) / (12 * DEG)));
  return Array.from({ length: steps + 1 }, (_, index) => ringPoint(center, from + ((to - from) * index) / steps));
}

/** Where a ground link meets an airport plinth's rim, on the side facing the city. */
function airportEdge(airport: AirportLayout, city: Vector3) {
  return airport.center
    .clone()
    .addScaledVector(city.clone().sub(airport.center).setY(0).normalize(), AIRPORT_RADIUS + 0.4)
    .setY(ROUTE_Y);
}

const tehranArc = REGION_ARCS.tehran;
const amsterdamArc = REGION_ARCS.amsterdam;
const ika = AIRPORTS.ika;
const ams = AIRPORTS.ams;

export const route = new CatmullRomCurve3(
  [
    ...arc(TEHRAN_CENTER, tehranArc.from, after(departAngle, tehranArc.from)),
    airportEdge(ika, TEHRAN_CENTER),
    ika.gate,
    ika.taxi,
    ika.runwayStart,
    ...flightPath,
    ams.runwayEnd,
    ams.taxi,
    ams.gate,
    airportEdge(ams, AMSTERDAM_CENTER),
    ...arc(AMSTERDAM_CENTER, arriveAngle, amsterdamArc.to),
  ],
  false,
  "centripetal",
);

const routeSamples = route.getSpacedPoints(4000);

/** Route progress (0..1) closest to a point. */
export function progressAt(point: Vector3): number {
  let best = 0;
  let bestDistance = Infinity;
  routeSamples.forEach((sample, index) => {
    const distance = sample.distanceToSquared(point);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = index;
    }
  });
  return best / (routeSamples.length - 1);
}

/** Route progress (0..1) at each stop. */
export const stopProgress: number[] = stopAnchors.map(progressAt);

/** Key moments of the flight leg, as route progress — used to time the airliner. */
export const flightProgress = {
  gateA: progressAt(ika.gate),
  runwayA: progressAt(ika.runwayStart),
  liftoff: progressAt(flightPath[0] ?? ika.runwayEnd),
  touchdown: progressAt(flightPath[flightPath.length - 1] ?? ams.runwayStart),
  rollout: progressAt(ams.runwayEnd),
  gateB: progressAt(ams.gate),
};

export function stopPoint(index: number): Vector3 {
  return (stopAnchors[index] ?? new Vector3()).clone();
}

export function isMoveStop(index: number | null): boolean {
  return index !== null && index === moveIndex;
}

function toWorld(point: Vector3): Vec3 {
  return chamberToWorld("journey", point.toArray() as Vec3);
}

/**
 * Camera for one stop. Ground stops: outside the ring, looking back across
 * the beacon into the city. The move: a wide side view of the whole flight.
 */
export function journeyShot(index: number, compact: boolean): CameraShot {
  const anchor = stopPoint(index);
  if (isMoveStop(index)) {
    const mid = IKA_CENTER.clone().lerp(AMS_CENTER, 0.5);
    const along = RUNWAY_AXIS.clone();
    const side = new Vector3(along.z, 0, -along.x); // to the right of the flight, facing Amsterdam
    const position = mid
      .clone()
      .addScaledVector(side, compact ? 50 : 36)
      .add(new Vector3(0, compact ? 22 : 15, 0));
    return { position: toWorld(position), target: toWorld(mid.clone().setY(6)) };
  }
  const stop = journeyStops[index];
  const center = stop?.region === "amsterdam" ? AMSTERDAM_CENTER : TEHRAN_CENTER;
  const outward = anchor.clone().sub(center).setY(0).normalize();
  const tangent = new Vector3(-outward.z, 0, outward.x);
  const distance = compact ? 9.5 : 7;
  const position = anchor
    .clone()
    .addScaledVector(outward, distance)
    .addScaledVector(tangent, compact ? 0 : 1.5)
    .add(new Vector3(0, compact ? 5.5 : 4.2, 0));
  const target = anchor
    .clone()
    .lerp(center, 0.32)
    .addScaledVector(tangent, compact ? 0 : -2.2)
    .add(new Vector3(0, compact ? 0.2 : 0.9, 0));
  return { position: toWorld(position), target: toWorld(target) };
}

/** Projected point for a remote-team link; off-map places are pinned to the map edge. */
export function remoteAnchor(lon: number, lat: number): { point: Vector3; offMap: boolean } {
  const { lonMin, latMin, latMax } = GEO.bounds;
  const offMap = lon < lonMin;
  const [x, z] = project(Math.max(lon, lonMin + 1.5), Math.min(Math.max(lat, latMin + 1.5), latMax - 1.5));
  return { point: new Vector3(x, ROUTE_Y, z), offMap };
}

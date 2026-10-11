import { useMemo } from "react";
import { Vector3 } from "three";
import { parseContainer, useGeoBinary } from "./geoData";

/**
 * Street-level walk areas, at real scale (1 unit = 1 m). They live far away from
 * the chambers so nothing else is ever in view. Local axes: x = north,
 * z = east, y = up; origin at the walk centre.
 */
export const STREET_ORIGIN = new Vector3(0, 0, 4000);
export const EYE_HEIGHT = 1.7;
export const WATER_LEVEL = -1.7;
export const QUAY_DEPTH = -2.6;

export type StreetId = "herengracht" | "tajrish";

export interface StreetStyle {
  id: StreetId;
  city: "amsterdam" | "tehran";
  title: string;
  kicker: string;
  /** What is real and what is generated, shown in the overlay. */
  provenance: string;
  /** Wall textures: main (brick), alternate (plaster / stone), roof. */
  textures: {
    wall: string;
    wallNormal: string;
    alt: string;
    altNormal: string;
    roof: string;
    roofNormal: string;
    ground: string;
    groundNormal: string;
    road?: string;
    roadNormal?: string;
  };
  facade: { floor: number; bay: number; altShare: number; shopfronts: boolean; frames: string };
  trees: { tones: string[]; height: [number, number]; trunk: string };
  lamps: { height: number; color: string; pole: string };
}

export const STREET_STYLES: Record<StreetId, StreetStyle> = {
  herengracht: {
    id: "herengracht",
    city: "amsterdam",
    title: "Herengracht",
    kicker: "Amsterdam · street level",
    provenance: "Real buildings from the 3D BAG, real canals and bridges from OpenStreetMap. Facades are generated.",
    textures: {
      wall: "/textures/street/bricks094-color.jpg",
      wallNormal: "/textures/street/bricks094-normalgl.jpg",
      alt: "/textures/street/paintedplaster017-color.jpg",
      altNormal: "/textures/street/paintedplaster017-normalgl.jpg",
      roof: "/textures/street/roofingtiles014b-color.jpg",
      roofNormal: "/textures/street/roofingtiles014b-normalgl.jpg",
      ground: "/textures/street/pavingstones140-color.jpg",
      groundNormal: "/textures/street/pavingstones140-normalgl.jpg",
    },
    facade: { floor: 3.05, bay: 1.75, altShare: 0.16, shopfronts: false, frames: "#E6E6E0" },
    trees: { tones: ["#22361C", "#2B4222", "#344D25", "#4A5A26", "#5E5A24", "#6E5222"], height: [7, 11], trunk: "#2B2420" },
    lamps: { height: 4.4, color: "#FFC27A", pole: "#1E3326" },
  },
  tajrish: {
    id: "tajrish",
    city: "tehran",
    title: "Tajrish",
    kicker: "Tehran · street level",
    provenance:
      "Real streets, landmarks and mapped buildings from OpenStreetMap. Tehran's map data is incomplete, so many buildings along the streets are generated, as are the facades, plane trees, jubs and lamps.",
    textures: {
      wall: "/textures/street/bricks084-color.jpg",
      wallNormal: "/textures/street/bricks084-normalgl.jpg",
      alt: "/textures/street/travertine009-color.jpg",
      altNormal: "/textures/street/travertine009-normalgl.jpg",
      roof: "/textures/street/roofingtiles014b-color.jpg",
      roofNormal: "/textures/street/roofingtiles014b-normalgl.jpg",
      ground: "/textures/street/pavingstones136-color.jpg",
      groundNormal: "/textures/street/pavingstones136-normalgl.jpg",
      road: "/textures/street/asphalt033-color.jpg",
      roadNormal: "/textures/street/asphalt033-normalgl.jpg",
    },
    facade: { floor: 3.2, bay: 2.7, altShare: 0.55, shopfronts: true, frames: "#3A3D42" },
    trees: { tones: ["#2E4A22", "#36552A", "#3F5E2C", "#4D6A30", "#5B6E2E"], height: [10, 15], trunk: "#6E6457" },
    lamps: { height: 7.5, color: "#FFB061", pole: "#5A5F66" },
  },
};

export interface StreetHeader {
  id: string;
  name: string;
  radius: number;
  cell: number;
  size: number;
  spawn: [number, number] | null;
  facing: "north" | "east" | "south" | "west";
  buffers: Record<string, { type: string }>;
}

export interface StreetData {
  header: StreetHeader;
  walk: Uint8Array;
  trees: Float32Array;
  lamps: Float32Array;
  /** Amsterdam: canals. */
  water?: Uint8Array;
  bridge?: Uint8Array;
  quay?: Float32Array;
  /** Tehran: asphalt / pedestrian paving masks, jub segments, landmarks [n, e, r, kind]. */
  road?: Uint8Array;
  paved?: Uint8Array;
  jubs?: Float32Array;
  landmarks?: Float32Array;
}

export function useStreetData(id: StreetId): StreetData {
  const data = useGeoBinary(`/geo/street/${id}.bin`);
  return useMemo(() => {
    const container = parseContainer<StreetHeader>(data);
    const has = (key: string) => key in container.header.buffers;
    return {
      header: container.header,
      walk: container.get("walk", "Uint8Array"),
      trees: container.get("trees", "Float32Array"),
      lamps: container.get("lamps", "Float32Array"),
      water: has("water") ? container.get("water", "Uint8Array") : undefined,
      bridge: has("bridge") ? container.get("bridge", "Uint8Array") : undefined,
      quay: has("quay") ? container.get("quay", "Float32Array") : undefined,
      road: has("road") ? container.get("road", "Uint8Array") : undefined,
      paved: has("paved") ? container.get("paved", "Uint8Array") : undefined,
      jubs: has("jubs") ? container.get("jubs", "Float32Array") : undefined,
      landmarks: has("landmarks") ? container.get("landmarks", "Float32Array") : undefined,
    };
  }, [data]);
}

/** True when a local (north, east) point is on a walkable cell. */
export function isWalkable(street: StreetData, north: number, east: number): boolean {
  const { radius, cell, size } = street.header;
  const u = Math.floor((east + radius) / cell);
  const v = Math.floor((north + radius) / cell);
  if (u < 0 || v < 0 || u >= size || v >= size) return false;
  return street.walk[v * size + u] === 1;
}

/** Yaw (camera rotation.y) for a compass direction; yaw 0 looks west (−z). */
export function yawFor(facing: StreetHeader["facing"]): number {
  return { west: 0, north: -Math.PI / 2, east: Math.PI, south: Math.PI / 2 }[facing];
}

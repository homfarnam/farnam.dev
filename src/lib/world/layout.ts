import { Vector3 } from "three";
import { getChapter, type ChapterId } from "@/data/chapters";
import { GLOBE_CENTER, GLOBE_DISTANCE, GLOBE_VIEW_DIR } from "./globe";

/**
 * World layout. The hub sits at the origin; each chapter is a separate
 * chamber reached through a door in the hub wall and a short corridor.
 * Chamber-local space: +Z points back towards the hub (the entrance).
 */

export type Vec3 = [number, number, number];

export interface CameraShot {
  position: Vec3;
  target: Vec3;
}

export const HUB_RADIUS = 11.5;
export const DOOR_RADIUS = 11.2;
export const CHAMBER_DISTANCE = 64;
export const CHAMBER_ENTRANCE = 16;

const DEG = Math.PI / 180;

/** Unit direction on the ground plane for a bearing (0° = -Z, positive towards +X). */
export function bearingDirection(bearing: number): Vector3 {
  return new Vector3(Math.sin(bearing * DEG), 0, -Math.cos(bearing * DEG));
}

/** Y rotation that turns chamber-local +Z to face the hub. */
export function bearingYaw(bearing: number): number {
  return -bearing * DEG;
}

export function chamberCenter(chapter: ChapterId): Vector3 {
  return bearingDirection(getChapter(chapter).bearing).multiplyScalar(CHAMBER_DISTANCE);
}

/** Convert a chamber-local point to world space. */
export function chamberToWorld(chapter: ChapterId, local: Vec3): Vec3 {
  const { bearing } = getChapter(chapter);
  const yaw = bearingYaw(bearing);
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  const [x, y, z] = local;
  const center = chamberCenter(chapter);
  return [center.x + x * cos + z * sin, y, center.z - x * sin + z * cos];
}

export function doorPosition(chapter: ChapterId): Vector3 {
  return bearingDirection(getChapter(chapter).bearing).multiplyScalar(DOOR_RADIUS);
}

export const HUB_SHOT: CameraShot = { position: [0, 3.5, 14.5], target: [0, 3.0, -1] };
export const HUB_SHOT_MOBILE: CameraShot = { position: [0, 4.2, 22], target: [0, 3.4, -1] };

/** Camera shot inside each chamber, in chamber-local coordinates. */
const chamberShots: Partial<Record<ChapterId, CameraShot>> = {
  creator: { position: [0, 3.3, 10.5], target: [0, 2.3, -2.5] },
};

/** High over the flat map, looking down the whole route from Tehran to Amsterdam (free look starts here). */
export const JOURNEY_MAP_SHOT: CameraShot = { position: [-44, 52, 30], target: [-2, 0, -30] };

/** The Journey opens on the globe. */
function globeShot(compact: boolean): CameraShot {
  const distance = compact ? GLOBE_DISTANCE.compact : GLOBE_DISTANCE.wide;
  const position = GLOBE_CENTER.clone().addScaledVector(GLOBE_VIEW_DIR, distance);
  // Wide screens: aim left of the globe so it sits right of the story card. Phones: aim high, so it sits under the card.
  const left = new Vector3().crossVectors(GLOBE_VIEW_DIR, new Vector3(0, 1, 0)).normalize();
  const target = GLOBE_CENTER.clone()
    .addScaledVector(left, compact ? 0 : 9)
    .add(new Vector3(0, compact ? 9 : -2.5, 0));
  return {
    position: chamberToWorld("journey", position.toArray() as Vec3),
    target: chamberToWorld("journey", target.toArray() as Vec3),
  };
}

export function chapterShot(chapter: ChapterId, compact: boolean): CameraShot {
  if (chapter === "awakening") return compact ? HUB_SHOT_MOBILE : HUB_SHOT;
  if (chapter === "journey") return globeShot(compact);
  const local = chamberShots[chapter] ?? { position: [0, 3, 12], target: [0, 2, 0] };
  const pushBack: Vec3 = compact ? [0, 0.6, 5] : [0, 0, 0];
  return {
    position: chamberToWorld(chapter, [
      local.position[0] + pushBack[0],
      local.position[1] + pushBack[1],
      local.position[2] + pushBack[2],
    ]),
    target: chamberToWorld(chapter, local.target),
  };
}

/** Waypoint just inside the hub, facing the door — used when leaving or entering the hub. */
export function doorApproachShot(chapter: ChapterId): CameraShot {
  const dir = bearingDirection(getChapter(chapter).bearing);
  const position = dir.clone().multiplyScalar(5.5);
  const target = dir.clone().multiplyScalar(30);
  return { position: [position.x, 2.4, position.z], target: [target.x, 2.2, target.z] };
}

/** Waypoint at the chamber entrance, looking into the chamber. */
export function chamberThresholdShot(chapter: ChapterId): CameraShot {
  return {
    position: chamberToWorld(chapter, [0, 2.4, CHAMBER_ENTRANCE + 4]),
    target: chamberToWorld(chapter, [0, 2.2, 0]),
  };
}

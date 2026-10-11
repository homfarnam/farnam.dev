import { Vector3 } from "three";
import { projects, type ProjectId } from "@/data/projects";
import { chamberToWorld, type CameraShot, type Vec3 } from "./layout";

/**
 * Project Vault layout (chamber-local). Artifacts stand on an arc that
 * bows away from the entrance, each one turned to face the arc's centre.
 */
const ARC_CENTER = new Vector3(0, 0, 4);
const ARC_RADIUS = 9.5;
const ARC_SPREAD = 92; // degrees between the outermost artifacts
export const ARTIFACT_HEIGHT = 2.35;

export interface ArtifactPlacement {
  id: ProjectId;
  position: Vec3;
  /** Y rotation so the artifact faces the arc centre. */
  yaw: number;
}

export const artifactPlacements: ArtifactPlacement[] = projects.map((project, index) => {
  const t = projects.length === 1 ? 0.5 : index / (projects.length - 1);
  const angle = ((t - 0.5) * ARC_SPREAD * Math.PI) / 180;
  const x = ARC_CENTER.x + Math.sin(angle) * ARC_RADIUS;
  const z = ARC_CENTER.z - Math.cos(angle) * ARC_RADIUS;
  return { id: project.id, position: [x, ARTIFACT_HEIGHT, z], yaw: -angle };
});

export function getPlacement(id: ProjectId): ArtifactPlacement {
  const placement = artifactPlacements.find((candidate) => candidate.id === id);
  if (!placement) throw new Error(`No placement for ${id}`);
  return placement;
}

/**
 * Close-up shot of an artifact. The target is offset so the artifact sits
 * beside the details panel: left of centre on desktop, above it on mobile.
 */
export function artifactShot(id: ProjectId, compact: boolean): CameraShot {
  const placement = getPlacement(id);
  const artifact = new Vector3(...placement.position);
  const towardsViewer = ARC_CENTER.clone().setY(artifact.y).sub(artifact).normalize();
  const distance = compact ? 6.6 : 5;
  const cameraLocal = artifact
    .clone()
    .add(towardsViewer.clone().multiplyScalar(distance))
    .add(new Vector3(0, 0.35, 0));
  const viewDirection = towardsViewer.clone().negate();
  const right = new Vector3().crossVectors(viewDirection, new Vector3(0, 1, 0)).normalize();
  const targetLocal = compact ? artifact.clone().add(new Vector3(0, -1.05, 0)) : artifact.clone().add(right.multiplyScalar(1.15));
  return {
    position: chamberToWorld("creator", cameraLocal.toArray() as Vec3),
    target: chamberToWorld("creator", targetLocal.toArray() as Vec3),
  };
}

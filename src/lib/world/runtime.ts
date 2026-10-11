import { Vector3 } from "three";

/**
 * Mutable per-frame values shared between GSAP timelines and render loops.
 * Kept outside React on purpose: these change every frame and must never
 * trigger re-renders.
 */
export const runtime = {
  /** 0 = lab dark, 1 = fully powered. Tweened by the boot sequence. */
  power: 0,
  /** 0..1 travel progress through a corridor, drives the warp streaks. */
  warp: 0,
  /** Burst amount for the Konami overdrive effect. */
  overdrive: 0,
  /** 0..1 how much of the Journey route is lit; eased towards the current stop. */
  journeyProgress: 0,
  /** World position of the journey airliner, for the camera to track during the move. */
  planeWorld: new Vector3(),
  /** Where the camera is looking (world space), shared between the story rig and free look. */
  cameraTarget: new Vector3(),
  /** Walker position in street-local metres (x = north, z = east). */
  streetPlayer: new Vector3(),
  /** Route progress of the airliner (0..1). */
  planeProgress: 0,
  /** Journey overview: 1 = the globe, 0 = the flat map. The globe unrolls into the map in between. */
  globe: 0,
  /** 0..1 how much of the route arc is drawn on the globe. */
  globeArc: 0,
  /** 0..1 through the current segment while the Journey plays itself (drives a slow camera push-in). */
  playDrift: 0,
  /** Particle count multiplier chosen from quality settings. */
  particleScale: 1,
};

"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { PerspectiveCamera } from "three";
import { EYE_HEIGHT, isWalkable, STREET_ORIGIN, yawFor, type StreetData } from "@/lib/world/street";
import { runtime } from "@/lib/world/runtime";

const WALK_SPEED = 1.7; // m/s
const RUN_SPEED = 4.2;
const TURN_SPEED = 1.9; // rad/s for keyboard turning
const LOOK_SENSITIVITY = 0.0032;
const BODY_RADIUS = 0.3;

/** Shared with the on-screen joystick (mobile). */
export const walkInput = { joystickX: 0, joystickY: 0 };

function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}

/**
 * First-person walking at eye level.
 * Mouse/touch: drag to look. Keys: W/S or ↑/↓ walk, A/D strafe, ←/→ or Q/E turn,
 * Shift to run. Collision uses the baked walk mask (buildings and open water block).
 */
export function WalkControls({ street }: { street: StreetData }) {
  const camera = useThree((state) => state.camera) as PerspectiveCamera;
  const gl = useThree((state) => state.gl);
  const player = useRef({
    north: street.header.spawn?.[0] ?? 0,
    east: street.header.spawn?.[1] ?? 0,
    yaw: yawFor(street.header.facing),
    pitch: -0.04,
    bob: 0,
  });
  const keys = useRef(new Set<string>());

  // Dev-only: lets the screenshot harness place the walker directly.
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const debug = window as unknown as { __walkPlayer?: unknown; __walkNear?: (n: number, e: number) => [number, number] | null };
    debug.__walkPlayer = player.current;
    // Nearest walkable point to (north, east), searching outward in 0.5 m rings.
    debug.__walkNear = (n, e) => {
      for (let r = 0; r < 120; r += 0.5) {
        for (let a = 0; a < Math.PI * 2; a += 0.2) {
          const north = n + Math.cos(a) * r;
          const east = e + Math.sin(a) * r;
          if (isWalkable(street, north, east)) return [north, east];
        }
      }
      return null;
    };
  }, [street]);

  // Far plane in metres for the street; restored on exit.
  useEffect(() => {
    const previous = { far: camera.far, near: camera.near, fov: camera.fov };
    camera.far = 900;
    camera.near = 0.08;
    camera.fov = 62;
    camera.rotation.order = "YXZ";
    camera.updateProjectionMatrix();
    return () => {
      camera.far = previous.far;
      camera.near = previous.near;
      camera.fov = previous.fov;
      camera.rotation.order = "XYZ";
      camera.updateProjectionMatrix();
    };
  }, [camera]);

  useEffect(() => {
    const element = gl.domElement;
    const pressed = keys.current;
    let dragging: { x: number; y: number; id: number } | null = null;

    function down(event: PointerEvent) {
      dragging = { x: event.clientX, y: event.clientY, id: event.pointerId };
    }
    function move(event: PointerEvent) {
      if (!dragging || event.pointerId !== dragging.id) return;
      player.current.yaw -= (event.clientX - dragging.x) * LOOK_SENSITIVITY;
      player.current.pitch = Math.max(
        -1.2,
        Math.min(1.1, player.current.pitch - (event.clientY - dragging.y) * LOOK_SENSITIVITY),
      );
      dragging.x = event.clientX;
      dragging.y = event.clientY;
    }
    function up(event: PointerEvent) {
      if (dragging?.id === event.pointerId) dragging = null;
    }
    function keyDown(event: KeyboardEvent) {
      if (isTyping(event.target) || event.metaKey || event.ctrlKey) return;
      pressed.add(event.key.toLowerCase());
      if (event.key.startsWith("Arrow")) event.preventDefault();
    }
    function keyUp(event: KeyboardEvent) {
      pressed.delete(event.key.toLowerCase());
    }
    function clear() {
      pressed.clear();
    }
    element.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    window.addEventListener("blur", clear);
    return () => {
      element.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", clear);
    };
  }, [gl]);

  const walkable = (north: number, east: number) =>
    isWalkable(street, north + BODY_RADIUS, east) &&
    isWalkable(street, north - BODY_RADIUS, east) &&
    isWalkable(street, north, east + BODY_RADIUS) &&
    isWalkable(street, north, east - BODY_RADIUS);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const p = player.current;
    const pressed = keys.current;
    const has = (...names: string[]) => names.some((name) => pressed.has(name));

    if (has("arrowleft", "q")) p.yaw += TURN_SPEED * delta;
    if (has("arrowright", "e")) p.yaw -= TURN_SPEED * delta;

    let forward = (has("w", "arrowup") ? 1 : 0) - (has("s", "arrowdown") ? 1 : 0) + walkInput.joystickY;
    let strafe = (has("d") ? 1 : 0) - (has("a") ? 1 : 0) + walkInput.joystickX;
    const length = Math.hypot(forward, strafe);
    if (length > 1) {
      forward /= length;
      strafe /= length;
    }
    const speed = (has("shift") ? RUN_SPEED : WALK_SPEED) * delta;
    // Camera forward at yaw is (−sin, −cos) in (x = north, z = east); right is (cos, −sin).
    const dNorth = (-Math.sin(p.yaw) * forward + Math.cos(p.yaw) * strafe) * speed;
    const dEast = (-Math.cos(p.yaw) * forward - Math.sin(p.yaw) * strafe) * speed;
    if (dNorth || dEast) {
      // Slide along walls: try the full step, then each axis on its own.
      if (walkable(p.north + dNorth, p.east + dEast)) {
        p.north += dNorth;
        p.east += dEast;
      } else if (walkable(p.north + dNorth, p.east)) p.north += dNorth;
      else if (walkable(p.north, p.east + dEast)) p.east += dEast;
      p.bob += Math.hypot(dNorth, dEast) * 2.2;
    }

    const bob = Math.sin(p.bob * Math.PI) * 0.035;
    camera.position.set(STREET_ORIGIN.x + p.north, STREET_ORIGIN.y + EYE_HEIGHT + bob, STREET_ORIGIN.z + p.east);
    camera.rotation.set(p.pitch, p.yaw, 0, "YXZ");
    runtime.cameraTarget.set(camera.position.x - Math.sin(p.yaw), camera.position.y, camera.position.z - Math.cos(p.yaw));
    runtime.streetPlayer.set(p.north, 0, p.east);
  });

  return null;
}

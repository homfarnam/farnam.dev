"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CameraControls, CameraControlsImpl } from "@react-three/drei";
import { Box3, Vector3 } from "three";
import { GEO, project } from "@/lib/world/geo";
import { chamberToWorld, JOURNEY_MAP_SHOT, type Vec3 } from "@/lib/world/layout";
import { runtime } from "@/lib/world/runtime";
import { useExperience } from "@/stores/experienceStore";

const { ACTION } = CameraControlsImpl;
const DRAG_THRESHOLD_PX = 8;

/** World-space box around the Journey map, so free look can't wander off into the void. */
function journeyBounds(): Box3 {
  const { lonMin, lonMax, latMin, latMax } = GEO.bounds;
  const box = new Box3();
  for (const [lon, lat] of [
    [lonMin, latMin],
    [lonMin, latMax],
    [lonMax, latMin],
    [lonMax, latMax],
  ] as const) {
    const [x, z] = project(lon, lat);
    box.expandByPoint(new Vector3(...chamberToWorld("journey", [x, 0, z] as Vec3)));
  }
  box.min.y = 0;
  box.max.y = 14;
  return box;
}

function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}

/**
 * Free exploration of the Journey map.
 * Mouse: drag to pan, right-drag to orbit, scroll to zoom (towards the cursor).
 * Touch: one finger pans, two fingers pinch/rotate.
 * Keys: WASD / arrows move, Q/E turn, +/− zoom, Shift for speed, Esc returns to the story.
 */
function ExploreControls() {
  const controls = useRef<CameraControlsImpl>(null);
  const camera = useThree((state) => state.camera);
  const keys = useRef(new Set<string>());
  const bounds = useMemo(journeyBounds, []);
  const scratch = useMemo(() => ({ target: new Vector3(), forward: new Vector3(), right: new Vector3() }), []);

  useEffect(() => {
    const instance = controls.current;
    if (!instance) return;
    // Start exactly where the story camera was looking.
    void instance.setLookAt(
      camera.position.x,
      camera.position.y,
      camera.position.z,
      runtime.cameraTarget.x,
      runtime.cameraTarget.y,
      runtime.cameraTarget.z,
      false,
    );
    instance.setBoundary(bounds);
    // From the globe (which is unrolling right now), glide down to the map overview first.
    if (runtime.globe > 0.5) {
      const [position, target] = [JOURNEY_MAP_SHOT.position, JOURNEY_MAP_SHOT.target].map((local) =>
        chamberToWorld("journey", local),
      ) as [Vec3, Vec3];
      void instance.setLookAt(...position, ...target, true);
    }
    instance.mouseButtons.left = ACTION.TRUCK;
    instance.mouseButtons.right = ACTION.ROTATE;
    instance.mouseButtons.middle = ACTION.DOLLY;
    instance.mouseButtons.wheel = ACTION.DOLLY;
    instance.touches.one = ACTION.TOUCH_TRUCK;
    instance.touches.two = ACTION.TOUCH_DOLLY_ROTATE;
  }, [camera, bounds]);

  useEffect(() => {
    const pressed = keys.current;
    function down(event: KeyboardEvent) {
      if (isTyping(event.target) || event.metaKey || event.ctrlKey) return;
      pressed.add(event.key.toLowerCase());
    }
    function up(event: KeyboardEvent) {
      pressed.delete(event.key.toLowerCase());
    }
    function clear() {
      pressed.clear();
    }
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
    };
  }, []);

  useFrame((_, delta) => {
    const instance = controls.current;
    if (!instance) return;
    instance.getTarget(scratch.target);
    runtime.cameraTarget.copy(scratch.target);

    const pressed = keys.current;
    if (!pressed.size) return;
    const fast = pressed.has("shift") ? 2.4 : 1;
    const distance = instance.distance;
    const speed = Math.max(4, distance * 0.9) * fast * delta;
    // Move along the ground, relative to where the camera faces.
    camera.getWorldDirection(scratch.forward).setY(0).normalize();
    scratch.right.set(-scratch.forward.z, 0, scratch.forward.x);
    let moveX = 0;
    let moveZ = 0;
    if (pressed.has("w") || pressed.has("arrowup")) moveZ += 1;
    if (pressed.has("s") || pressed.has("arrowdown")) moveZ -= 1;
    if (pressed.has("d") || pressed.has("arrowright")) moveX += 1;
    if (pressed.has("a") || pressed.has("arrowleft")) moveX -= 1;
    if (moveX || moveZ) {
      scratch.target.addScaledVector(scratch.forward, moveZ * speed).addScaledVector(scratch.right, moveX * speed);
      void instance.moveTo(scratch.target.x, scratch.target.y, scratch.target.z, false);
    }
    if (pressed.has("q")) void instance.rotate(-1.4 * delta * fast, 0, false);
    if (pressed.has("e")) void instance.rotate(1.4 * delta * fast, 0, false);
    if (pressed.has("=") || pressed.has("+")) void instance.dolly(speed * 1.2, false);
    if (pressed.has("-") || pressed.has("_")) void instance.dolly(-speed * 1.2, false);
  });

  return (
    <CameraControls
      ref={controls}
      makeDefault
      minDistance={2.5}
      maxDistance={95}
      minPolarAngle={0.12}
      maxPolarAngle={1.36}
      dollyToCursor
      smoothTime={0.18}
      draggingSmoothTime={0.08}
    />
  );
}

/**
 * Grabbing the map is the way in: a drag on the canvas in the Journey switches
 * to free look (a plain click still selects beacons). F toggles it too.
 */
function ExploreTrigger() {
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    const element = gl.domElement;
    let start: { x: number; y: number } | null = null;

    function eligible() {
      const state = useExperience.getState();
      return (
        state.phase === "explore" &&
        state.chapter === "journey" &&
        !state.travellingTo &&
        !state.journeyExplore &&
        !state.walking &&
        !state.panel &&
        // On the globe, a drag spins the Earth instead.
        runtime.globe < 0.5
      );
    }
    function down(event: PointerEvent) {
      start = eligible() ? { x: event.clientX, y: event.clientY } : null;
    }
    function move(event: PointerEvent) {
      if (!start) return;
      if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > DRAG_THRESHOLD_PX) {
        start = null;
        enter();
      }
    }
    function up() {
      start = null;
    }
    function key(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "f" || isTyping(event.target) || event.metaKey || event.ctrlKey) return;
      const state = useExperience.getState();
      if (state.chapter !== "journey" || state.travellingTo || state.panel || state.walking) return;
      if (state.journeyExplore) state.setJourneyExplore(false);
      else enter();
    }
    function enter() {
      const state = useExperience.getState();
      state.setJourneyExplore(true);
      state.showToast("Free look — drag to move, right-drag to turn, scroll to zoom · WASD · Q/E · Esc to return");
    }

    element.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("keydown", key);
    return () => {
      element.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("keydown", key);
    };
  }, [gl]);

  return null;
}

export function FreeLook() {
  const active = useExperience((state) => state.journeyExplore && state.chapter === "journey" && !state.travellingTo);
  return (
    <>
      <ExploreTrigger />
      {active ? <ExploreControls /> : null}
    </>
  );
}

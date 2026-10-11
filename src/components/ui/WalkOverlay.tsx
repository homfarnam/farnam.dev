"use client";

import { useEffect, useRef, useState } from "react";
import { walkInput } from "@/components/street/WalkControls";
import { sounds } from "@/lib/audio/engine";
import { STREET_STYLES } from "@/lib/world/street";
import { useExperience } from "@/stores/experienceStore";

/** Thumb joystick for touch screens: drag within the ring to walk. */
function Joystick() {
  const base = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  useEffect(() => () => void Object.assign(walkInput, { joystickX: 0, joystickY: 0 }), []);

  function update(event: React.PointerEvent) {
    const rect = base.current?.getBoundingClientRect();
    if (!rect) return;
    const radius = rect.width / 2;
    let x = (event.clientX - rect.left - radius) / radius;
    let y = (event.clientY - rect.top - radius) / radius;
    const length = Math.hypot(x, y);
    if (length > 1) {
      x /= length;
      y /= length;
    }
    setKnob({ x, y });
    walkInput.joystickX = x;
    walkInput.joystickY = -y;
  }
  function release() {
    setKnob({ x: 0, y: 0 });
    walkInput.joystickX = 0;
    walkInput.joystickY = 0;
  }

  return (
    <div
      ref={base}
      role="presentation"
      className="fixed bottom-24 left-6 z-30 h-32 w-32 touch-none rounded-full border border-line bg-navy/50 [@media(pointer:fine)]:hidden"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        update(event);
      }}
      onPointerMove={(event) => event.buttons && update(event)}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <span
        className="absolute top-1/2 left-1/2 h-12 w-12 rounded-full bg-ink/80"
        style={{ transform: `translate(calc(-50% + ${knob.x * 40}px), calc(-50% + ${knob.y * 40}px))` }}
      />
    </div>
  );
}

/**
 * Street-walk chrome: a fade from black on entry (covers the scene swap),
 * where you are, how to move, and the way back up.
 */
export function WalkOverlay() {
  const walking = useExperience((state) => state.walking);
  const style = STREET_STYLES[useExperience((state) => state.walkStreet)];
  const setWalking = useExperience((state) => state.setWalking);
  const [veil, setVeil] = useState(false);

  useEffect(() => {
    if (!walking) return;
    setVeil(true);
    const timer = window.setTimeout(() => setVeil(false), 900);
    return () => window.clearTimeout(timer);
  }, [walking]);

  if (!walking) return null;

  return (
    <>
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed inset-0 z-40 bg-void transition-opacity duration-[1400ms] ${veil ? "opacity-100" : "opacity-0"}`}
      />
      <section
        aria-label={`Walking: ${style.title}`}
        className="instrument fixed top-20 left-4 z-30 max-w-xs px-5 py-4 sm:left-6"
      >
        <p className="font-mono text-xs text-cyan">{style.kicker}</p>
        <h2 className="mt-1 text-2xl font-medium tracking-tight">{style.title}</h2>
        <p className="mt-2 text-sm text-ink/80">{style.provenance}</p>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 font-mono text-[11px] text-mute [@media(pointer:coarse)]:hidden">
          <dt className="text-ink">W A S D · ↑ ↓</dt>
          <dd>walk</dd>
          <dt className="text-ink">Drag · ← → · Q E</dt>
          <dd>look around</dd>
          <dt className="text-ink">Shift</dt>
          <dd>run</dd>
          <dt className="text-ink">Esc</dt>
          <dd>fly back up</dd>
        </dl>
        <button
          type="button"
          onClick={() => {
            sounds.select();
            setWalking(false);
          }}
          className="mt-4 bg-ember px-4 py-2 text-sm font-medium text-void hover:brightness-110"
        >
          Fly back up
        </button>
      </section>
      <Joystick />
    </>
  );
}

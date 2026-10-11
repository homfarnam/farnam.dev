"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { sounds } from "@/lib/audio/engine";

/**
 * Pointer hover state for a 3D hotspot. Sets the cursor, plays a soft tick
 * and exposes a ref-based value that render loops can ease towards.
 */
export function useHoverable(enabled = true) {
  const [hovered, setHovered] = useState(false);
  const hoverRef = useRef(0);

  const onPointerOver = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      if (!enabled) return;
      event.stopPropagation();
      setHovered(true);
      hoverRef.current = 1;
      document.body.style.cursor = "pointer";
      sounds.hover();
    },
    [enabled],
  );

  const onPointerOut = useCallback(() => {
    setHovered(false);
    hoverRef.current = 0;
    document.body.style.cursor = "";
  }, []);

  useEffect(() => {
    if (!enabled && hovered) onPointerOut();
  }, [enabled, hovered, onPointerOut]);

  useEffect(() => () => void (document.body.style.cursor = ""), []);

  return { hovered, hoverRef, bind: { onPointerOver, onPointerOut } };
}

"use client";

import { chapters } from "@/data/chapters";
import { ChapterDoor } from "@/components/objects/ChapterDoor";
import { Dust } from "@/components/objects/Dust";
import { Guitar } from "@/components/objects/Guitar";
import { HoloCore } from "@/components/objects/HoloCore";
import { LabStructure } from "@/components/objects/LabStructure";
import { Workstation } from "@/components/objects/Workstation";
import { HUB_RADIUS } from "@/lib/world/layout";

/** Chapter 01 — the laboratory hub every other chapter opens from. */
export function AwakeningScene() {
  return (
    <group>
      <LabStructure />
      <HoloCore />
      {chapters
        .filter((chapter) => chapter.id !== "awakening")
        .map((chapter) => (
          <ChapterDoor key={chapter.id} chapter={chapter} />
        ))}
      <Workstation position={[-5.6, 0, 1.6]} rotationY={0.55} />
      <Guitar position={[6.3, 0, -2.4]} rotationY={-0.6} scale={2.3} />
      <Dust count={900} radius={HUB_RADIUS} height={7} />
    </group>
  );
}

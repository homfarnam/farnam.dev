"use client";

import { useExperience } from "@/stores/experienceStore";
import { Dialog } from "./Dialog";

const CONTROLS: [string, string][] = [
  ["Click / tap", "Open doors, artifacts and screens"],
  ["Drag", "Turn a selected artifact"],
  ["← → · Next / Back", "Next or previous stop on the story path"],
  ["1 – 6", "Jump to a chapter"],
  ["H", "Back to the laboratory"],
  ["D", "Open the dossier"],
  ["` (backtick)", "Open the console"],
  ["Esc", "Close whatever is open"],
  ["Tab", "Reach every hotspot without a mouse"],
];

export function HelpPanel() {
  const closeTopmost = useExperience((state) => state.closeTopmost);
  return (
    <Dialog title="How to move around" kicker="help" onClose={closeTopmost}>
      <dl className="space-y-3">
        {CONTROLS.map(([keys, action]) => (
          <div key={keys} className="grid grid-cols-[11rem_1fr] gap-4 text-sm">
            <dt className="font-mono text-cyan">{keys}</dt>
            <dd className="text-ink/90">{action}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-6 text-sm text-mute">Some things in the lab only reveal themselves to the curious.</p>
    </Dialog>
  );
}

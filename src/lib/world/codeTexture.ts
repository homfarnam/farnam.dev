import { CanvasTexture, SRGBColorSpace } from "three";
import { projects } from "@/data/projects";
import { skillGroups } from "@/data/profile";

/** Lines shown scrolling on the workstation monitors — built from real data. */
const SOURCE_LINES = [
  "$ farnam --status",
  "location ........ Amsterdam, NL",
  "experience ...... 10+ yrs, since 2015",
  "",
  "import { curiosity } from './origin'",
  "",
  ...skillGroups.map(
    (group) =>
      `const ${group.id} = [${group.items
        .slice(0, 3)
        .map((item) => `'${item}'`)
        .join(", ")}]`,
  ),
  "",
  ...projects.map((project) => `deploy('${project.id}')  // ${project.codename}`),
  "",
  "while (true) { learn(); build(); ship(); }",
  "",
  "> type `help` in the console",
];

export interface ScrollingCode {
  texture: CanvasTexture;
  update: (time: number, power: number) => void;
}

export function createScrollingCode(width = 512, height = 320, accent = "#22D3EE"): ScrollingCode {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  const lineHeight = 22;
  let lastDrawn = -1;

  function update(time: number, power: number) {
    if (!context) return;
    // Redraw at ~12fps — plenty for a terminal and cheap on the GPU upload.
    const frame = Math.floor(time * 12);
    if (frame === lastDrawn) return;
    lastDrawn = frame;
    context.fillStyle = "#05080F";
    context.fillRect(0, 0, width, height);
    context.font = "15px 'IBM Plex Mono', monospace";
    const offset = (time * 18) % (SOURCE_LINES.length * lineHeight);
    for (let index = -1; index < height / lineHeight + 1; index += 1) {
      const lineIndex = Math.floor((index * lineHeight + offset) / lineHeight) % SOURCE_LINES.length;
      const text = SOURCE_LINES[(lineIndex + SOURCE_LINES.length) % SOURCE_LINES.length] ?? "";
      const y = index * lineHeight - (offset % lineHeight) + 28;
      context.fillStyle = text.startsWith("$") || text.startsWith(">") ? accent : text.startsWith("//") ? "#64748B" : "#94A3B8";
      context.globalAlpha = power;
      context.fillText(text, 18, y);
    }
    context.globalAlpha = 0.08 * power;
    context.fillStyle = accent;
    for (let y = 0; y < height; y += 3) context.fillRect(0, y, width, 1);
    context.globalAlpha = 1;
    texture.needsUpdate = true;
  }

  return { texture, update };
}

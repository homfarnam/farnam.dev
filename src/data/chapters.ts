export type ChapterId = "awakening" | "journey" | "engineer" | "creator" | "musician" | "human";

export interface Chapter {
  id: ChapterId;
  number: number;
  title: string;
  place: string;
  /** Short line shown on the door and in the chapter selector. */
  hint: string;
  /** Narrative beats revealed one at a time when the chapter opens. */
  narrative: string[];
  /** Built and explorable in the current phase. */
  open: boolean;
  /** Direction from the hub in degrees, measured from -Z towards +X. Unused for the hub. */
  bearing: number;
  color: string;
}

export const chapters: Chapter[] = [
  {
    id: "awakening",
    number: 1,
    title: "The Awakening",
    place: "The laboratory",
    hint: "Where the lights come back on.",
    narrative: [
      "You've entered a world built from curiosity, creativity, and code.",
      "Every door here leads somewhere I've been.",
    ],
    open: true,
    bearing: 0,
    color: "#22D3EE",
  },
  {
    id: "journey",
    number: 2,
    title: "The Journey",
    place: "Tehran to Amsterdam",
    hint: "From a violin in Tehran to a keyboard in Amsterdam.",
    narrative: ["Every route starts somewhere. Mine starts in Tehran.", "It plays by itself. Space to pause."],
    open: true,
    bearing: -36,
    color: "#F97316",
  },
  {
    id: "engineer",
    number: 3,
    title: "The Engineer",
    place: "The architecture room",
    hint: "Systems built to perform, scale and evolve.",
    narrative: [
      "I started with curiosity.",
      "Over time, curiosity became craftsmanship.",
      "Today, I build systems designed to perform, scale, and evolve.",
    ],
    open: false,
    bearing: -74,
    color: "#3B82F6",
  },
  {
    id: "creator",
    number: 4,
    title: "The Creator",
    place: "The project vault",
    hint: "Five artifacts. Each one solved a real problem.",
    narrative: ["Things I built, kept in the dark until someone looks.", "Pick one up. Turn it over. Open it."],
    open: true,
    bearing: 36,
    color: "#22D3EE",
  },
  {
    id: "musician",
    number: 5,
    title: "The Musician",
    place: "The sound chamber",
    hint: "Violin, guitar, accordion — and the noise in between.",
    narrative: [
      "Before I started building digital experiences, music taught me something important.",
      "Precision matters. Practice matters. But emotion is what makes something memorable.",
    ],
    open: false,
    bearing: 74,
    color: "#F97316",
  },
  {
    id: "human",
    number: 6,
    title: "The Human",
    place: "The observatory",
    hint: "The person behind the work.",
    narrative: ["You've explored what I've built.", "Now, maybe we can build something together."],
    open: false,
    // Directly behind the holo-core: the person behind the work.
    bearing: 0,
    color: "#F8FAFC",
  },
];

export const chapterOrder: ChapterId[] = chapters.map((chapter) => chapter.id);

export function getChapter(id: ChapterId): Chapter {
  const chapter = chapters.find((candidate) => candidate.id === id);
  if (!chapter) throw new Error(`Unknown chapter: ${id}`);
  return chapter;
}

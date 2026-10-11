import { journeyStops } from "@/data/journey";

/**
 * The Journey as a scene that plays itself: the globe and the flight line
 * first, then every stop in order, each held long enough to read its card.
 * `null` is the globe overview. Times are seconds.
 */
export interface Segment {
  stop: number | null;
  start: number;
  duration: number;
}

const INTRO_SECONDS = 7;
/** The move holds for the airliner's whole gate-to-gate run. */
const MOVE_SECONDS = 16;

function readingTime(text: string): number {
  return Math.min(10, 5 + text.length / 40);
}

export const segments: Segment[] = (() => {
  const list: Segment[] = [{ stop: null, start: 0, duration: INTRO_SECONDS }];
  journeyStops.forEach((stop, index) => {
    const previous = list[list.length - 1];
    const start = previous ? previous.start + previous.duration : 0;
    const duration = stop.kind === "move" ? MOVE_SECONDS : readingTime(stop.title + stop.body);
    list.push({ stop: index, start, duration });
  });
  return list;
})();

const last = segments[segments.length - 1];
export const TOTAL_SECONDS = last ? last.start + last.duration : 0;

/** Play head, advanced per frame by JourneyPlayback; read by the timeline UI without re-renders. */
export const player = { elapsed: 0 };

export function segmentIndexAt(seconds: number): number {
  const index = segments.findIndex((segment) => seconds < segment.start + segment.duration);
  return index === -1 ? segments.length - 1 : index;
}

export function segmentIndexOf(stop: number | null): number {
  return Math.max(
    0,
    segments.findIndex((segment) => segment.stop === stop),
  );
}

export function formatClock(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

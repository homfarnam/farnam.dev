"use client";

import { useEffect, useRef } from "react";
import { journeyKindColor, journeyStops } from "@/data/journey";
import { sounds } from "@/lib/audio/engine";
import { CITY_KM, FLIGHT_KM, formatKm } from "@/lib/world/globe";
import { flightProgress } from "@/lib/world/journey";
import { formatClock, player, segments, TOTAL_SECONDS } from "@/lib/world/journeyPlayer";
import { toggleJourneyPlay } from "@/components/experience/JourneyPlayback";
import { runtime } from "@/lib/world/runtime";
import { useExperience } from "@/stores/experienceStore";

const KIND_LABEL = { music: "Music", work: "Work", move: "The move" } as const;

/** Kilometres flown so far, written straight to the DOM every frame (no re-renders). */
function LiveKm({ source }: { source: "globe" | "flight" }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let frame = 0;
    const { liftoff, touchdown } = flightProgress;
    function tick() {
      const share =
        source === "globe"
          ? runtime.globeArc
          : Math.min(1, Math.max(0, (runtime.planeProgress - liftoff) / (touchdown - liftoff)));
      if (ref.current) ref.current.textContent = formatKm(FLIGHT_KM * share);
      frame = requestAnimationFrame(tick);
    }
    tick();
    return () => cancelAnimationFrame(frame);
  }, [source]);
  return <span ref={ref} aria-hidden="true" className="tabular-nums" />;
}

/**
 * The Journey's transport bar: play/pause, one cell per segment (the globe,
 * then every stop) that fills as the scene plays, and the running time.
 * Cells are also the way to jump; the play head follows.
 */
function PlayerBar({ onJump }: { onJump: (stop: number | null) => void }) {
  const playing = useExperience((state) => state.journeyPlaying);
  const journeyStop = useExperience((state) => state.journeyStop);
  const fills = useRef<(HTMLSpanElement | null)[]>([]);
  const clock = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let frame = 0;
    function tick() {
      segments.forEach((segment, index) => {
        const fill = fills.current[index];
        if (!fill) return;
        const share = Math.min(1, Math.max(0, (player.elapsed - segment.start) / segment.duration));
        fill.style.transform = `scaleX(${share})`;
      });
      if (clock.current) clock.current.textContent = formatClock(player.elapsed);
      frame = requestAnimationFrame(tick);
    }
    tick();
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <nav aria-label="Journey timeline" className="fixed inset-x-0 bottom-20 z-30 flex justify-center px-3 sm:bottom-24">
      <div className="instrument flex max-w-full items-center gap-1 px-1.5 py-1.5">
        <button
          type="button"
          onClick={() => {
            sounds.select();
            toggleJourneyPlay();
          }}
          aria-label={playing ? "Pause the journey" : "Play the journey"}
          title={playing ? "Pause (Space)" : "Play (Space)"}
          className="flex h-9 w-9 shrink-0 items-center justify-center bg-ink text-void hover:bg-ember"
        >
          {playing ? (
            <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden="true">
              <rect x="2" y="1.5" width="3" height="9" fill="currentColor" />
              <rect x="7" y="1.5" width="3" height="9" fill="currentColor" />
            </svg>
          ) : (
            <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden="true">
              <path d="M3 1.5 L10.5 6 L3 10.5 Z" fill="currentColor" />
            </svg>
          )}
        </button>
        <ol className="flex min-w-0 items-center gap-0.5 overflow-x-auto [scrollbar-width:none]">
          {segments.map((segment, index) => {
            const entry = segment.stop === null ? null : journeyStops[segment.stop];
            const active = segment.stop === journeyStop;
            const label = entry ? `${entry.when}: ${entry.title}` : "The globe: Tehran to Amsterdam";
            return (
              <li key={entry?.id ?? "globe"}>
                <button
                  type="button"
                  onClick={() => onJump(segment.stop)}
                  aria-current={active ? "step" : undefined}
                  aria-label={label}
                  title={label}
                  className={`relative flex h-9 min-w-9 flex-col items-center justify-center px-1.5 font-mono text-[10px] transition-colors ${
                    active ? "bg-ink/10 text-ink" : "text-mute hover:text-ink"
                  }`}
                >
                  {entry ? (
                    <span
                      className="mb-1 block h-1.5 w-1.5 rounded-full"
                      style={{ background: journeyKindColor[entry.kind], opacity: active ? 1 : 0.55 }}
                      aria-hidden="true"
                    />
                  ) : (
                    <svg viewBox="0 0 10 10" className="mb-0.5 h-2.5 w-2.5" aria-hidden="true">
                      <circle cx="5" cy="5" r="4" fill="none" stroke="currentColor" strokeWidth="1" />
                      <path
                        d="M1 5 H9 M5 1 C3 3.5 3 6.5 5 9 M5 1 C7 3.5 7 6.5 5 9"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="0.8"
                      />
                    </svg>
                  )}
                  {entry ? `’${entry.year.slice(2)}` : "Earth"}
                  {/* Play head: fills while this part of the scene plays. */}
                  <span aria-hidden="true" className="absolute inset-x-1 bottom-0 h-0.5 bg-ink/15">
                    <span
                      ref={(element) => {
                        fills.current[index] = element;
                      }}
                      className="block h-full origin-left scale-x-0 bg-ember"
                    />
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <p className="hidden shrink-0 px-2 font-mono text-[10px] text-mute tabular-nums sm:block" aria-hidden="true">
          <span ref={clock}>0:00</span> / {formatClock(TOTAL_SECONDS)}
        </p>
      </div>
    </nav>
  );
}

/**
 * Story card for the current stop, plus a timeline of every stop.
 * The timeline is also the keyboard/screen-reader route through the chapter.
 */
export function JourneyPanel() {
  const chapter = useExperience((state) => state.chapter);
  const travellingTo = useExperience((state) => state.travellingTo);
  const journeyStop = useExperience((state) => state.journeyStop);
  const focusJourneyStop = useExperience((state) => state.focusJourneyStop);
  const exploring = useExperience((state) => state.journeyExplore);
  const walking = useExperience((state) => state.walking);
  const setWalking = useExperience((state) => state.setWalking);
  const setJourneyExplore = useExperience((state) => state.setJourneyExplore);
  const playing = useExperience((state) => state.journeyPlaying);

  if (chapter !== "journey" || travellingTo || walking) return null;
  const stop = journeyStop === null ? null : journeyStops[journeyStop];

  function go(index: number | null) {
    sounds.select();
    focusJourneyStop(index);
  }

  return (
    <>
      {/* Story ↔ free look */}
      <div
        role="group"
        aria-label="Journey view"
        className="instrument fixed top-20 right-4 z-30 flex p-1 font-mono text-xs sm:right-6"
      >
        {(
          [
            ["Story", false],
            ["Explore", true],
          ] as const
        ).map(([label, value]) => (
          <button
            key={label}
            type="button"
            aria-pressed={exploring === value}
            onClick={() => {
              sounds.select();
              setJourneyExplore(value);
            }}
            className={`px-3 py-1.5 transition-colors ${exploring === value ? "bg-ink text-void" : "text-mute hover:text-ink"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {exploring ? (
        <div className="instrument fixed bottom-36 left-4 z-30 max-w-[calc(100vw-2rem)] px-4 py-3 text-sm sm:left-6">
          <p className="font-medium">Free look</p>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 font-mono text-[11px] text-mute">
            <dt className="text-ink">Drag</dt>
            <dd>move across the map</dd>
            <dt className="text-ink">Right-drag</dt>
            <dd>turn</dd>
            <dt className="text-ink">Scroll</dt>
            <dd>zoom to the cursor</dd>
            <dt className="text-ink">WASD · Q E</dt>
            <dd>fly · turn (Shift = faster)</dd>
            <dt className="text-ink">Esc</dt>
            <dd>back to the story</dd>
          </dl>
        </div>
      ) : stop ? (
        <section
          key={stop.id}
          aria-live="polite"
          aria-label={`${stop.when}: ${stop.title}`}
          className="instrument fixed inset-x-2 top-20 z-30 animate-[line-in_600ms_var(--ease-out-expo)] px-5 py-4 md:inset-x-auto md:top-auto md:bottom-36 md:left-6 md:w-[380px] md:px-6 md:py-5"
        >
          <p className="font-mono text-xs" style={{ color: journeyKindColor[stop.kind] }}>
            {stop.when} · {KIND_LABEL[stop.kind]}
          </p>
          <h2 className="mt-1.5 text-2xl font-medium tracking-tight md:text-3xl">{stop.title}</h2>
          <p className="mt-1 text-sm text-mute">{stop.place}</p>
          <p className="mt-3 leading-relaxed text-ink/90">{stop.body}</p>
          {stop.region === "flight" ? (
            <>
              <p className="sr-only">Imam Khomeini (IKA) to Schiphol (AMS): {formatKm(FLIGHT_KM)} km great-circle distance.</p>
              <p aria-hidden="true" className="mt-3 font-mono text-xs text-mute">
                <span className="text-ink">
                  <LiveKm source="flight" />
                </span>{" "}
                / {formatKm(FLIGHT_KM)} km · IKA → AMS
              </p>
            </>
          ) : null}
          {stop.region !== "flight" ? (
            <button
              type="button"
              onClick={() => {
                sounds.select();
                setWalking(true, stop.region === "amsterdam" ? "herengracht" : "tajrish");
              }}
              className="mt-4 bg-ember px-4 py-2 text-sm font-medium text-void hover:brightness-110"
            >
              {stop.region === "amsterdam" ? "Walk the canals" : "Walk the streets of Tajrish"}
            </button>
          ) : null}
          <p className="mt-4 font-mono text-[11px] text-mute">
            {(journeyStop ?? 0) + 1} / {journeyStops.length} ·{" "}
            {playing ? "playing · Space to pause" : "→ next · Space to play · drag to explore"}
          </p>
        </section>
      ) : (
        <section
          aria-label={`Tehran to Amsterdam: ${formatKm(FLIGHT_KM)} kilometres, great-circle distance`}
          className="instrument fixed inset-x-2 top-20 z-30 animate-[line-in_700ms_var(--ease-out-expo)] px-5 py-4 md:inset-x-auto md:top-auto md:bottom-36 md:left-6 md:w-[380px] md:px-6 md:py-5"
        >
          <p className="font-mono text-xs text-ember">March 2022 · one-way, direct</p>
          <h2 className="mt-1.5 text-2xl font-medium tracking-tight md:text-3xl">Tehran → Amsterdam</h2>
          <p className="mt-2 text-4xl font-medium tracking-tight md:text-5xl">
            <LiveKm source="globe" />
            <span className="ml-2 text-lg text-mute md:text-xl">km</span>
          </p>
          <p className="mt-2 text-sm leading-relaxed text-mute">
            Great-circle distance from Imam Khomeini (IKA) to Schiphol (AMS), the shortest path over the Earth. City centre to
            city centre: {formatKm(CITY_KM)} km. Real flight paths bend around closed airspace.
          </p>
          {playing ? (
            <p className="mt-4 font-mono text-[11px] text-mute">playing · Space to pause · drag to spin the Earth</p>
          ) : (
            <>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                <button
                  type="button"
                  onClick={() => {
                    sounds.select();
                    toggleJourneyPlay();
                  }}
                  className="bg-ember px-4 py-2 text-sm font-medium text-void hover:brightness-110"
                >
                  ▶ Play the journey · {formatClock(TOTAL_SECONDS)}
                </button>
                <button
                  type="button"
                  onClick={() => go(0)}
                  className="text-sm text-mute underline-offset-4 hover:text-ink hover:underline"
                >
                  or step through it
                </button>
              </div>
              <p className="mt-3 hidden font-mono text-[11px] text-mute md:block">drag to spin the Earth · F for free look</p>
            </>
          )}
        </section>
      )}

      <p className="fixed right-4 bottom-[8.5rem] z-20 max-w-[min(30rem,calc(100vw-2rem))] text-right font-mono text-[10px] leading-relaxed text-mute/80 sm:bottom-[9.5rem] md:max-w-[min(30rem,calc(100vw-27rem))]">
        Tehran{" "}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 hover:text-ink"
        >
          © OpenStreetMap contributors
        </a>{" "}
        · Amsterdam buildings{" "}
        <a href="https://3dbag.nl" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-ink">
          3DBAG
        </a>{" "}
        (CC BY 4.0), canals & streets OSM · coastlines Natural Earth
      </p>

      <PlayerBar onJump={go} />
    </>
  );
}

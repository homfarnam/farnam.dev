"use client";

import { useEffect, useState } from "react";
import { profile, skillGroups } from "@/data/profile";
import { setAudioEnabled, sounds } from "@/lib/audio/engine";
import { useExperience, type ExplorationMode } from "@/stores/experienceStore";

const VISITED_KEY = "farnam:visited";

interface Beat {
  text: string;
  kind: "system" | "voice";
}

const FIRST_VISIT: Beat[] = [
  { text: "SYSTEM INITIALIZING...", kind: "system" },
  { text: "UNKNOWN VISITOR DETECTED", kind: "system" },
  { text: "ESTABLISHING CONNECTION...", kind: "system" },
  { text: `Hello, stranger. I'm ${profile.name}.`, kind: "voice" },
];

const RETURNING: Beat[] = [
  { text: "KNOWN SIGNAL — CONNECTION RESTORED", kind: "system" },
  { text: "Welcome back.", kind: "voice" },
];

const BEAT_GAP_MS = { system: 900, voice: 1100 };

/** The headline: who, in two lines. Facts only (see src/data/profile.ts). */
const HEADLINE = [`${profile.experienceYears}+ years of code.`, "Tehran → Amsterdam."];

const stack = (id: string, count: number) => skillGroups.find((group) => group.id === id)?.items.slice(0, count) ?? [];

const FACTS: [string, string][] = [
  ["Based in", "Amsterdam, NL"],
  ["From", "Tehran, Iran"],
  ["Role", profile.fullTitle],
  ["Stack", [...stack("frontend", 2), ...stack("backend", 1), "GraphQL"].join(", ")],
  ["Music", "Violin, guitar, accordion"],
];

function readVisited(): boolean {
  try {
    return window.localStorage.getItem(VISITED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeVisited() {
  try {
    window.localStorage.setItem(VISITED_KEY, "1");
  } catch {
    // Storage blocked (private mode) — the intro simply plays again next time.
  }
}

/**
 * The cinematic opening. Skippable at any time, shortened for returning
 * visitors, and skipped outright when reduced motion is requested.
 */
export function BootSequence() {
  const phase = useExperience((state) => state.phase);
  const sceneReady = useExperience((state) => state.sceneReady);
  const reducedMotion = useExperience((state) => state.reducedMotion);
  const audioEnabled = useExperience((state) => state.audioEnabled);
  const setAudio = useExperience((state) => state.setAudio);
  const begin = useExperience((state) => state.begin);
  const setTextMode = useExperience((state) => state.setTextMode);

  const [beats, setBeats] = useState<Beat[] | null>(null);
  const [shown, setShown] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);

  // Decide the script on the client only (localStorage), never during render.
  useEffect(() => {
    setBeats(readVisited() ? RETURNING : FIRST_VISIT);
  }, []);

  useEffect(() => {
    if (!beats) return;
    if (reducedMotion) {
      setShown(beats.length);
      return;
    }
    if (shown >= beats.length) return;
    const beat = beats[shown];
    const delay = shown === 0 ? 500 : BEAT_GAP_MS[beats[shown - 1]?.kind ?? "system"];
    const timer = window.setTimeout(() => {
      setShown((count) => count + 1);
      if (beat?.kind === "system") sounds.pulse();
    }, delay);
    return () => window.clearTimeout(timer);
  }, [beats, shown, reducedMotion]);

  const finished = beats !== null && shown >= beats.length;

  function skip() {
    if (beats) setShown(beats.length);
  }

  function start(mode: ExplorationMode) {
    writeVisited();
    setLeaving(true);
    begin(mode);
    window.setTimeout(() => setGone(true), reducedMotion ? 0 : 1100);
  }

  function toggleSound() {
    const next = !audioEnabled;
    setAudioEnabled(next);
    setAudio(next);
    if (next) sounds.select();
  }

  if (gone || (phase === "explore" && !leaving)) return null;

  const system = beats?.slice(0, shown).filter((beat) => beat.kind === "system") ?? [];
  const voice = beats?.slice(0, shown).filter((beat) => beat.kind === "voice") ?? [];

  return (
    <div
      className={`fixed inset-0 z-40 flex flex-col justify-between px-6 py-8 transition-opacity duration-1000 sm:px-12 sm:py-10 ${
        leaving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      style={{ background: "radial-gradient(ellipse at 50% 60%, rgb(8 11 18 / 0.35), rgb(8 11 18 / 0.92) 70%)" }}
    >
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-1 font-mono text-xs text-cyan/80 sm:text-sm" aria-live="polite">
          {system.map((beat) => (
            <p key={beat.text} className="animate-[line-in_500ms_ease-out]">
              {beat.text}
            </p>
          ))}
          {!finished && beats && shown < beats.length && beats[shown]?.kind === "system" ? (
            <p className="caret" aria-hidden="true" />
          ) : null}
        </div>
        {!finished ? (
          <button
            type="button"
            onClick={skip}
            className="shrink-0 font-mono text-xs text-mute underline-offset-4 hover:text-ink hover:underline"
          >
            Skip intro
          </button>
        ) : null}
      </div>

      <div className="max-w-6xl">
        <div aria-live="polite">
          {voice.map((beat) => (
            <p key={beat.text} className="animate-[line-in_900ms_var(--ease-out-expo)] text-lg text-ink/75 sm:text-2xl">
              {beat.text}
            </p>
          ))}
        </div>
        {finished ? (
          <>
            <h1
              aria-label={HEADLINE.join(" ")}
              className="mt-3 text-[clamp(2.6rem,7.1vw,7.5rem)] leading-[0.95] font-bold tracking-[-0.045em] sm:mt-5"
            >
              {HEADLINE.map((line, index) => (
                <span key={line} aria-hidden="true" className="block overflow-hidden pb-[0.06em]">
                  <span
                    className="block animate-[rise-in_1100ms_var(--ease-out-expo)_both]"
                    style={{ animationDelay: `${index * 140}ms` }}
                  >
                    {line.split("→").map((part, partIndex) =>
                      partIndex === 0 ? (
                        part
                      ) : (
                        <span key={part}>
                          <span className="text-ember">→</span>
                          {part}
                        </span>
                      ),
                    )}
                  </span>
                </span>
              ))}
            </h1>
            <span
              aria-hidden="true"
              className="mt-6 block h-px origin-left animate-[draw-x_1200ms_var(--ease-out-expo)_both] bg-gradient-to-r from-ember via-cyan/60 to-transparent"
              style={{ animationDelay: "380ms" }}
            />
            <dl className="mt-5 grid grid-cols-2 gap-x-8 gap-y-3 font-mono text-[11px] sm:flex sm:flex-wrap sm:gap-x-10">
              {FACTS.map(([label, value], index) => (
                <div
                  key={label}
                  className="animate-[line-in_700ms_var(--ease-out-expo)_both]"
                  style={{ animationDelay: `${520 + index * 90}ms` }}
                >
                  <dt className="tracking-[0.18em] text-mute uppercase">{label}</dt>
                  <dd className="mt-1 text-xs text-ink/90 sm:text-[13px]">{value}</dd>
                </div>
              ))}
            </dl>
          </>
        ) : null}
      </div>

      <div
        className={`flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between ${finished ? "animate-[line-in_700ms_ease-out]" : "invisible"}`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={!sceneReady || !finished}
            onClick={() => start("guided")}
            className="group relative bg-ember px-6 py-3 font-medium text-void transition-[filter,transform] hover:brightness-110 active:scale-[0.98] disabled:cursor-wait disabled:opacity-50"
          >
            {sceneReady ? "Begin exploring" : "Powering up the lab…"}
          </button>
          <button
            type="button"
            disabled={!sceneReady || !finished}
            onClick={() => start("free")}
            className="border border-line px-6 py-3 text-ink transition-colors hover:border-cyan hover:text-cyan disabled:opacity-50"
          >
            Wander freely
          </button>
        </div>
        <div className="flex items-center gap-5 font-mono text-xs text-mute">
          <button type="button" onClick={toggleSound} aria-pressed={audioEnabled} className="hover:text-ink">
            Sound {audioEnabled ? "on" : "off"}
          </button>
          <button type="button" onClick={() => setTextMode(true)} className="hover:text-ink">
            Text version
          </button>
        </div>
      </div>
    </div>
  );
}

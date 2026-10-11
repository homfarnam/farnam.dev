"use client";

import { chapters, getChapter } from "@/data/chapters";
import { profile } from "@/data/profile";
import { journeyStops } from "@/data/journey";
import { projects } from "@/data/projects";
import { setAudioEnabled, sounds } from "@/lib/audio/engine";
import { step, stopAt } from "@/lib/world/stops";
import { useExperience } from "@/stores/experienceStore";

function stopLabel(offset: 1 | -1): string | null {
  const stop = stopAt(offset);
  if (!stop) return null;
  if (stop.project) return projects.find((project) => project.id === stop.project)?.codename ?? null;
  if (stop.journeyStop !== null) {
    const entry = journeyStops[stop.journeyStop];
    return entry ? `${entry.year} · ${entry.title}` : null;
  }
  return getChapter(stop.chapter).title;
}

/** Persistent chrome: where you are, how to get anywhere, and the global toggles. */
export function HUD() {
  const phase = useExperience((state) => state.phase);
  const chapterId = useExperience((state) => state.chapter);
  const travellingTo = useExperience((state) => state.travellingTo);
  const focusedProject = useExperience((state) => state.focusedProject);
  // Subscribed so the "Next" label follows journey stops and hides while walking.
  useExperience((state) => state.journeyStop);
  useExperience((state) => state.walking);
  const mode = useExperience((state) => state.mode);
  const audioEnabled = useExperience((state) => state.audioEnabled);
  const quality = useExperience((state) => state.quality);
  const goTo = useExperience((state) => state.goTo);
  const openPanel = useExperience((state) => state.openPanel);
  const focusProject = useExperience((state) => state.focusProject);
  const setAudio = useExperience((state) => state.setAudio);
  const setQuality = useExperience((state) => state.setQuality);
  const setTextMode = useExperience((state) => state.setTextMode);

  if (phase !== "explore") return null;

  const walking = useExperience.getState().walking;
  const chapter = getChapter(travellingTo ?? chapterId);
  // The story path pauses while walking the street (Esc or "Fly back up" returns).
  const next = walking ? null : stopLabel(1);
  const previous = walking ? null : stopLabel(-1);

  function toggleSound() {
    const nextValue = !audioEnabled;
    setAudioEnabled(nextValue);
    setAudio(nextValue);
    if (nextValue) sounds.select();
  }

  return (
    <>
      {/* Top bar */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-start justify-between gap-4 p-4 sm:p-6">
        <div className="pointer-events-auto">
          <button type="button" onClick={() => goTo("awakening")} className="text-left" aria-label="Return to the laboratory">
            <span className="block text-lg font-medium tracking-tight">{profile.name}</span>
            <span className="block font-mono text-[11px] text-mute">{profile.fullTitle}</span>
          </button>
        </div>
        <nav
          aria-label="Tools"
          className="pointer-events-auto flex flex-wrap items-center justify-end gap-x-4 gap-y-2 font-mono text-xs text-mute"
        >
          <button type="button" onClick={() => openPanel("dossier")} className="text-ink hover:text-cyan">
            Dossier
          </button>
          <button type="button" onClick={toggleSound} aria-pressed={audioEnabled} className="hover:text-ink">
            Sound {audioEnabled ? "on" : "off"}
          </button>
          <button
            type="button"
            onClick={() => setQuality(quality === "high" ? "low" : "high")}
            className="hidden hover:text-ink sm:inline"
            title="Lower quality reduces particles and turns off bloom"
          >
            Quality {quality}
          </button>
          <button
            type="button"
            onClick={() => setTextMode(true)}
            disabled={travellingTo !== null}
            className="hover:text-ink disabled:opacity-40"
          >
            Text version
          </button>
          <button type="button" onClick={() => openPanel("help")} className="hover:text-ink" aria-label="Controls and help">
            ?
          </button>
        </nav>
      </header>

      {/* Chapter rail */}
      <nav aria-label="Chapters" className="fixed bottom-0 left-0 z-30 p-4 sm:p-6">
        <p className="mb-3 hidden font-mono text-[11px] text-mute sm:block" aria-live="polite">
          <span className="text-cyan">0{chapter.number}</span> {chapter.title} — {chapter.place}
        </p>
        <ol className="flex gap-1.5">
          {chapters.map((candidate) => {
            const active = candidate.id === chapterId && !travellingTo;
            return (
              <li key={candidate.id}>
                <button
                  type="button"
                  onClick={() => goTo(candidate.id)}
                  aria-current={active ? "location" : undefined}
                  aria-label={`Chapter ${candidate.number}: ${candidate.title}${candidate.open ? "" : " (sealed)"}`}
                  title={`${candidate.title}${candidate.open ? "" : " — sealed"}`}
                  className={`group relative flex h-10 min-w-10 items-center justify-center border px-2 font-mono text-xs transition-colors ${
                    active
                      ? "border-cyan bg-cyan/10 text-cyan"
                      : candidate.open
                        ? "border-line text-ink hover:border-cyan/60"
                        : "border-line/60 text-mute/60 hover:text-mute"
                  }`}
                >
                  0{candidate.number}
                  {!candidate.open ? (
                    <span className="absolute -top-1 -right-1 h-1.5 w-1.5 bg-ember/70" aria-hidden="true" />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Story path */}
      <div className="fixed right-0 bottom-0 z-30 flex items-end gap-2 p-4 sm:p-6">
        {previous ? (
          <button
            type="button"
            onClick={() => step(-1)}
            disabled={travellingTo !== null}
            className="h-10 border border-line px-3 font-mono text-xs text-mute hover:border-cyan/60 hover:text-ink"
            aria-label={`Previous: ${previous}`}
          >
            Back
          </button>
        ) : null}
        {next ? (
          <button
            type="button"
            onClick={() => step(1)}
            disabled={travellingTo !== null}
            className={`h-10 px-4 text-sm transition-colors ${
              mode === "guided"
                ? "bg-ember font-medium text-void hover:brightness-110"
                : "border border-line text-ink hover:border-cyan/60"
            }`}
          >
            <span className="hidden font-mono text-[11px] opacity-70 sm:inline">Next · </span>
            {next}
          </button>
        ) : null}
      </div>

      {/* Accessible list of the room's hotspots (mirrors every 3D interaction). */}
      {chapterId === "creator" && !travellingTo && !focusedProject ? (
        <nav
          aria-label="Artifacts in the vault"
          className="sr-only focus-within:not-sr-only focus-within:fixed focus-within:top-24 focus-within:left-4 focus-within:z-40 focus-within:instrument focus-within:p-4"
        >
          <ul className="space-y-2">
            {projects.map((project) => (
              <li key={project.id}>
                <button
                  type="button"
                  id={`hotspot-${project.id}`}
                  onClick={() => focusProject(project.id)}
                  className="text-left text-sm hover:text-cyan"
                >
                  {project.codename}: {project.name}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
      {chapterId === "awakening" && !travellingTo ? (
        <nav
          aria-label="Things in the laboratory"
          className="sr-only focus-within:not-sr-only focus-within:fixed focus-within:top-24 focus-within:left-4 focus-within:z-40 focus-within:instrument focus-within:p-4"
        >
          <ul className="space-y-2 text-sm">
            <li>
              <button type="button" onClick={() => openPanel("dossier")} className="hover:text-cyan">
                Central display: open the dossier
              </button>
            </li>
            <li>
              <button type="button" onClick={() => openPanel("terminal")} className="hover:text-cyan">
                Workstation: open the console
              </button>
            </li>
            {chapters
              .filter((candidate) => candidate.id !== "awakening")
              .map((candidate) => (
                <li key={candidate.id}>
                  <button type="button" onClick={() => goTo(candidate.id)} className="hover:text-cyan">
                    Door {candidate.number}: {candidate.title}
                    {candidate.open ? "" : " (sealed)"}
                  </button>
                </li>
              ))}
          </ul>
        </nav>
      ) : null}
    </>
  );
}

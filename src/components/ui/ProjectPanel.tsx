"use client";

import { useEffect, useRef } from "react";
import { isPlaceholder } from "@/data/profile";
import { getProject, projects, type SimulationKind } from "@/data/projects";
import { DashboardSimulation } from "@/components/simulations/DashboardSimulation";
import { PdfSimulation } from "@/components/simulations/PdfSimulation";
import { RadarSimulation } from "@/components/simulations/RadarSimulation";
import { StreamingSimulation } from "@/components/simulations/StreamingSimulation";
import { TelegramSimulation } from "@/components/simulations/TelegramSimulation";
import { useExperience } from "@/stores/experienceStore";

const SIMULATIONS: Record<SimulationKind, () => React.JSX.Element> = {
  streaming: StreamingSimulation,
  telegram: TelegramSimulation,
  radar: RadarSimulation,
  pdf: PdfSimulation,
  dashboard: DashboardSimulation,
};

/**
 * Details for the focused artifact. Non-modal on purpose: the visitor can
 * keep dragging the artifact in the scene while reading.
 */
export function ProjectPanel() {
  const focusedProject = useExperience((state) => state.focusedProject);
  const focusProject = useExperience((state) => state.focusProject);
  const travellingTo = useExperience((state) => state.travellingTo);
  const heading = useRef<HTMLHeadingElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<string | null>(null);

  useEffect(() => {
    if (focusedProject) {
      lastFocused.current = focusedProject;
      heading.current?.focus({ preventScroll: true });
      scroller.current?.scrollTo({ top: 0 });
    } else if (lastFocused.current) {
      // Return keyboard focus to the hotspot that opened the panel, if it exists.
      document.getElementById(`hotspot-${lastFocused.current}`)?.focus();
      lastFocused.current = null;
    }
  }, [focusedProject]);

  if (!focusedProject || travellingTo) return null;
  const project = getProject(focusedProject);
  const Simulation = SIMULATIONS[project.simulation];
  const index = projects.findIndex((candidate) => candidate.id === project.id);
  const previous = projects[index - 1];
  const next = projects[index + 1];

  return (
    <aside
      key={project.id}
      aria-labelledby="project-title"
      className="instrument fixed inset-x-2 bottom-2 z-30 flex max-h-[58vh] animate-[line-in_600ms_var(--ease-out-expo)] flex-col md:inset-x-auto md:top-20 md:right-6 md:bottom-20 md:max-h-none md:w-[440px] md:animate-[slide-in-right_600ms_var(--ease-out-expo)]"
    >
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div>
          <p className="font-mono text-xs text-cyan">
            {project.index} · {project.codename}
          </p>
          <h2 id="project-title" ref={heading} tabIndex={-1} className="mt-1 text-2xl font-medium tracking-tight outline-none">
            {project.name}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => focusProject(null)}
          className="mt-1 shrink-0 font-mono text-xs text-mute hover:text-ink"
        >
          Close <kbd className="ml-1 rounded border border-line px-1">Esc</kbd>
        </button>
      </div>

      <div ref={scroller} data-scrollable className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
        <p className="text-lg leading-snug text-ink/90">{project.oneLiner}</p>

        <div className="mt-6">
          <Simulation />
        </div>

        <dl className="mt-8 space-y-6 text-[15px] leading-relaxed">
          <Section term="The problem">{project.problem}</Section>
          <Section term="My role">{project.role}</Section>
          <Section term="What I built">
            <ul className="list-inside list-disc marker:text-cyan">
              {project.contributions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Section>
          <Section term="Technology">
            {project.tech.length === 0 ? <span className="text-mute">To be added.</span> : null}
            <ul className="flex flex-wrap gap-1.5">
              {project.tech.map((item) => (
                <li key={item} className="border border-line px-2 py-0.5 font-mono text-xs text-ink/90">
                  {item}
                </li>
              ))}
            </ul>
          </Section>
          <Section term="Engineering challenges">
            <ul className="space-y-1.5">
              {project.challenges.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Section>
          <Section term="How it fits together">
            <ol className="space-y-1.5">
              {project.architecture.map((item, step) => (
                <li key={item} className="flex gap-3">
                  <span className="font-mono text-xs leading-6 text-cyan">{step + 1}</span>
                  {item}
                </li>
              ))}
            </ol>
          </Section>
          <Section term="Outcome">
            {project.outcomes.length ? (
              project.outcomes.join(" · ")
            ) : (
              <span className="text-mute">Measured outcomes to be added.</span>
            )}
          </Section>
          <Section term="Links">
            <div className="flex gap-4 text-sm">
              {(["github", "live"] as const).map((kind) => {
                const href = project.links[kind];
                const label = kind === "github" ? "Source" : "Live";
                return isPlaceholder(href) ? (
                  <span key={kind} className="text-mute">
                    {label} <span className="font-mono text-[11px] text-ember">pending</span>
                  </span>
                ) : (
                  <a
                    key={kind}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="underline decoration-cyan/50 underline-offset-4"
                  >
                    {label}
                  </a>
                );
              })}
            </div>
          </Section>
        </dl>
      </div>

      <div className="flex items-center justify-between border-t border-line px-5 py-3 font-mono text-xs">
        <button
          type="button"
          disabled={!previous}
          onClick={() => previous && focusProject(previous.id)}
          className="text-mute hover:text-ink disabled:opacity-30"
        >
          {previous ? previous.codename : "—"}
        </button>
        <span className="hidden text-mute md:inline">drag the artifact to turn it</span>
        <button
          type="button"
          disabled={!next}
          onClick={() => next && focusProject(next.id)}
          className="text-mute hover:text-ink disabled:opacity-30"
        >
          {next ? next.codename : "—"}
        </button>
      </div>
    </aside>
  );
}

function Section({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="mb-1.5 font-mono text-xs text-mute">{term}</dt>
      <dd>{children}</dd>
    </div>
  );
}

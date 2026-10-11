"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { chapters } from "@/data/chapters";
import { contactLinks, isPlaceholder, music, profile, roles, skillGroups } from "@/data/profile";
import { projects } from "@/data/projects";
import { sounds } from "@/lib/audio/engine";
import { useExperience } from "@/stores/experienceStore";
import { Dialog } from "./Dialog";

interface Line {
  id: number;
  text: string;
  tone: "input" | "output" | "accent" | "error";
}

const HELP = [
  "help        list commands",
  "about       who runs this lab",
  "skills      the toolbox",
  "projects    things that were built",
  "music       the other instrument",
  "contact     how to reach Farnam",
  "goto <n>    travel to chapter n (1-6)",
  "clear       wipe the screen",
  "exit        close the console",
];

function run(command: string): { lines: string[]; tone?: Line["tone"]; action?: () => void } {
  const [name = "", ...args] = command.trim().split(/\s+/);
  const state = useExperience.getState();
  switch (name.toLowerCase()) {
    case "":
      return { lines: [] };
    case "help":
      return { lines: HELP };
    case "about":
      return {
        lines: [
          `${profile.name} — ${profile.fullTitle}`,
          profile.location,
          `${profile.experienceYears}+ years of professional frontend development, since 2015.`,
          ...roles.map((role) => `${role.current ? "now " : "prev"}  ${role.company}${role.context ? ` (${role.context})` : ""}`),
          `interests: ${profile.interests.join(", ").toLowerCase()}`,
        ],
      };
    case "skills":
      return { lines: skillGroups.map((group) => `${group.label.padEnd(15)} ${group.items.join(", ")}`) };
    case "projects":
    case "ls":
      return { lines: projects.map((project) => `${project.index}  ${project.name.padEnd(30)} ${project.outcomes[0] ?? ""}`) };
    case "music":
      return {
        lines: [
          ...music.instruments.map((instrument) => `${instrument.name.padEnd(16)} ${instrument.note}`),
          `loves: ${music.loves.join(", ").toLowerCase()}`,
        ],
      };
    case "contact":
      return {
        lines: contactLinks.map((link) => `${link.label.padEnd(10)} ${isPlaceholder(link.href) ? "(link pending)" : link.href}`),
      };
    case "goto": {
      const target = chapters.find((chapter) => String(chapter.number) === args[0] || chapter.id === args[0]);
      if (!target) return { lines: ["usage: goto <1-6>"], tone: "error" };
      return { lines: [`routing to ${target.title.toLowerCase()}...`], tone: "accent", action: () => state.goTo(target.id) };
    }
    case "whoami":
      return { lines: ["a visitor. curious, evidently."] };
    case "sudo":
      return { lines: ["permission denied: this lab runs on trust, not root."], tone: "error" };
    case "hint":
      return { lines: ["old consoles remember old codes. ↑ ↑ ↓ ↓ ..."], tone: "accent" };
    case "play":
      sounds.phrase();
      return { lines: [state.audioEnabled ? "♪" : "sound is off — turn it on in the top bar first."] };
    case "exit":
      return { lines: [], action: () => state.closeTopmost() };
    default:
      return { lines: [`command not found: ${name}. type 'help'.`], tone: "error" };
  }
}

/** Retro-futuristic console hidden in the workstation. */
export function TerminalPanel() {
  const closeTopmost = useExperience((state) => state.closeTopmost);
  const [lines, setLines] = useState<Line[]>([{ id: 0, text: "farnam-lab console v0.1 — type 'help'", tone: "accent" }]);
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState(-1);
  const counter = useRef(1);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [lines]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const command = value;
    setValue("");
    setCursor(-1);
    if (command.trim()) setHistory((previous) => [command, ...previous]);
    if (command.trim().toLowerCase() === "clear") {
      setLines([]);
      return;
    }
    const result = run(command);
    const next: Line[] = [{ id: counter.current++, text: `> ${command}`, tone: "input" }];
    result.lines.forEach((text) => next.push({ id: counter.current++, text, tone: result.tone ?? "output" }));
    setLines((previous) => [...previous, ...next]);
    sounds.hover();
    if (result.action) window.setTimeout(result.action, 350);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const nextCursor = Math.max(-1, Math.min(history.length - 1, cursor + (event.key === "ArrowUp" ? 1 : -1)));
      setCursor(nextCursor);
      setValue(nextCursor === -1 ? "" : (history[nextCursor] ?? ""));
    }
  }

  const toneClass: Record<Line["tone"], string> = {
    input: "text-ink",
    output: "text-mute",
    accent: "text-cyan",
    error: "text-ember",
  };

  return (
    <Dialog title="Console" kicker="workstation / tty0" onClose={closeTopmost} width="lg" initialFocus="input">
      <div className="scanlines -mx-6 -my-6 bg-[#05080F] px-6 py-5 font-mono text-[13px] leading-relaxed" data-scrollable>
        <div className="max-h-[50vh] min-h-[16rem] overflow-y-auto" aria-live="polite">
          {lines.map((line) => (
            <pre key={line.id} className={`whitespace-pre-wrap ${toneClass[line.tone]}`}>
              {line.text}
            </pre>
          ))}
          <div ref={bottom} />
        </div>
        <form onSubmit={submit} className="mt-3 flex items-center gap-2 border-t border-line pt-3">
          <label htmlFor="console-input" className="text-cyan">
            visitor@lab:~$
          </label>
          <input
            id="console-input"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={onKeyDown}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent text-ink outline-none"
          />
        </form>
      </div>
    </Dialog>
  );
}

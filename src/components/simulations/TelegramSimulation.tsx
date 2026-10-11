"use client";

import { useEffect, useRef, useState } from "react";
import { sounds } from "@/lib/audio/engine";
import { useExperience } from "@/stores/experienceStore";

type Stage = "idle" | "uploading" | "extracting" | "sending" | "done";

const STAGES: { stage: Stage; label: string; ms: number }[] = [
  { stage: "uploading", label: "Downloading video…", ms: 1400 },
  { stage: "extracting", label: "Extracting the audio track…", ms: 1700 },
  { stage: "sending", label: "Sending audio…", ms: 900 },
];

/** Simulated chat with the video-to-audio bot. No network, no Telegram. */
export function TelegramSimulation() {
  const audioEnabled = useExperience((state) => state.audioEnabled);
  const [stage, setStage] = useState<Stage>("idle");
  const [playing, setPlaying] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), []);

  function send() {
    setStage("uploading");
    let elapsed = 0;
    STAGES.forEach((entry, index) => {
      elapsed += entry.ms;
      const nextStage = STAGES[index + 1]?.stage ?? "done";
      timers.current.push(
        window.setTimeout(() => {
          setStage(nextStage);
          if (nextStage === "done") sounds.ping();
        }, elapsed),
      );
    });
  }

  function play() {
    setPlaying(true);
    sounds.phrase();
    timers.current.push(window.setTimeout(() => setPlaying(false), 1200));
  }

  const status = STAGES.find((entry) => entry.stage === stage)?.label;

  return (
    <div className="border border-line bg-[#0B1220]">
      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <span className="text-sm">Video → Audio bot</span>
        <span className="font-mono text-[10px] text-mute">simulation</span>
      </div>
      <div className="min-h-44 space-y-3 px-4 py-4 text-sm" aria-live="polite">
        <p className="max-w-[80%] rounded-sm bg-navy px-3 py-2 text-ink/90">Send me any video and I'll send back its audio.</p>
        {stage !== "idle" ? (
          <p className="ml-auto max-w-[70%] rounded-sm bg-signal/25 px-3 py-2 text-right">
            🎬 lecture.mp4 <span className="block font-mono text-[10px] text-mute">sample file</span>
          </p>
        ) : null}
        {status ? (
          <p className="max-w-[80%] rounded-sm bg-navy px-3 py-2 text-mute">
            <span className="caret">{status}</span>
          </p>
        ) : null}
        {stage === "done" ? (
          <div className="flex max-w-[80%] items-center gap-3 rounded-sm bg-navy px-3 py-2">
            <button
              type="button"
              onClick={play}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan text-void"
              aria-label="Play the converted audio"
            >
              ▶
            </button>
            <span className="flex h-6 flex-1 items-center gap-[2px]" aria-hidden="true">
              {Array.from({ length: 28 }, (_, index) => (
                <span
                  key={index}
                  className="w-[3px] bg-cyan/70 transition-[height] duration-300"
                  style={{
                    height: `${playing ? 20 + Math.abs(Math.sin(index * 1.7)) * 80 : 18 + Math.abs(Math.sin(index * 0.9)) * 50}%`,
                  }}
                />
              ))}
            </span>
            <span className="font-mono text-[10px] text-mute">lecture.mp3</span>
          </div>
        ) : null}
        {stage === "done" && !audioEnabled ? (
          <p className="font-mono text-[11px] text-mute">Sound is off — turn it on in the top bar to hear the result.</p>
        ) : null}
      </div>
      <div className="border-t border-line px-4 py-3">
        <button
          type="button"
          onClick={stage === "done" ? () => setStage("idle") : send}
          disabled={stage !== "idle" && stage !== "done"}
          className="bg-cyan px-4 py-2 text-sm font-medium text-void disabled:opacity-50"
        >
          {stage === "done" ? "Reset demo" : "Send a video"}
        </button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { sounds } from "@/lib/audio/engine";

const DESKS = ["Amsterdam", "Den Haag", "Rotterdam", "Zwolle", "Den Bosch", "Eindhoven"];
const SCAN_MS = 900;

interface Alert {
  desk: string;
  time: string;
}

/** Simulated availability monitor: scans desks and raises an alert when a slot appears. */
export function RadarSimulation() {
  const [running, setRunning] = useState(false);
  const [checks, setChecks] = useState(0);
  const [active, setActive] = useState(0);
  const [alert, setAlert] = useState<Alert | null>(null);
  const interval = useRef<number | null>(null);

  useEffect(() => () => void (interval.current && window.clearInterval(interval.current)), []);

  function start() {
    setRunning(true);
    setAlert(null);
    setChecks(0);
    // A slot "opens" after a few rounds so the demo always ends with an alert.
    const foundAfter = DESKS.length * 2 + Math.floor(Math.random() * DESKS.length);
    let count = 0;
    interval.current = window.setInterval(() => {
      count += 1;
      setChecks(count);
      setActive(count % DESKS.length);
      if (count >= foundAfter) {
        if (interval.current) window.clearInterval(interval.current);
        const hour = 9 + Math.floor(Math.random() * 7);
        setAlert({ desk: DESKS[count % DESKS.length] ?? "Amsterdam", time: `${hour}:${Math.random() > 0.5 ? "20" : "40"}` });
        setRunning(false);
        sounds.ping();
      }
    }, SCAN_MS);
  }

  return (
    <div className="border border-line bg-[#0B1220]">
      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <span className="text-sm">Appointment monitor</span>
        <span className="font-mono text-[10px] text-mute">simulation · fictional data</span>
      </div>
      <ul className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3">
        {DESKS.map((desk, index) => {
          const scanning = running && index === active;
          const found = alert?.desk === desk;
          return (
            <li
              key={desk}
              className={`bg-[#0B1220] px-3 py-3 text-sm transition-colors ${scanning ? "bg-cyan/10" : ""} ${found ? "bg-ember/15" : ""}`}
            >
              <span className="block">{desk}</span>
              <span className={`font-mono text-[10px] ${found ? "text-ember" : scanning ? "text-cyan" : "text-mute"}`}>
                {found ? "slot found" : scanning ? "checking…" : "no slots"}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center justify-between gap-4 px-4 py-3" aria-live="polite">
        <span className="font-mono text-[11px] text-mute">{checks} checks</span>
        <button
          type="button"
          onClick={start}
          disabled={running}
          className="bg-cyan px-4 py-2 text-sm font-medium text-void disabled:opacity-50"
        >
          {running ? "Scanning…" : alert ? "Scan again" : "Start monitoring"}
        </button>
      </div>
      {alert ? (
        <div
          role="alert"
          className="mx-4 mb-4 animate-[line-in_500ms_ease-out] border-l-2 border-ember bg-ember/10 px-3 py-2 text-sm"
        >
          <span className="block font-medium">New appointment available</span>
          <span className="text-mute">
            {alert.desk} desk · today {alert.time} — notification sent
          </span>
        </div>
      ) : null}
    </div>
  );
}

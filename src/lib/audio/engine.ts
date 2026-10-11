/**
 * Tiny Web Audio synth. No samples, no licensing questions.
 * The AudioContext is only created after the visitor enables sound
 * (a user gesture), and every sound is a no-op while sound is off.
 */

let context: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = false;

function ensureContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!context) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
    master = context.createGain();
    master.gain.value = 0.35;
    master.connect(context.destination);
  }
  return context;
}

export function setAudioEnabled(next: boolean): void {
  enabled = next;
  const ctx = ensureContext();
  if (!ctx) return;
  if (next) void ctx.resume();
  else void ctx.suspend();
}

interface ToneOptions {
  frequency: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
  attack?: number;
  glideTo?: number;
  delay?: number;
}

export function playTone({
  frequency,
  duration,
  type = "sine",
  gain = 0.2,
  attack = 0.01,
  glideTo,
  delay = 0,
}: ToneOptions): void {
  if (!enabled) return;
  const ctx = ensureContext();
  if (!ctx || !master) return;
  const start = ctx.currentTime + delay;
  const oscillator = ctx.createOscillator();
  const envelope = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  if (glideTo) oscillator.frequency.exponentialRampToValueAtTime(glideTo, start + duration);
  envelope.gain.setValueAtTime(0, start);
  envelope.gain.linearRampToValueAtTime(gain, start + attack);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(envelope).connect(master);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.05);
}

export const sounds = {
  hover: () => playTone({ frequency: 1320, duration: 0.06, type: "sine", gain: 0.04 }),
  select: () => {
    playTone({ frequency: 660, duration: 0.12, type: "triangle", gain: 0.12 });
    playTone({ frequency: 990, duration: 0.18, type: "sine", gain: 0.08, delay: 0.05 });
  },
  power: () => playTone({ frequency: 55, duration: 2.4, type: "sawtooth", gain: 0.08, attack: 0.6, glideTo: 110 }),
  travel: () => playTone({ frequency: 180, duration: 1.4, type: "sine", gain: 0.1, attack: 0.3, glideTo: 520 }),
  ping: () => {
    playTone({ frequency: 1760, duration: 0.25, type: "sine", gain: 0.1 });
    playTone({ frequency: 2637, duration: 0.35, type: "sine", gain: 0.06, delay: 0.08 });
  },
  pulse: () => playTone({ frequency: 82, duration: 0.5, type: "sine", gain: 0.18, attack: 0.02 }),
  /** Plays a short melodic phrase — stands in for the "converted audio" in the bot demo. */
  phrase: () => {
    const notes = [440, 554.37, 659.25, 880, 659.25, 554.37];
    notes.forEach((frequency, index) =>
      playTone({ frequency, duration: 0.3, type: "triangle", gain: 0.12, delay: index * 0.16 }),
    );
  },
};

// Interface audio layer — synthesized with Web Audio API. Muted by default.
import { useSyncExternalStore } from "react";

export type SoundName = "tick" | "enter" | "back" | "tab" | "copy" | "success" | "error" | "notify";

const KEY = "ui-sound-on";
let enabled = false;
let ctx: AudioContext | null = null;
const listeners = new Set<() => void>();

if (typeof window !== "undefined") {
  try {
    enabled = window.localStorage.getItem(KEY) === "1";
  } catch {
    enabled = false;
  }
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", gain = 0.06, endFreq?: number) {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime + start;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noiseClick(gain = 0.05) {
  const c = getCtx();
  if (!c) return;
  const len = Math.floor(c.sampleRate * 0.012);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = c.createBufferSource();
  const f = c.createBiquadFilter();
  f.type = "highpass";
  f.frequency.value = 2400;
  const g = c.createGain();
  g.gain.value = gain;
  s.buffer = buf;
  s.connect(f).connect(g).connect(c.destination);
  s.start();
}

const recipes: Record<SoundName, () => void> = {
  tick: () => tone(1800, 0, 0.03, "square", 0.02),
  enter: () => { tone(660, 0, 0.09, "triangle", 0.05); tone(990, 0.06, 0.14, "triangle", 0.045); },
  back: () => tone(700, 0, 0.1, "triangle", 0.045, 420),
  tab: () => { noiseClick(0.04); tone(1200, 0, 0.04, "sine", 0.03); },
  copy: () => { noiseClick(0.06); tone(2200, 0.01, 0.03, "square", 0.015); },
  success: () => { tone(523, 0, 0.1, "sine", 0.05); tone(784, 0.08, 0.18, "sine", 0.05); },
  error: () => { tone(220, 0, 0.12, "sawtooth", 0.03); tone(180, 0.1, 0.16, "sawtooth", 0.03); },
  notify: () => { tone(880, 0, 0.08, "sine", 0.04); tone(1320, 0.09, 0.1, "sine", 0.035); },
};

export function play(name: SoundName) {
  if (!enabled) return;
  try {
    recipes[name]();
  } catch {
    /* audio unavailable — silent fallback */
  }
}

export function setSound(on: boolean) {
  enabled = on;
  try { window.localStorage.setItem(KEY, on ? "1" : "0"); } catch { /* ignore */ }
  listeners.forEach((l) => l());
  if (on) play("enter");
}

export function useSoundEnabled() {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => enabled,
    () => false,
  );
}

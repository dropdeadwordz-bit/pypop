/* Sounds (ohne Audiodateien), Vibration und Konfetti */
import confetti from "canvas-confetti";
import { getState } from "./store.js";

let ctx = null;
function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}
function tone(freq, t0, dur, type = "sine", gain = 0.12) {
  const c = ac();
  const o = c.createOscillator();
  const g = c.createGain();
  const start = c.currentTime + t0;
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.linearRampToValueAtTime(gain, start + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(c.destination);
  o.start(start);
  o.stop(start + dur + 0.03);
}
const SOUNDS = {
  ok: () => { tone(880, 0, 0.12, "triangle"); tone(1318.5, 0.09, 0.2, "triangle"); },
  bad: () => { tone(233, 0, 0.18, "sine", 0.1); tone(196, 0.12, 0.24, "sine", 0.09); },
  done: () => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.09, 0.28, "triangle")),
  tap: () => tone(1250, 0, 0.05, "sine", 0.05),
  sparkle: () => [1568, 2093, 2637, 3136].forEach((f, i) => tone(f, i * 0.06, 0.22, "sine", 0.06)),
};
export function play(name) {
  if (!getState().sound) return;
  try { SOUNDS[name](); } catch { /* Audio nicht verfügbar */ }
}
export function buzz(pattern) {
  if (!getState().haptics) return;
  try { navigator.vibrate && navigator.vibrate(pattern); } catch { /* egal */ }
}
export function burst(power = 1) {
  confetti({
    particleCount: Math.round(90 * power),
    spread: 80,
    startVelocity: 38,
    origin: { y: 0.32 },
    colors: ["#FF5DA2", "#9B6BFF", "#3FD9B5", "#FFD84D", "#7AA8FF"],
    disableForReducedMotion: true,
    zIndex: 200,
  });
}

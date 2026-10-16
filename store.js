import { useSyncExternalStore } from "react";

const KEY = "pypop:v1";

export function today(d = new Date()) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${dd}`;
}
export function dayDiff(a, b) {
  const [y1, m1, d1] = a.split("-").map(Number);
  const [y2, m2, d2] = b.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}
export function addDays(s, n) {
  const [y, m, d] = s.split("-").map(Number);
  return today(new Date(y, m - 1, d + n));
}

export const initialState = () => ({
  version: 1,
  onboarded: false,
  name: "Yara",
  gruppe: "STARBYTE",
  accent: "pink",
  dailyGoal: 20,
  sound: true,
  haptics: true,
  xp: 0,
  xpByDay: {},
  lessons: {},
  streak: 0,
  bestStreak: 0,
  lastActive: null,
  freezes: 1,
  albums: 0,
  cards: [],
  badges: {},
  goalHitDays: [],
  stats: { lessons: 0, plays: 0, perfect: 0, seconds: 0, bugs: 0, answers: 0, mistakes: 0, runs: 0 },
  reward: null,
  parentPin: null,
  unlockAll: false,
  playground: "",
  createdAt: today(),
});

function migrate(s) {
  const base = initialState();
  return { ...base, ...s, stats: { ...base.stats, ...(s.stats || {}) } };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch {
    /* leer oder beschädigt: neu starten */
  }
  return initialState();
}

let state = load();
const subs = new Set();

export const getState = () => state;
export function setState(update) {
  state = typeof update === "function" ? update(state) : { ...state, ...update };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* Speicher voll oder gesperrt */
  }
  subs.forEach((f) => f());
}
export function useStore() {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    () => state
  );
}
export function resetAll() {
  setState(initialState());
}

/* Backup-Code: der komplette Fortschritt als kopierbarer Text */
export function exportCode() {
  return "PYPOP1:" + btoa(unescape(encodeURIComponent(JSON.stringify(state))));
}
export function importCode(code) {
  const t = (code || "").trim().replace(/\s+/g, "");
  if (!t.startsWith("PYPOP1:")) throw new Error("Das ist kein PyPop-Backup-Code.");
  let obj;
  try {
    obj = JSON.parse(decodeURIComponent(escape(atob(t.slice(7)))));
  } catch {
    throw new Error("Der Code ist unvollständig. Bitte komplett kopieren.");
  }
  if (!obj || typeof obj !== "object" || typeof obj.xp !== "number") {
    throw new Error("Der Code enthält keinen Fortschritt.");
  }
  setState(migrate(obj));
}

/* Lightstick-Farben = Akzentfarbe der App */
export const ACCENTS = {
  pink: { name: "Pink", main: "#E8317F", deep: "#B01D5E", soft: "#FFD9EA", glow: "#FF8CC0", ink: "#FFFFFF" },
  lila: { name: "Lila", main: "#7A4DF5", deep: "#5530C4", soft: "#E6DDFF", glow: "#B597FF", ink: "#FFFFFF" },
  mint: { name: "Mint", main: "#0C9C7B", deep: "#08765C", soft: "#CDF5E9", glow: "#5FE6C3", ink: "#FFFFFF" },
  blau: { name: "Blau", main: "#3A6CF0", deep: "#274DBA", soft: "#DAE5FF", glow: "#8CB0FF", ink: "#FFFFFF" },
  gelb: { name: "Gelb", main: "#FFC233", deep: "#C98F00", soft: "#FFF1C7", glow: "#FFDF80", ink: "#2B1A4F" },
};

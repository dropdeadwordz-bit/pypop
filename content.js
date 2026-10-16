/* Lädt alle Eras. Neue Kapitel = neue Datei src/content/era-XX.json – kein Code nötig. */
import erasMeta from "../content/eras.json";

const files = import.meta.glob("../content/era-*.json", { eager: true });
const byEra = {};
for (const mod of Object.values(files)) {
  const d = mod.default || mod;
  byEra[d.era] = d;
}

export const ERAS = erasMeta.map((m) => ({
  ...m,
  lessons: (byEra[m.era]?.lessons || []).map((l) => ({ ...l, era: m.era })),
  available: !!byEra[m.era],
}));
export const ALL_LESSONS = ERAS.flatMap((e) => e.lessons);

export const lessonById = (id) => ALL_LESSONS.find((l) => l.id === id);
export const eraOf = (lesson) => ERAS.find((e) => e.era === lesson.era);

export function isUnlocked(s, id) {
  if (s.unlockAll) return true;
  const i = ALL_LESSONS.findIndex((l) => l.id === id);
  if (i < 0) return false;
  if (i === 0) return true;
  return !!s.lessons[ALL_LESSONS[i - 1].id]?.done;
}
export const nextLesson = (s) => ALL_LESSONS.find((l) => !s.lessons[l.id]?.done);

export function makeTpl(s) {
  const name = s.name || "Yara";
  const gruppe = s.gruppe || "STARBYTE";
  return (str) =>
    str == null ? str : String(str).replaceAll("@@NAME@@", name).replaceAll("@@GRUPPE@@", gruppe);
}

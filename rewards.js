/* Belohnungssystem: XP, Level, Streak, Hiatus-Pässe, Alben, Fotokarten, Erfolge, Eltern-Belohnung */
import { today, dayDiff, addDays } from "./store.js";
import { ERAS } from "./content.js";

export const LEVELS = [
  { name: "Trainee", xp: 0 },
  { name: "Pre-Debut", xp: 60 },
  { name: "Rookie", xp: 150 },
  { name: "Rising Star", xp: 280 },
  { name: "1st Win", xp: 450 },
  { name: "All-Kill", xp: 700 },
  { name: "World Tour", xp: 1000 },
  { name: "Daesang", xp: 1400 },
  { name: "Legend", xp: 2000 },
];

export function levelFor(xp) {
  let i = 0;
  LEVELS.forEach((l, k) => { if (xp >= l.xp) i = k; });
  const cur = LEVELS[i];
  const next = LEVELS[i + 1];
  return {
    index: i,
    num: i + 1,
    name: cur.name,
    next,
    progress: next ? (xp - cur.xp) / (next.xp - cur.xp) : 1,
    toNext: next ? next.xp - xp : 0,
  };
}

export const GOALS = [
  { xp: 10, name: "Chill", desc: "1 Lektion am Tag" },
  { xp: 20, name: "Fan", desc: "2 Lektionen am Tag" },
  { xp: 30, name: "Stan", desc: "3 Lektionen am Tag" },
];

/* Fotokarten: C = normal, R = selten (Holo), L = legendär (Voll-Holo) */
export const CARDS = [
  { id: "c01", title: "Debüt-Tag", rarity: "C", c1: "#FF8CC6", c2: "#FFE3F1", body: "#4FD8B0", acc: "🎀" },
  { id: "c02", title: "Trainee", rarity: "C", c1: "#B9A4FF", c2: "#EEE8FF", body: "#4FD8B0", acc: "🎧" },
  { id: "c03", title: "Y2K", rarity: "C", c1: "#7AD7FF", c2: "#FFD1F0", body: "#FF8CC6", acc: "🕶️" },
  { id: "c04", title: "Summer Splash", rarity: "C", c1: "#5CE1E6", c2: "#FFF3B0", body: "#FFB85C", acc: "🍉" },
  { id: "c05", title: "Schulkonzept", rarity: "C", c1: "#9DB4FF", c2: "#F2F5FF", body: "#4FD8B0", acc: "🎒" },
  { id: "c06", title: "Airport Look", rarity: "C", c1: "#C8C2D8", c2: "#F7F4FF", body: "#9B8BFF", acc: "🧢" },
  { id: "c07", title: "Fansign", rarity: "C", c1: "#FFB38A", c2: "#FFF0E6", body: "#4FD8B0", acc: "🖊️" },
  { id: "c08", title: "Retro", rarity: "C", c1: "#FFCF5C", c2: "#FF9AA2", body: "#7AA8FF", acc: "📼" },
  { id: "c09", title: "Bubble Tea", rarity: "C", c1: "#E7B98A", c2: "#FFF1DE", body: "#FF8CC6", acc: "🧋" },
  { id: "r01", title: "Butterfly", rarity: "R", c1: "#D7A6FF", c2: "#A6F0FF", body: "#FF8CC6", acc: "🦋" },
  { id: "r02", title: "Dark Concept", rarity: "R", c1: "#3B2A5C", c2: "#8A6BBE", body: "#B597FF", acc: "🖤" },
  { id: "r03", title: "Cyber", rarity: "R", c1: "#00D5F0", c2: "#7C4DFF", body: "#5FE6C3", acc: "⚡" },
  { id: "r04", title: "Lightstick", rarity: "R", c1: "#FF5DA2", c2: "#FFD84D", body: "#4FD8B0", acc: "🪄" },
  { id: "r05", title: "Encore", rarity: "R", c1: "#FF6B6B", c2: "#FFD3B6", body: "#4FD8B0", acc: "🎤" },
  { id: "r06", title: "1st Win", rarity: "R", c1: "#FFD84D", c2: "#FFF7CF", body: "#FF8CC6", acc: "🏆" },
  { id: "l01", title: "World Tour", rarity: "L", c1: "#7AA8FF", c2: "#FF9AD5", body: "#4FD8B0", acc: "🌍" },
  { id: "l02", title: "Daesang", rarity: "L", c1: "#FFD84D", c2: "#FF8CC6", body: "#9B6BFF", acc: "👑" },
  { id: "l03", title: "Code Queen", rarity: "L", c1: "#9B6BFF", c2: "#3FD9B5", body: "#FF8CC6", acc: "💻" },
];
export const RARITY = { C: "Normal", R: "Selten", L: "Legendär" };

export const BADGES = [
  { id: "first_lesson", icon: "🎤", title: "Erste Lektion", desc: "Deine erste Lektion geschafft" },
  { id: "first_run", icon: "▶️", title: "Erstes Programm", desc: "Zum ersten Mal Code ausgeführt" },
  { id: "perfect_1", icon: "💎", title: "Fehlerfrei", desc: "Eine Lektion ganz ohne Fehler" },
  { id: "perfect_10", icon: "💠", title: "Perfektionistin", desc: "10 Lektionen ohne Fehler" },
  { id: "streak_3", icon: "🔥", title: "3 Tage am Stück", desc: "3-Tage-Streak" },
  { id: "streak_7", icon: "🔥", title: "1 Woche am Stück", desc: "7-Tage-Streak" },
  { id: "streak_14", icon: "🔥", title: "2 Wochen am Stück", desc: "14-Tage-Streak" },
  { id: "streak_30", icon: "☄️", title: "1 Monat am Stück", desc: "30-Tage-Streak" },
  { id: "streak_50", icon: "☄️", title: "50 Tage am Stück", desc: "50-Tage-Streak" },
  { id: "streak_100", icon: "🌟", title: "100 Tage am Stück", desc: "100-Tage-Streak" },
  { id: "goal_7", icon: "🎯", title: "Zielsicher", desc: "7-mal das Tagesziel erreicht" },
  { id: "bug_10", icon: "🐞", title: "Bug-Jägerin", desc: "10 Fehler im Code gefunden" },
  { id: "playground", icon: "🧪", title: "Experimentiererin", desc: "In der Spielwiese Code ausgeführt" },
  { id: "cards_half", icon: "🃏", title: "Halber Binder", desc: "9 Fotokarten gesammelt" },
  { id: "cards_all", icon: "🌈", title: "Kompletter Binder", desc: "Alle 18 Fotokarten gesammelt" },
  ...ERAS.map((e) => ({ id: `era_${e.era}`, icon: e.icon, title: `Era ${e.era}: ${e.name}`, desc: `${e.topic} abgeschlossen` })),
];
const STREAK_MILESTONES = [3, 7, 14, 30, 50, 100];

export function streakView(s, t = today()) {
  if (!s.lastActive) return { current: 0, doneToday: false };
  const gap = dayDiff(s.lastActive, t);
  if (gap <= 0) return { current: s.streak, doneToday: true };
  if (gap === 1) return { current: s.streak, doneToday: false, atRisk: s.streak > 0 };
  if (gap - 1 <= s.freezes) return { current: s.streak, doneToday: false, atRisk: true, freezeNeeded: gap - 1 };
  return { current: 0, doneToday: false, broken: s.streak > 0 };
}

export const xpToday = (s, t = today()) => s.xpByDay[t] || 0;

export function weekStats(s, t = today()) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(t, -i);
    days.push({ date: d, xp: s.xpByDay[d] || 0 });
  }
  let prev = 0;
  for (let i = 7; i <= 13; i++) prev += s.xpByDay[addDays(t, -i)] || 0;
  return { days, total: days.reduce((a, d) => a + d.xp, 0), prev };
}

function rewardCurrent(s, r, streakNow) {
  if (r.type === "streak") return streakNow;
  if (r.type === "lessons") return s.stats.lessons - (r.baseline || 0);
  return s.xp - (r.baseline || 0);
}
export function rewardProgress(s) {
  const r = s.reward;
  if (!r) return null;
  const cur = rewardCurrent(s, r, streakView(s).current);
  return { ...r, cur: Math.max(0, Math.min(cur, r.target)), done: !!r.achieved };
}
export const REWARD_TYPES = {
  streak: { label: "Streak-Tage", unit: "Tage" },
  lessons: { label: "Abgeschlossene Lektionen", unit: "Lektionen" },
  xp: { label: "Gesammelte XP", unit: "XP" },
};

/* Nach einer Lektion: alles verbuchen und eine Zusammenfassung liefern */
export function completeLesson(s, lesson, result) {
  const t = today();
  const prev = s.lessons[lesson.id];
  const first = !prev?.done;
  const perfect = result.mistakes === 0;
  const base = first ? (lesson.boss ? 20 : 10) : 5;
  const bonus = perfect ? (first ? 5 : 2) : 0;
  const gained = base + bonus;

  let { streak, freezes } = s;
  let streakUp = false;
  let usedFreeze = 0;
  if (s.lastActive !== t) {
    const gap = s.lastActive ? dayDiff(s.lastActive, t) : null;
    if (gap === null || gap < 0) streak = Math.max(1, gap === null ? 1 : streak);
    else if (gap === 1) streak += 1;
    else {
      const missed = gap - 1;
      if (missed <= freezes) { freezes -= missed; usedFreeze = missed; streak += 1; }
      else streak = 1;
    }
    streakUp = true;
    if (streak % 7 === 0) freezes = Math.min(3, freezes + 1);
  }

  const xpByDay = {};
  const cutoff = addDays(t, -60);
  for (const [d, v] of Object.entries(s.xpByDay)) if (d >= cutoff) xpByDay[d] = v;
  const before = xpByDay[t] || 0;
  xpByDay[t] = before + gained;
  const goalNow = before < s.dailyGoal && xpByDay[t] >= s.dailyGoal;
  const goalHitDays = goalNow ? [...s.goalHitDays.slice(-60), t] : s.goalHitDays;

  const xp = s.xp + gained;
  const lvBefore = levelFor(s.xp).index;
  const lv = levelFor(xp);
  let albums = s.albums;
  const albumReasons = [];
  if (lv.index > lvBefore) {
    albums += lv.index - lvBefore;
    albumReasons.push(`Level-Up: ${lv.name}`);
  }

  const lessons = {
    ...s.lessons,
    [lesson.id]: { done: true, perfect: !!prev?.perfect || perfect, plays: (prev?.plays || 0) + 1, first: prev?.first || t },
  };
  const stats = {
    ...s.stats,
    lessons: s.stats.lessons + (first ? 1 : 0),
    plays: s.stats.plays + 1,
    perfect: s.stats.perfect + (perfect ? 1 : 0),
    seconds: s.stats.seconds + Math.min(result.seconds, 1800),
    bugs: s.stats.bugs + result.bugs,
    answers: s.stats.answers + result.answers,
    mistakes: s.stats.mistakes + result.mistakes,
  };

  const badges = { ...s.badges };
  const newBadges = [];
  const award = (id) => {
    if (!badges[id]) { badges[id] = t; newBadges.push(id); return true; }
    return false;
  };
  if (award("first_lesson")) { albums += 1; albumReasons.push("Erste Lektion"); }
  if (perfect) award("perfect_1");
  if (stats.perfect >= 10) award("perfect_10");
  for (const n of STREAK_MILESTONES) {
    if (streak >= n && award(`streak_${n}`)) { albums += 1; albumReasons.push(`${n}-Tage-Streak`); }
  }
  if (goalHitDays.length >= 7) award("goal_7");
  if (stats.bugs >= 10) award("bug_10");

  const era = ERAS.find((e) => e.era === lesson.era);
  let eraDone = false;
  if (era && era.lessons.every((l) => lessons[l.id]?.done) && award(`era_${era.era}`)) {
    eraDone = true;
    albums += 1;
    albumReasons.push(`Era ${era.era} abgeschlossen`);
  }

  let reward = s.reward;
  let rewardReached = false;
  if (reward && !reward.achieved) {
    const tmp = { ...s, stats, xp };
    if (rewardCurrent(tmp, reward, streak) >= reward.target) {
      reward = { ...reward, achieved: t };
      rewardReached = true;
    }
  }

  const next = {
    ...s, xp, xpByDay, goalHitDays, lessons, stats, badges, albums, reward,
    streak, freezes, lastActive: t, bestStreak: Math.max(s.bestStreak, streak),
  };
  const summary = {
    lessonId: lesson.id, title: lesson.title, boss: lesson.boss, first, perfect, base, bonus, gained,
    seconds: result.seconds, answers: result.answers, mistakes: result.mistakes,
    streak, streakUp, usedFreeze, xpToday: xpByDay[t], dailyGoal: s.dailyGoal, goalNow,
    levelUp: lv.index > lvBefore ? lv.name : null, newBadges, albumsGained: albums - s.albums,
    albumReasons, eraDone: eraDone ? era : null, rewardReached: rewardReached ? reward.text : null,
  };
  return { next, summary };
}

export function awardBadge(s, id) {
  if (s.badges[id]) return { next: s, added: false };
  return { next: { ...s, badges: { ...s.badges, [id]: today() } }, added: true };
}

/* Album öffnen: zufällige Fotokarte, die noch fehlt */
export function openAlbum(s) {
  if (s.albums <= 0) return { next: s, card: null };
  const owned = new Set(s.cards);
  const missing = CARDS.filter((c) => !owned.has(c.id));
  if (!missing.length) return { next: { ...s, albums: s.albums - 1, xp: s.xp + 20 }, card: null, bonusXp: 20 };
  const weights = { C: 70, R: 25, L: 5 };
  const pools = ["C", "R", "L"].map((r) => ({ r, cards: missing.filter((c) => c.rarity === r) })).filter((p) => p.cards.length);
  const total = pools.reduce((a, p) => a + weights[p.r], 0);
  let roll = Math.random() * total;
  let pool = pools[0];
  for (const p of pools) { roll -= weights[p.r]; if (roll <= 0) { pool = p; break; } }
  const card = pool.cards[Math.floor(Math.random() * pool.cards.length)];
  const cards = [...s.cards, card.id];
  let next = { ...s, albums: s.albums - 1, cards };
  const badges = { ...next.badges };
  if (cards.length >= 9 && !badges.cards_half) badges.cards_half = today();
  if (cards.length >= CARDS.length && !badges.cards_all) badges.cards_all = today();
  next = { ...next, badges };
  return { next, card };
}

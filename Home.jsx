import { useEffect, useRef, useState } from "react";
import { useStore } from "../lib/store.js";
import { ERAS, isUnlocked, nextLesson } from "../lib/content.js";
import { levelFor, streakView, xpToday, rewardProgress, REWARD_TYPES } from "../lib/rewards.js";
import { useInstall } from "../lib/install.js";
import { toast } from "../lib/toast.js";
import Baemi from "../components/Baemi.jsx";
import { IconLock, IconCheck, IconStar, IconPlay, IconCrown } from "../components/Icons.jsx";

const OFFSETS = [0, 54, 76, 54, 0, -54, -76, -54];

function message(s, sv, xt, next) {
  if (!Object.keys(s.lessons).length) return `Bereit für deine erste Lektion, ${s.name}? Dauert nur ein paar Minuten.`;
  if (sv.broken) return "Neuer Tag, neuer Streak. Hwaiting!";
  if (sv.freezeNeeded) {
    return `Du hast ${sv.freezeNeeded === 1 ? "einen Tag" : `${sv.freezeNeeded} Tage`} verpasst. Lernst du heute, rettet dein Hiatus-Pass den Streak.`;
  }
  if (sv.atRisk) return `Eine Lektion heute, und dein ${sv.current}-Tage-Streak wächst weiter!`;
  if (xt >= s.dailyGoal) {
    return next ? "Tagesziel geschafft – daebak! Lust auf noch eine Lektion?" : "Alles geschafft, was es gerade gibt. Wiederholen bringt weiter XP!";
  }
  return `Noch ${s.dailyGoal - xt} XP bis zu deinem Tagesziel.`;
}

export function TopBar({ s, onAlbum }) {
  const lv = levelFor(s.xp);
  const sv = streakView(s);
  return (
    <header className="topbar">
      <div className="tb-chip tb-level" title="Dein Level">
        <span className="lv-num">Lv {lv.num}</span>
        <span className="lv-name">{lv.name}</span>
      </div>
      <div className={"tb-chip tb-streak" + (sv.doneToday ? " is-lit" : "")} aria-label={`Streak: ${sv.current} Tage`}>
        <span className="flame" aria-hidden="true">🔥</span>
        {sv.current}
      </div>
      <button className={"tb-chip tb-album" + (s.albums > 0 ? " has" : "")} onClick={onAlbum} aria-label={`${s.albums} Alben öffnen`}>
        <span aria-hidden="true">📀</span>
        {s.albums}
      </button>
    </header>
  );
}

function RewardCard({ rp }) {
  return (
    <div className={"reward-card" + (rp.done ? " is-done" : "")}>
      <span className="rw-icon" aria-hidden="true">🎁</span>
      <div className="grow">
        <b>{rp.done ? "Belohnung freigeschaltet!" : "Deine Belohnung"}</b>
        <p>{rp.text}</p>
        {!rp.done && <div className="mini-bar"><div style={{ width: (100 * rp.cur) / rp.target + "%" }} /></div>}
        <small>{rp.done ? "Zeig das deinen Eltern." : `${rp.cur} von ${rp.target} ${REWARD_TYPES[rp.type].unit}`}</small>
      </div>
    </div>
  );
}

function InstallBanner({ s }) {
  const install = useInstall();
  const [hidden, setHidden] = useState(false);
  if (!install || hidden || s.stats.lessons < 1) return null;
  return (
    <div className="install-banner">
      <span aria-hidden="true">📲</span>
      <p>Hol dir PyPop als App auf den Startbildschirm – mit eigenem Icon, ohne Browserleiste.</p>
      <div className="row-btns">
        <button className="btn btn-primary btn-sm" onClick={install}>Installieren</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setHidden(true)}>Später</button>
      </div>
    </div>
  );
}

function EraBlock({ era, s, next, onLesson, curRef }) {
  const total = era.lessons.length;
  const done = era.lessons.filter((l) => s.lessons[l.id]?.done).length;
  return (
    <section className={"era" + (era.available ? "" : " is-soon")} style={{ "--e1": era.c1, "--e2": era.c2 }}>
      <div className="era-cover">
        <div className="era-text">
          <span className="era-num">Era {era.era}</span>
          <h2 className="era-name">{era.name}</h2>
          <p className="era-topic">{era.topic}</p>
        </div>
        <span className="era-sticker" aria-hidden="true">{era.icon}</span>
        {era.available ? (
          <div className="era-prog" aria-label={`${done} von ${total} Lektionen`}>
            <div className="era-prog-bar"><div style={{ width: `${(100 * done) / total}%` }} /></div>
            <span>{done}/{total}</span>
          </div>
        ) : (
          <span className="soon-pill">Bald verfügbar</span>
        )}
      </div>
      {era.available && done === 0 && <p className="era-teaser">{era.teaser}</p>}
      {era.available && (
        <div className="path">
          {era.lessons.map((l, i) => {
            const st = s.lessons[l.id];
            const unlocked = isUnlocked(s, l.id);
            const isCur = next && next.id === l.id;
            let cls = "node";
            if (st?.done) cls += " is-done";
            if (isCur) cls += " is-current";
            if (!unlocked) cls += " is-locked";
            if (l.boss) cls += " is-boss";
            return (
              <div className="node-wrap" key={l.id} style={{ "--x": `${OFFSETS[i % OFFSETS.length]}px` }} ref={isCur ? curRef : null}>
                {isCur && <span className="node-flag">{st?.done ? "Weiter" : "Start"}</span>}
                <button
                  className={cls}
                  onClick={() => (unlocked ? onLesson(l.id) : toast("Schließ zuerst die Lektion davor ab.", "🔒"))}
                  aria-label={`${l.title}${st?.done ? ", erledigt" : ""}${!unlocked ? ", gesperrt" : ""}`}
                >
                  {!unlocked ? <IconLock size={26} /> : st?.done ? (st.perfect ? <IconStar size={30} /> : <IconCheck size={30} />) : l.boss ? <IconCrown size={30} /> : <IconPlay size={30} />}
                </button>
                <span className="node-label">{l.title}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function Home({ onLesson, onAlbum }) {
  const s = useStore();
  const sv = streakView(s);
  const xt = xpToday(s);
  const next = nextLesson(s);
  const rp = rewardProgress(s);
  const curRef = useRef(null);
  const goalPct = Math.min(100, (100 * xt) / s.dailyGoal);

  useEffect(() => {
    const t = setTimeout(() => curRef.current && curRef.current.scrollIntoView({ block: "center", behavior: "smooth" }), 250);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="home">
      <TopBar s={s} onAlbum={onAlbum} />
      <section className="hello">
        <Baemi size={86} mood={xt >= s.dailyGoal ? "cheer" : "happy"} />
        <div className="bubble">
          <p>{message(s, sv, xt, next)}</p>
          <div className="goal" aria-label={`Tagesziel: ${Math.min(xt, s.dailyGoal)} von ${s.dailyGoal} XP`}>
            <div className="goal-bar"><div style={{ width: goalPct + "%" }} /></div>
            <span>{Math.min(xt, s.dailyGoal)}/{s.dailyGoal} XP</span>
          </div>
        </div>
      </section>
      {rp && <RewardCard rp={rp} />}
      <InstallBanner s={s} />
      {ERAS.map((era) => (
        <EraBlock key={era.era} era={era} s={s} next={next} onLesson={onLesson} curRef={curRef} />
      ))}
      <p className="home-end">Neue Eras kommen nach und nach dazu. Lektionen wiederholen bringt jederzeit XP.</p>
    </div>
  );
}

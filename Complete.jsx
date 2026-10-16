import { useEffect, useState } from "react";
import { useStore } from "../lib/store.js";
import { BADGES } from "../lib/rewards.js";
import { burst } from "../lib/fx.js";
import { useBackLayer } from "../lib/back.js";
import Baemi from "../components/Baemi.jsx";
import { Footer } from "./Lesson.jsx";

function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function Row({ icon, title, text, className = "" }) {
  return (
    <div className={"done-row " + className}>
      <span className="done-icon" aria-hidden="true">{icon}</span>
      <div>
        <b>{title}</b>
        {text && <p>{text}</p>}
      </div>
    </div>
  );
}

export default function Complete({ summary: sm, onClose, onAlbum }) {
  const s = useStore();
  const [xp, setXp] = useState(0);
  useBackLayer(true, () => {
    onClose();
    return false;
  });
  useEffect(() => {
    burst(sm.perfect || sm.eraDone ? 1.4 : 1);
    const start = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / 800);
      setXp(Math.round(sm.gained * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [sm]);

  const goalPct = Math.min(100, Math.round((100 * sm.xpToday) / sm.dailyGoal));
  const title = sm.eraDone ? `Era ${sm.eraDone.era} geschafft!` : sm.perfect ? "Fehlerfrei!" : "Lektion geschafft!";
  const hasAlbum = sm.albumsGained > 0 && s.albums > 0;

  return (
    <div className="overlay complete">
      <div className="complete-scroll">
        <div className="complete-hero">
          <Baemi size={150} mood="cheer" acc={sm.eraDone ? "👑" : sm.perfect ? "💎" : "✨"} />
          <h1>{title}</h1>
          <p>{sm.title}</p>
        </div>
        <div className="stat-row">
          <div className="stat stat-xp"><b>+{xp}</b><span>XP</span></div>
          <div className="stat"><b>{sm.accuracy}%</b><span>Treffer</span></div>
          <div className="stat"><b>{fmtTime(sm.seconds)}</b><span>Zeit</span></div>
        </div>
        {sm.bonus > 0 && <p className="bonus-note">inklusive +{sm.bonus} XP Bonus, weil du keinen Fehler gemacht hast</p>}
        {!sm.first && <p className="bonus-note">Wiederholung – hält dein Wissen frisch.</p>}

        <div className="done-list">
          {sm.streakUp && (
            <Row
              icon="🔥"
              className="row-streak"
              title={`${sm.streak} ${sm.streak === 1 ? "Tag" : "Tage"} Streak`}
              text={
                sm.usedFreeze
                  ? `${sm.usedFreeze === 1 ? "Ein Hiatus-Pass hat" : `${sm.usedFreeze} Hiatus-Pässe haben`} deinen Streak gerettet.`
                  : sm.streak === 1
                    ? "Komm morgen wieder, dann wächst er."
                    : "Jeden Tag eine Lektion – und er wächst weiter."
              }
            />
          )}
          <div className="done-row">
            <span className="done-icon" aria-hidden="true">🎯</span>
            <div className="grow">
              <b>{sm.goalNow ? "Tagesziel erreicht!" : sm.xpToday >= sm.dailyGoal ? "Tagesziel schon geschafft" : "Tagesziel"}</b>
              <div className="mini-bar"><div style={{ width: goalPct + "%" }} /></div>
              <p>{Math.min(sm.xpToday, sm.dailyGoal)} von {sm.dailyGoal} XP heute</p>
            </div>
          </div>
          {sm.levelUp && <Row icon="⭐" title={`Level-Up: ${sm.levelUp}`} text="Neuer Rang bei Byte Entertainment!" />}
          {sm.newBadges.map((id) => {
            const b = BADGES.find((x) => x.id === id);
            return b ? <Row key={id} icon={b.icon} title={`Erfolg: ${b.title}`} text={b.desc} /> : null;
          })}
          {sm.rewardReached && (
            <Row icon="🎁" className="row-reward" title="Belohnung freigeschaltet!" text={`${sm.rewardReached} – zeig das deinen Eltern.`} />
          )}
          {hasAlbum && (
            <Row
              icon="📀"
              className="row-album"
              title={sm.albumsGained === 1 ? "Du hast ein Album bekommen!" : `Du hast ${sm.albumsGained} Alben bekommen!`}
              text={sm.albumReasons.join(", ")}
            />
          )}
        </div>
      </div>
      <Footer>
        {hasAlbum ? (
          <>
            <button className="btn btn-holo" onClick={onAlbum}>Album öffnen</button>
            <button className="btn btn-ghost" onClick={onClose}>Später</button>
          </>
        ) : (
          <button className="btn btn-primary" onClick={onClose}>Weiter</button>
        )}
      </Footer>
    </div>
  );
}

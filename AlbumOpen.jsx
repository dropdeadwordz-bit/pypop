import { useState } from "react";
import { useStore, setState } from "../lib/store.js";
import { openAlbum, RARITY } from "../lib/rewards.js";
import { play, buzz, burst } from "../lib/fx.js";
import { useBackLayer } from "../lib/back.js";
import Baemi from "../components/Baemi.jsx";
import Photocard from "../components/Photocard.jsx";
import { IconClose } from "../components/Icons.jsx";
import { Footer } from "./Lesson.jsx";

export default function AlbumOpen({ onClose, onCollection }) {
  const s = useStore();
  const [phase, setPhase] = useState("closed"); // closed | opening | revealed
  const [got, setGot] = useState(null);
  useBackLayer(true, () => {
    onClose();
    return false;
  });

  const open = () => {
    if (phase !== "closed" || s.albums <= 0) return;
    let r = null;
    setState((st) => {
      r = openAlbum(st);
      return r.next;
    });
    setGot(r);
    setPhase("opening");
    play("tap");
    buzz(20);
    setTimeout(() => {
      setPhase("revealed");
      play("sparkle");
      buzz([20, 40, 70]);
      if (r.card && r.card.rarity !== "C") burst(r.card.rarity === "L" ? 1.6 : 1);
    }, 1000);
  };

  if (phase === "closed" && s.albums <= 0) {
    return (
      <div className="overlay album-screen">
        <button className="icon-btn album-close" onClick={onClose} aria-label="Schließen"><IconClose /></button>
        <div className="album-empty">
          <Baemi size={120} mood="think" />
          <h2>Gerade keine Alben</h2>
          <p>Alben bekommst du für deine erste Lektion, für Level-Ups, Streaks und jede abgeschlossene Era.</p>
        </div>
        <Footer><button className="btn btn-primary" onClick={onClose}>Weiterlernen</button></Footer>
      </div>
    );
  }

  return (
    <div className="overlay album-screen">
      <button className="icon-btn album-close" onClick={onClose} aria-label="Schließen"><IconClose /></button>
      <div className="album-stage">
        {phase !== "revealed" ? (
          <button className={"album-box" + (phase === "opening" ? " is-opening" : "")} onClick={open} aria-label="Album öffnen">
            <span className="album-cover">
              <span className="album-grp">{s.gruppe}</span>
              <Baemi size={118} acc="💿" />
              <span className="album-ttl">1st Mini Album</span>
            </span>
          </button>
        ) : got && got.card ? (
          <div className="reveal">
            <div className="reveal-card"><Photocard card={got.card} gruppe={s.gruppe} big /></div>
            <h2>{got.card.title}</h2>
            <p className={"rar rar-" + got.card.rarity}>{RARITY[got.card.rarity]} – neu in deinem Binder</p>
          </div>
        ) : (
          <div className="reveal">
            <div className="bonus-big">+{got ? got.bonusXp : 20} XP</div>
            <p>Du hast schon alle Fotokarten. Dafür gibt es Bonus-XP!</p>
          </div>
        )}
        <p className="album-hint">
          {phase === "closed" && `Tippe auf das Album. ${s.albums === 1 ? "1 Album wartet" : `${s.albums} Alben warten`} auf dich.`}
          {phase === "opening" && "Wird ausgepackt …"}
        </p>
      </div>
      {phase === "revealed" && (
        <Footer>
          {s.albums > 0 ? (
            <button className="btn btn-holo" onClick={() => { setPhase("closed"); setGot(null); }}>
              Nächstes Album öffnen ({s.albums})
            </button>
          ) : (
            <button className="btn btn-primary" onClick={onCollection}>Zum Binder</button>
          )}
          <button className="btn btn-ghost" onClick={onClose}>Fertig</button>
        </Footer>
      )}
    </div>
  );
}

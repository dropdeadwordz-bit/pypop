import { useEffect, useRef, useState } from "react";
import { useStore } from "../lib/store.js";
import { CARDS, BADGES } from "../lib/rewards.js";
import { useBackLayer } from "../lib/back.js";
import Photocard from "../components/Photocard.jsx";

function CardDetail({ card, gruppe, onClose }) {
  const ref = useRef(null);
  useBackLayer(!!card, () => {
    onClose();
    return false;
  });
  useEffect(() => {
    if (!card || !ref.current) return undefined;
    const el = ref.current;
    const set = (x, y) => {
      el.style.setProperty("--ry", `${(x * 14).toFixed(2)}deg`);
      el.style.setProperty("--rx", `${(-y * 14).toFixed(2)}deg`);
      el.style.setProperty("--mx", `${(50 + x * 50).toFixed(1)}%`);
      el.style.setProperty("--my", `${(50 + y * 50).toFixed(1)}%`);
    };
    const clamp = (v) => Math.max(-1, Math.min(1, v));
    const onOri = (e) => {
      if (e.gamma == null || e.beta == null) return;
      set(clamp(e.gamma / 25), clamp((e.beta - 40) / 25));
    };
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      set(clamp(((e.clientX - r.left) / r.width) * 2 - 1), clamp(((e.clientY - r.top) / r.height) * 2 - 1));
    };
    window.addEventListener("deviceorientation", onOri);
    el.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("deviceorientation", onOri);
      el.removeEventListener("pointermove", onMove);
    };
  }, [card]);
  if (!card) return null;
  return (
    <div className="cd-wrap" role="dialog" aria-modal="true" aria-label={card.title} onClick={onClose}>
      <div className="cd" ref={ref} onClick={(e) => e.stopPropagation()}>
        <Photocard card={card} gruppe={gruppe} big />
      </div>
      <p className="cd-hint">Kipp dein Handy – die Holo-Karten glitzern. Tippe daneben zum Schließen.</p>
    </div>
  );
}

export default function Collection({ onAlbum }) {
  const s = useStore();
  const [tab, setTab] = useState("cards");
  const [detail, setDetail] = useState(null);
  const owned = new Set(s.cards);
  const earned = BADGES.filter((b) => s.badges[b.id]).length;
  return (
    <div className="page">
      <h1 className="page-title">Sammlung</h1>
      <div className="seg" role="tablist">
        <button role="tab" aria-selected={tab === "cards"} className={tab === "cards" ? "on" : ""} onClick={() => setTab("cards")}>
          Fotokarten
        </button>
        <button role="tab" aria-selected={tab === "badges"} className={tab === "badges" ? "on" : ""} onClick={() => setTab("badges")}>
          Erfolge
        </button>
      </div>

      {tab === "cards" ? (
        <>
          <div className="binder-head">
            <span>{s.cards.length} von {CARDS.length} Karten</span>
            {s.albums > 0 && (
              <button className="btn btn-holo btn-sm" onClick={onAlbum}>
                {s.albums === 1 ? "1 Album öffnen" : `${s.albums} Alben öffnen`}
              </button>
            )}
          </div>
          <div className="binder">
            {CARDS.map((c) =>
              owned.has(c.id) ? (
                <button key={c.id} className="pc-btn" onClick={() => setDetail(c)} aria-label={`Karte ${c.title} ansehen`}>
                  <Photocard card={c} gruppe={s.gruppe} />
                </button>
              ) : (
                <Photocard key={c.id} card={null} />
              )
            )}
          </div>
          <p className="muted small">Alben gibt es für deine erste Lektion, Level-Ups, Streaks und jede abgeschlossene Era. In jedem Album steckt eine Karte, die dir noch fehlt.</p>
        </>
      ) : (
        <>
          <p className="binder-head"><span>{earned} von {BADGES.length} freigeschaltet</span></p>
          <div className="badges">
            {BADGES.map((b) => (
              <div key={b.id} className={"badge" + (s.badges[b.id] ? " is-on" : "")}>
                <span className="badge-icon" aria-hidden="true">{b.icon}</span>
                <b>{b.title}</b>
                <small>{b.desc}</small>
              </div>
            ))}
          </div>
        </>
      )}
      <CardDetail card={detail} gruppe={s.gruppe} onClose={() => setDetail(null)} />
    </div>
  );
}

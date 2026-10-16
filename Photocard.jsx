import Baemi from "./Baemi.jsx";
import { RARITY } from "../lib/rewards.js";

export default function Photocard({ card, gruppe, big = false, style }) {
  if (!card) {
    return (
      <div className="pc pc-empty" aria-label="Noch nicht gesammelt">
        <span>?</span>
      </div>
    );
  }
  return (
    <div className={`pc pc-${card.rarity}${big ? " pc-big" : ""}`} style={{ "--c1": card.c1, "--c2": card.c2, ...style }}>
      <div className="pc-art">
        <Baemi size={big ? 220 : 96} body={card.body} acc={card.acc} mood={card.rarity === "L" ? "cheer" : "happy"} />
      </div>
      <div className="pc-foot">
        <span className="pc-title">{card.title}</span>
        <span className="pc-meta">{gruppe}</span>
      </div>
      {card.rarity !== "C" && <div className="pc-holo" aria-hidden="true" />}
      {big && <span className="pc-rarity">{RARITY[card.rarity]}</span>}
    </div>
  );
}

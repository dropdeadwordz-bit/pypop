import { useState } from "react";
import { setState, ACCENTS } from "../lib/store.js";
import { GOALS } from "../lib/rewards.js";
import { play } from "../lib/fx.js";
import Baemi from "../components/Baemi.jsx";
import { Footer } from "./Lesson.jsx";

export const cleanGroup = (v) => v.toUpperCase().replace(/[^A-Z0-9ÄÖÜ ]/g, "").replace(/\s+/g, " ").slice(0, 12);

export function Swatches({ value, onChange }) {
  return (
    <div className="swatches" role="radiogroup" aria-label="Lightstick-Farbe">
      {Object.entries(ACCENTS).map(([k, a]) => (
        <button
          key={k}
          role="radio"
          aria-checked={value === k}
          aria-label={a.name}
          className={"swatch" + (value === k ? " on" : "")}
          style={{ "--sw": a.main, "--sw-glow": a.glow }}
          onClick={() => onChange(k)}
        >
          <span className="swatch-orb" />
        </button>
      ))}
    </div>
  );
}

export default function Onboarding({ name, onAccent, onDone }) {
  const [step, setStep] = useState(0);
  const [gruppe, setGruppe] = useState("STARBYTE");
  const [accent, setAccent] = useState("pink");
  const [goal, setGoal] = useState(20);

  const pickAccent = (k) => {
    setAccent(k);
    onAccent(k);
    play("tap");
  };
  const finish = () => {
    setState((s) => ({ ...s, onboarded: true, gruppe: cleanGroup(gruppe).trim() || "STARBYTE", accent, dailyGoal: goal }));
    play("done");
    if (onDone) onDone();
  };

  return (
    <div className="onboarding">
      <div className="ob-dots" aria-hidden="true">
        {[0, 1, 2].map((i) => <span key={i} className={i === step ? "on" : ""} />)}
      </div>
      {step === 0 && (
        <div className="ob-step">
          <Baemi size={170} mood="cheer" acc="🎤" />
          <h1 className="ob-title">Annyeong, {name}!</h1>
          <p>Ich bin Baemi, die Code-Schlange. Mit mir lernst du <strong>Python</strong> – die Sprache, mit der Profis Apps, Spiele und KI bauen.</p>
          <p>Jeden Tag ein paar Minuten. Keine Vorkenntnisse nötig.</p>
        </div>
      )}
      {step === 1 && (
        <div className="ob-step">
          <h1 className="ob-title">Gründe deine Gruppe</h1>
          <p>Du bist ab heute Producerin bei Byte Entertainment. Wie soll deine K-Pop-Gruppe heißen?</p>
          <label className="field">
            <span>Gruppenname</span>
            <input value={gruppe} onChange={(e) => setGruppe(cleanGroup(e.target.value))} maxLength={12} autoCapitalize="characters" autoComplete="off" />
          </label>
          <p className="field-label">Deine Lightstick-Farbe</p>
          <Swatches value={accent} onChange={pickAccent} />
        </div>
      )}
      {step === 2 && (
        <div className="ob-step">
          <h1 className="ob-title">Wie viel pro Tag?</h1>
          <p>Eine Lektion dauert etwa 3 bis 5 Minuten. Du kannst das später jederzeit ändern.</p>
          <div className="goal-pick" role="radiogroup">
            {GOALS.map((g) => (
              <button key={g.xp} role="radio" aria-checked={goal === g.xp} className={"option goal-opt" + (goal === g.xp ? " is-sel" : "")} onClick={() => { setGoal(g.xp); play("tap"); }}>
                <b>{g.name}</b>
                <span>{g.desc}</span>
                <span className="goal-xp">{g.xp} XP</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <Footer>
        {step < 2 ? (
          <button className="btn btn-primary" onClick={() => { setStep(step + 1); play("tap"); }} disabled={step === 1 && !gruppe.trim()}>
            {step === 0 ? "Los geht's" : "Weiter"}
          </button>
        ) : (
          <button className="btn btn-primary" onClick={finish}>Erste Lektion starten</button>
        )}
      </Footer>
    </div>
  );
}

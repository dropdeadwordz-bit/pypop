import { useState } from "react";
import { useStore, setState, ACCENTS, exportCode, importCode, resetAll, today, dayDiff } from "../lib/store.js";
import { levelFor, streakView, weekStats, GOALS, rewardProgress, REWARD_TYPES } from "../lib/rewards.js";
import { useInstall } from "../lib/install.js";
import { toast } from "../lib/toast.js";
import Baemi from "../components/Baemi.jsx";
import Sheet from "../components/Sheet.jsx";
import { Swatches, cleanGroup } from "./Onboarding.jsx";

const WD = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
export const fmtMinutes = (sec) => {
  const m = Math.round(sec / 60);
  return m < 60 ? `${m} Min` : `${Math.floor(m / 60)} Std ${m % 60} Min`;
};

function WeekChart({ wk, goal }) {
  const max = Math.max(goal, ...wk.days.map((d) => d.xp), 1);
  return (
    <div className="week" aria-label="XP der letzten 7 Tage">
      {wk.days.map((d, i) => {
        const [y, m, dd] = d.date.split("-").map(Number);
        const wd = WD[new Date(y, m - 1, dd).getDay()];
        return (
          <div className="week-col" key={d.date}>
            <div className="week-bar-wrap">
              <div className="week-goal" style={{ bottom: `${(goal / max) * 100}%` }} aria-hidden="true" />
              <div className={"week-bar" + (d.xp >= goal ? " hit" : "") + (i === 6 ? " now" : "")} style={{ height: `${(d.xp / max) * 100}%` }} title={`${d.xp} XP`} />
            </div>
            <span className="week-xp">{d.xp || ""}</span>
            <span className="week-day">{i === 6 ? "Heute" : wd}</span>
          </div>
        );
      })}
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <button className="set-row" role="switch" aria-checked={value} onClick={() => onChange(!value)}>
      <span>{label}</span>
      <span className={"toggle" + (value ? " on" : "")}><span /></span>
    </button>
  );
}

function EditSheet({ field, s, onClose }) {
  const [v, setV] = useState(field === "gruppe" ? s.gruppe : s.name);
  const save = () => {
    if (field === "gruppe") setState((st) => ({ ...st, gruppe: cleanGroup(v).trim() || "STARBYTE" }));
    else setState((st) => ({ ...st, name: v.replace(/[^\p{L} -]/gu, "").trim().slice(0, 20) || "Yara" }));
    onClose();
  };
  return (
    <Sheet open={!!field} onClose={onClose} title={field === "gruppe" ? "Gruppenname" : "Dein Name"}>
      <label className="field">
        <span>{field === "gruppe" ? "Bis zu 12 Zeichen, Großbuchstaben und Ziffern" : "So spricht Baemi dich an"}</span>
        <input value={v} onChange={(e) => setV(field === "gruppe" ? cleanGroup(e.target.value) : e.target.value)} maxLength={field === "gruppe" ? 12 : 20} autoComplete="off" />
      </label>
      <button className="btn btn-primary" onClick={save}>Speichern</button>
    </Sheet>
  );
}

function BackupSheet({ open, onClose }) {
  const [code] = useState(() => (open ? exportCode() : ""));
  const [paste, setPaste] = useState("");
  const [err, setErr] = useState("");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast("Backup-Code kopiert", "📋");
    } catch {
      toast("Kopieren ging nicht – markiere den Code von Hand.", "⚠️");
    }
  };
  const share = async () => {
    try { await navigator.share({ title: "PyPop Backup", text: code }); } catch { /* abgebrochen */ }
  };
  const restore = () => {
    setErr("");
    if (!window.confirm("Den Fortschritt auf diesem Gerät durch das Backup ersetzen?")) return;
    try {
      importCode(paste);
      toast("Backup eingespielt", "✅");
      onClose();
    } catch (e) {
      setErr(e.message);
    }
  };
  return (
    <Sheet open={open} onClose={onClose} title="Backup-Code">
      <p>Speichere diesen Code zum Beispiel in einer Notiz oder schick ihn an dich selbst. Damit holst du deinen Fortschritt auf jedes Gerät zurück.</p>
      <textarea className="backup-code" readOnly value={code} rows={4} onFocus={(e) => e.target.select()} />
      <div className="row-btns">
        <button className="btn btn-secondary btn-sm" onClick={copy}>Kopieren</button>
        {navigator.share && <button className="btn btn-secondary btn-sm" onClick={share}>Teilen</button>}
      </div>
      <h3>Backup einspielen</h3>
      <textarea className="backup-code" value={paste} onChange={(e) => setPaste(e.target.value)} rows={3} placeholder="PYPOP1:…" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
      {err && <p className="form-err">{err}</p>}
      <button className="btn btn-primary" disabled={!paste.trim()} onClick={restore}>Einspielen</button>
    </Sheet>
  );
}

function ParentSheet({ open, onClose }) {
  const s = useStore();
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [err, setErr] = useState("");
  const [text, setText] = useState("");
  const [type, setType] = useState("streak");
  const [target, setTarget] = useState(14);
  const rp = rewardProgress(s);
  const sv = streakView(s);
  const close = () => {
    setUnlocked(false);
    setPin("");
    setPin2("");
    setErr("");
    onClose();
  };
  const digits = (v) => v.replace(/\D/g, "").slice(0, 4);

  let body;
  if (!s.parentPin) {
    body = (
      <>
        <p>Lege eine 4-stellige PIN fest. Dann können nur Erwachsene Belohnungen und Einstellungen hier ändern.</p>
        <label className="field"><span>Neue PIN</span><input inputMode="numeric" type="password" value={pin} onChange={(e) => setPin(digits(e.target.value))} /></label>
        <label className="field"><span>PIN wiederholen</span><input inputMode="numeric" type="password" value={pin2} onChange={(e) => setPin2(digits(e.target.value))} /></label>
        {err && <p className="form-err">{err}</p>}
        <button
          className="btn btn-primary"
          disabled={pin.length !== 4}
          onClick={() => {
            if (pin !== pin2) return setErr("Die PINs stimmen nicht überein.");
            setState((st) => ({ ...st, parentPin: pin }));
            setUnlocked(true);
            setErr("");
          }}
        >
          PIN speichern
        </button>
      </>
    );
  } else if (!unlocked) {
    body = (
      <>
        <p>Bitte PIN eingeben.</p>
        <label className="field"><span>PIN</span><input inputMode="numeric" type="password" value={pin} onChange={(e) => setPin(digits(e.target.value))} autoFocus /></label>
        {err && <p className="form-err">{err}</p>}
        <button className="btn btn-primary" disabled={pin.length !== 4} onClick={() => (pin === s.parentPin ? (setUnlocked(true), setErr("")) : setErr("Falsche PIN."))}>
          Öffnen
        </button>
      </>
    );
  } else {
    const lastDays = s.lastActive ? dayDiff(s.lastActive, today()) : null;
    body = (
      <>
        <div className="parent-stats">
          <div><b>{s.stats.lessons}</b><span>Lektionen</span></div>
          <div><b>{sv.current}</b><span>Tage Streak</span></div>
          <div><b>{fmtMinutes(s.stats.seconds)}</b><span>Lernzeit</span></div>
          <div><b>{lastDays === null ? "–" : lastDays === 0 ? "heute" : lastDays === 1 ? "gestern" : `vor ${lastDays} T.`}</b><span>zuletzt aktiv</span></div>
        </div>

        <h3>Belohnung</h3>
        {rp ? (
          <div className={"reward-card" + (rp.done ? " is-done" : "")}>
            <span className="rw-icon" aria-hidden="true">🎁</span>
            <div className="grow">
              <b>{rp.text}</b>
              <small>{rp.done ? `Erreicht am ${rp.achieved.split("-").reverse().join(".")}` : `${rp.cur} von ${rp.target} ${REWARD_TYPES[rp.type].unit}`}</small>
              <div className="row-btns">
                <button className="btn btn-secondary btn-sm" onClick={() => setState((st) => ({ ...st, reward: null }))}>
                  {rp.done ? "Eingelöst – neue festlegen" : "Belohnung entfernen"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <p className="muted small">Legen Sie eine echte Belohnung fest. {s.name} sieht den Fortschritt auf der Startseite.</p>
            <label className="field"><span>Belohnung</span><input value={text} onChange={(e) => setText(e.target.value.slice(0, 60))} placeholder="z. B. Kinoabend mit Popcorn" /></label>
            <label className="field">
              <span>Ziel</span>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                {Object.entries(REWARD_TYPES).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}
              </select>
            </label>
            <label className="field"><span>Wert ({REWARD_TYPES[type].unit})</span><input inputMode="numeric" value={target} onChange={(e) => setTarget(Number(e.target.value.replace(/\D/g, "").slice(0, 4)) || "")} /></label>
            <button
              className="btn btn-primary"
              disabled={!text.trim() || !target}
              onClick={() => {
                setState((st) => ({
                  ...st,
                  reward: { text: text.trim(), type, target: Number(target), baseline: type === "lessons" ? st.stats.lessons : type === "xp" ? st.xp : 0, set: today(), achieved: null },
                }));
                toast("Belohnung gespeichert", "🎁");
              }}
            >
              Belohnung speichern
            </button>
          </>
        )}

        <h3>Weitere Einstellungen</h3>
        <Toggle label="Testmodus: alle Lektionen freischalten" value={s.unlockAll} onChange={(v) => setState((st) => ({ ...st, unlockAll: v }))} />
        <button
          className="btn btn-ghost btn-danger"
          onClick={() => {
            if (window.confirm("Wirklich den gesamten Fortschritt löschen? Das lässt sich nicht rückgängig machen.")) {
              resetAll();
              close();
            }
          }}
        >
          Fortschritt zurücksetzen
        </button>
      </>
    );
  }
  return <Sheet open={open} onClose={close} title="Eltern-Bereich">{body}</Sheet>;
}

export default function Profile() {
  const s = useStore();
  const lv = levelFor(s.xp);
  const sv = streakView(s);
  const wk = weekStats(s);
  const install = useInstall();
  const [edit, setEdit] = useState(null);
  const [backup, setBackup] = useState(false);
  const [parent, setParent] = useState(false);
  const diff = wk.total - wk.prev;
  const set = (patch) => setState((st) => ({ ...st, ...patch }));

  return (
    <div className="page profile">
      <section className="prof-head">
        <Baemi size={96} body={ACCENTS[s.accent].glow} acc="🎧" />
        <div>
          <h1>{s.name}</h1>
          <p>Producerin von {s.gruppe}</p>
        </div>
      </section>

      <section className="level-card">
        <div className="lv-top">
          <b>Lv {lv.num} {lv.name}</b>
          <span>{s.xp} XP</span>
        </div>
        <div className="bar"><div style={{ width: lv.progress * 100 + "%" }} /></div>
        <small>{lv.next ? `Noch ${lv.toNext} XP bis ${lv.next.name}` : "Höchstes Level erreicht. Legendär!"}</small>
      </section>

      <div className="stats-grid">
        <div><b>{sv.current}</b><span>Tage Streak</span></div>
        <div><b>{s.bestStreak}</b><span>Rekord</span></div>
        <div><b>{s.stats.lessons}</b><span>Lektionen</span></div>
        <div><b>{s.stats.perfect}</b><span>fehlerfrei</span></div>
        <div><b>{fmtMinutes(s.stats.seconds)}</b><span>Lernzeit</span></div>
        <div><b>{s.freezes}</b><span>Hiatus-Pässe</span></div>
      </div>
      <p className="muted small">Ein Hiatus-Pass rettet deinen Streak, wenn du einen Tag verpasst. Alle 7 Streak-Tage gibt es einen neuen, höchstens 3.</p>

      <section className="card">
        <h2>Letzte 7 Tage</h2>
        <WeekChart wk={wk} goal={s.dailyGoal} />
        <p className="week-sum">
          {wk.total} XP diese Woche.{" "}
          {wk.prev === 0 ? "" : diff > 0 ? `${diff} mehr als in der Woche davor!` : diff < 0 ? `${-diff} weniger als in der Woche davor.` : "Genauso viel wie in der Woche davor."}
        </p>
      </section>

      <section className="card settings">
        <h2>Einstellungen</h2>
        <p className="field-label">Tagesziel</p>
        <div className="seg seg-3" role="radiogroup">
          {GOALS.map((g) => (
            <button key={g.xp} role="radio" aria-checked={s.dailyGoal === g.xp} className={s.dailyGoal === g.xp ? "on" : ""} onClick={() => set({ dailyGoal: g.xp })}>
              {g.name}
              <small>{g.xp} XP</small>
            </button>
          ))}
        </div>
        <p className="field-label">Lightstick-Farbe</p>
        <Swatches value={s.accent} onChange={(k) => set({ accent: k })} />
        <button className="set-row" onClick={() => setEdit("gruppe")}><span>Gruppenname</span><span className="set-val">{s.gruppe}</span></button>
        <button className="set-row" onClick={() => setEdit("name")}><span>Dein Name</span><span className="set-val">{s.name}</span></button>
        <Toggle label="Sounds" value={s.sound} onChange={(v) => set({ sound: v })} />
        <Toggle label="Vibration" value={s.haptics} onChange={(v) => set({ haptics: v })} />
      </section>

      {install && <button className="btn btn-primary" onClick={install}>📲 PyPop als App installieren</button>}

      <section className="card">
        <h2>Backup</h2>
        <p>Dein Fortschritt ist nur auf diesem Handy gespeichert. Mit einem Backup-Code sicherst du ihn oder nimmst ihn auf ein neues Gerät mit.</p>
        <button className="btn btn-secondary" onClick={() => setBackup(true)}>Backup-Code öffnen</button>
      </section>

      <button className="btn btn-ghost" onClick={() => setParent(true)}>👪 Eltern-Bereich</button>
      <p className="credits">PyPop – Python läuft dank Pyodide direkt in deinem Browser. Deine Daten bleiben auf deinem Gerät.</p>

      {edit && <EditSheet field={edit} s={s} onClose={() => setEdit(null)} />}
      {backup && <BackupSheet open={backup} onClose={() => setBackup(false)} />}
      <ParentSheet open={parent} onClose={() => setParent(false)} />
    </div>
  );
}

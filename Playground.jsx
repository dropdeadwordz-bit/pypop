import { useEffect, useRef, useState } from "react";
import { useStore, setState } from "../lib/store.js";
import { makeTpl } from "../lib/content.js";
import { runPython, preloadPython } from "../lib/python.js";
import Editor from "../components/Editor.jsx";
import Output, { PyStatus } from "../components/Output.jsx";
import { IconPlay } from "../components/Icons.jsx";
import { markRun } from "./Lesson.jsx";

const EXAMPLES = [
  { name: "Fan-Gruß", code: 'gruppe = "@@GRUPPE@@"\nprint("Annyeong!")\nprint("Wir sind", gruppe)' },
  { name: "Ticket-Rechner", code: 'preis = 89\ntickets = 3\nprint("Gesamt:", preis * tickets, "Euro")' },
  { name: "Fan-Quiz", code: 'name = input("Wie heißt du? ")\ngruppe = input("Lieblingsgruppe? ")\nprint(name, "ist ein Fan von", gruppe + "!")', inputs: "Yara\nTWICE" },
  { name: "Countdown", code: 'for zahl in range(5, 0, -1):\n    print(zahl)\nprint("Comeback!")' },
  { name: "Lightstick-Show", code: 'farben = ["💗", "💜", "💙", "💚", "💛"]\nfor runde in range(4):\n    print(" ".join(farben))\n    farben = farben[1:] + farben[:1]' },
];

export default function Playground() {
  const s = useStore();
  const tpl = makeTpl(s);
  const [code, setCode] = useState(() => s.playground || tpl(EXAMPLES[0].code));
  const [inputs, setInputs] = useState("");
  const [res, setRes] = useState(null);
  const [running, setRunning] = useState(false);
  const [pyErr, setPyErr] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    preloadPython().catch(() => setPyErr(true));
  }, []);
  useEffect(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setState((st) => ({ ...st, playground: code })), 600);
    return () => clearTimeout(saveTimer.current);
  }, [code]);

  const needsInput = /\binput\s*\(/.test(code);
  const run = async () => {
    setRunning(true);
    setPyErr(false);
    try {
      const r = await runPython(code, needsInput ? inputs.split("\n") : []);
      setRes(r);
      if (!r.err) markRun("playground");
    } catch {
      setPyErr(true);
    }
    setRunning(false);
  };
  const load = (ex) => {
    setCode(tpl(ex.code));
    setInputs(ex.inputs || "");
    setRes(null);
  };

  return (
    <div className="page playground">
      <h1 className="page-title">Spielwiese</h1>
      <p className="lead">Hier kannst du alles ausprobieren. Kaputt machen kannst du nichts.</p>
      <div className="examples" aria-label="Beispiele laden">
        {EXAMPLES.map((ex) => (
          <button key={ex.name} className="chip-btn" onClick={() => load(ex)}>{ex.name}</button>
        ))}
      </div>
      <Editor value={code} onChange={setCode} minRows={8} />
      {needsInput && (
        <label className="inputs-box">
          <span>Antworten für input() – eine pro Zeile</span>
          <textarea value={inputs} onChange={(e) => setInputs(e.target.value)} rows={3} autoCapitalize="none" autoCorrect="off" spellCheck={false} />
        </label>
      )}
      <div className="row-btns">
        <button className="btn btn-run" onClick={run} disabled={running}><IconPlay size={18} /> Ausführen</button>
        <button className="btn btn-ghost btn-sm" onClick={() => { setCode(""); setRes(null); }}>Leeren</button>
      </div>
      <PyStatus />
      {pyErr && (
        <div className="errbox">
          <div className="errbox-title">Python konnte nicht starten</div>
          <p>Beim ersten Mal braucht PyPop Internet, um Python zu laden.</p>
          <button className="btn btn-secondary btn-sm" onClick={run}>Nochmal versuchen</button>
        </div>
      )}
      <Output res={res} running={running} />
    </div>
  );
}

import { explainError } from "../lib/check.js";
import { usePyStatus } from "../lib/python.js";

export function PyStatus() {
  const st = usePyStatus();
  if (st === "loading") {
    return (
      <div className="pystatus">
        <span className="spinner" aria-hidden="true" />
        Python startet … beim ersten Mal dauert das ein paar Sekunden.
      </div>
    );
  }
  return null;
}

export default function Output({ res, running }) {
  if (running) {
    return (
      <div className="output">
        <div className="output-head">Ausgabe</div>
        <div className="output-body muted"><span className="spinner" aria-hidden="true" /> läuft …</div>
      </div>
    );
  }
  if (!res) return null;
  const e = explainError(res.err);
  return (
    <div className="output" aria-live="polite">
      <div className="output-head">Ausgabe</div>
      {res.out ? <pre className="output-body">{res.out}</pre> : !e && <div className="output-body muted">(keine Ausgabe)</div>}
      {e && (
        <div className="errbox">
          <div className="errbox-title">🐞 {e.title}</div>
          <p>{e.text}</p>
          {e.raw && <code className="errbox-raw">{e.raw}</code>}
        </div>
      )}
      {res.missingInputs > 0 && (
        <p className="note">Dein Programm wollte {res.missingInputs} Eingabe(n) mehr, als du angegeben hast.</p>
      )}
    </div>
  );
}

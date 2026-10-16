import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useStore, setState } from "../lib/store.js";
import { makeTpl } from "../lib/content.js";
import { preloadPython, runPython } from "../lib/python.js";
import { checkCode } from "../lib/check.js";
import { completeLesson, awardBadge } from "../lib/rewards.js";
import { play, buzz } from "../lib/fx.js";
import { useBackLayer } from "../lib/back.js";
import { toast } from "../lib/toast.js";
import Baemi from "../components/Baemi.jsx";
import Md from "../components/Md.jsx";
import { CodeView, highlight } from "../components/Code.jsx";
import Editor from "../components/Editor.jsx";
import Output, { PyStatus } from "../components/Output.jsx";
import { IconClose, IconPlay, IconCheck } from "../components/Icons.jsx";

const PRAISE = ["Daebak! 🎉", "Jjang! ✨", "Richtig! 💖", "Das sitzt! 🔥", "Perfekt!", "Wie eine Profi-Producerin!"];
const OOPS = ["Fast!", "Noch nicht ganz", "Knapp daneben"];
const pick = (a) => a[Math.floor(Math.random() * a.length)];

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Zählt erfolgreiche Code-Ausführungen und vergibt die passenden Erfolge */
export function markRun(source) {
  setState((s) => {
    let n = { ...s, stats: { ...s.stats, runs: s.stats.runs + 1 } };
    const a = awardBadge(n, "first_run");
    n = a.next;
    if (a.added) setTimeout(() => toast("Erfolg: Erstes Programm", "▶️"), 0);
    if (source === "playground") {
      const b = awardBadge(n, "playground");
      n = b.next;
      if (b.added) setTimeout(() => toast("Erfolg: Experimentiererin", "🧪"), 0);
    }
    return n;
  });
}

export function Footer({ children }) {
  return (
    <div className="footer">
      <div className="footer-inner">{children}</div>
    </div>
  );
}

function StepHead({ q, again, kicker }) {
  return (
    <div className="step-head">
      {again && <span className="again">Nochmal probieren</span>}
      {kicker && !again && <span className="kicker">{kicker}</span>}
      <h1 className="step-q">{q}</h1>
    </div>
  );
}

function PyError({ onRetry, onSkip }) {
  return (
    <div className="errbox">
      <div className="errbox-title">Python konnte nicht starten</div>
      <p>Beim ersten Mal braucht PyPop Internet, um Python zu laden. Prüf die Verbindung und versuch es nochmal.</p>
      <div className="row-btns">
        <button className="btn btn-secondary btn-sm" onClick={onRetry}>Nochmal versuchen</button>
        {onSkip && <button className="btn btn-ghost btn-sm" onClick={onSkip}>Überspringen</button>}
      </div>
    </div>
  );
}

/* ---------------- Aufgabentypen ---------------- */

function InfoStep({ step, tpl, onNext }) {
  const [res, setRes] = useState(null);
  const [running, setRunning] = useState(false);
  const [pyErr, setPyErr] = useState(false);
  const run = async () => {
    setRunning(true);
    setPyErr(false);
    try {
      const r = await runPython(tpl(step.code), step.inputs || []);
      setRes(r);
      if (!r.err) markRun("lesson");
      play(r.err ? "bad" : "tap");
    } catch {
      setPyErr(true);
    }
    setRunning(false);
  };
  return (
    <>
      <div className="info-head">
        <Baemi size={68} />
        <h1 className="step-title">{tpl(step.title)}</h1>
      </div>
      <Md text={tpl(step.text)} />
      {step.code && <CodeView code={tpl(step.code)} />}
      {step.run && (
        <div className="run-row">
          <button className="btn btn-run" onClick={run} disabled={running}>
            <IconPlay size={18} /> Ausführen
          </button>
          <PyStatus />
        </div>
      )}
      {pyErr && <PyError onRetry={run} />}
      <Output res={res} running={running} />
      <Footer>
        <button className="btn btn-primary" onClick={onNext}>Weiter</button>
      </Footer>
    </>
  );
}

function ChoiceStep({ step, tpl, onResult, again }) {
  const order = useMemo(() => shuffle(step.options.map((_, i) => i)), [step]);
  const [sel, setSel] = useState(null);
  const [checked, setChecked] = useState(false);
  const check = () => {
    setChecked(true);
    onResult(sel === step.answer, { answer: tpl(step.options[step.answer]), mono: step.mono });
  };
  return (
    <>
      <StepHead q={tpl(step.q)} again={again} />
      {step.code && <CodeView code={tpl(step.code)} />}
      <div className="options" role="radiogroup">
        {order.map((i) => {
          let cls = "option";
          if (sel === i) cls += " is-sel";
          if (checked && i === step.answer) cls += " is-right";
          if (checked && sel === i && i !== step.answer) cls += " is-wrong";
          return (
            <button
              key={i}
              role="radio"
              aria-checked={sel === i}
              className={cls}
              disabled={checked}
              onClick={() => {
                setSel(i);
                play("tap");
              }}
            >
              {step.mono ? <pre className="opt-code">{tpl(step.options[i])}</pre> : tpl(step.options[i])}
            </button>
          );
        })}
      </div>
      <Footer>
        <button className="btn btn-primary" disabled={sel === null || checked} onClick={check}>Prüfen</button>
      </Footer>
    </>
  );
}

function FillStep({ step, tpl, onResult, again }) {
  const bank = useMemo(() => shuffle(step.bank.map((t, i) => ({ t, i }))), [step]);
  const n = (step.code.match(/___/g) || []).length;
  const [slots, setSlots] = useState(() => Array(n).fill(null));
  const [active, setActive] = useState(0);
  const [checked, setChecked] = useState(false);
  const used = new Set(slots.filter((x) => x !== null));

  const pickToken = (bi) => {
    if (checked || used.has(bi)) return;
    const target = slots[active] === null ? active : slots.findIndex((x) => x === null);
    if (target < 0) return;
    play("tap");
    const ns = [...slots];
    ns[target] = bi;
    setSlots(ns);
    const empty = ns.findIndex((x) => x === null);
    setActive(empty < 0 ? target : empty);
  };
  const tapSlot = (k) => {
    if (checked) return;
    if (slots[k] !== null) {
      const ns = [...slots];
      ns[k] = null;
      setSlots(ns);
    }
    setActive(k);
  };
  const check = () => {
    setChecked(true);
    const vals = slots.map((bi) => step.bank[bi]);
    const ok = step.solutions.some((sol) => sol.every((v, k) => v === vals[k]));
    let filled = step.code;
    step.solutions[0].forEach((v) => {
      filled = filled.replace("___", v);
    });
    onResult(ok, { answer: tpl(filled), mono: true });
  };

  let k = 0;
  const lines = tpl(step.code).split("\n");
  return (
    <>
      <StepHead q={tpl(step.q)} again={again} />
      <pre className="code fill-code">
        {lines.map((line, li) => {
          const parts = line.split("___");
          return (
            <div className="code-line" key={li}>
              <span className="lc">
                {parts.map((p, pi) => {
                  let slot = null;
                  if (pi < parts.length - 1) {
                    const sk = k++;
                    const bi = slots[sk];
                    slot = (
                      <button
                        className={"slot" + (bi === null ? " is-empty" : "") + (active === sk && !checked ? " is-active" : "")}
                        onClick={() => tapSlot(sk)}
                        aria-label={bi === null ? `Lücke ${sk + 1}, leer` : `Lücke ${sk + 1}: ${tpl(step.bank[bi])}`}
                      >
                        {bi === null ? "\u00a0" : tpl(step.bank[bi])}
                      </button>
                    );
                  }
                  return (
                    <Fragment key={pi}>
                      {highlight(p, `${li}-${pi}-`)}
                      {slot}
                    </Fragment>
                  );
                })}
              </span>
            </div>
          );
        })}
      </pre>
      <div className="bank">
        {bank.map(({ t, i }) => (
          <button key={i} className={"token" + (used.has(i) ? " is-used" : "")} onClick={() => pickToken(i)} disabled={used.has(i) || checked}>
            {tpl(t)}
          </button>
        ))}
      </div>
      <Footer>
        <button className="btn btn-primary" disabled={slots.some((x) => x === null) || checked} onClick={check}>Prüfen</button>
      </Footer>
    </>
  );
}

function OrderStep({ step, tpl, onResult, again }) {
  const items = useMemo(() => [...step.lines, ...step.distractors], [step]);
  const need = step.lines.length;
  const [pool, setPool] = useState(() => {
    const idx = items.map((_, i) => i);
    let sh = shuffle(idx);
    for (let t = 0; t < 10 && sh.slice(0, need).every((v, k) => v === k); t++) sh = shuffle(idx);
    return sh;
  });
  const [placed, setPlaced] = useState([]);
  const [checked, setChecked] = useState(false);
  const add = (i) => {
    if (checked) return;
    play("tap");
    setPool((p) => p.filter((x) => x !== i));
    setPlaced((p) => [...p, i]);
  };
  const remove = (i) => {
    if (checked) return;
    setPlaced((p) => p.filter((x) => x !== i));
    setPool((p) => [...p, i]);
  };
  const check = () => {
    setChecked(true);
    const seq = placed.map((i) => items[i]);
    const ok = step.accept.some((a) => a.length === seq.length && a.every((v, k) => v === seq[k]));
    onResult(ok, { answer: tpl(step.lines.join("\n")), mono: true });
  };
  return (
    <>
      <StepHead q={tpl(step.q)} again={again} />
      <div className="order-target" aria-label="Dein Programm">
        {placed.length === 0 && <span className="order-hint">Tippe die Bausteine in der richtigen Reihenfolge an. Du brauchst {need}.</span>}
        {placed.map((i, k) => (
          <button key={i} className="block is-placed" onClick={() => remove(i)} disabled={checked}>
            <span className="block-n">{k + 1}</span>
            <code>{highlight(tpl(items[i]))}</code>
          </button>
        ))}
      </div>
      <div className="order-pool">
        {pool.map((i) => (
          <button key={i} className="block" onClick={() => add(i)} disabled={checked}>
            <code>{highlight(tpl(items[i]))}</code>
          </button>
        ))}
      </div>
      <Footer>
        <button className="btn btn-primary" disabled={placed.length !== need || checked} onClick={check}>Prüfen</button>
      </Footer>
    </>
  );
}

function BugStep({ step, tpl, onResult, again }) {
  const [sel, setSel] = useState(null);
  const [checked, setChecked] = useState(false);
  const lines = tpl(step.code).split("\n");
  const check = () => {
    setChecked(true);
    onResult(sel === step.bugLine, { answer: `Zeile ${step.bugLine + 1}: ${lines[step.bugLine].trim()}`, mono: true });
  };
  return (
    <>
      <StepHead q={tpl(step.q)} again={again} kicker="Bug-Jagd 🐞" />
      <div className="code bug-code" role="radiogroup">
        {lines.map((l, i) => {
          let cls = "bug-line";
          if (sel === i) cls += " is-sel";
          if (checked && i === step.bugLine) cls += " is-right";
          if (checked && sel === i && i !== step.bugLine) cls += " is-wrong";
          return (
            <button
              key={i}
              role="radio"
              aria-checked={sel === i}
              className={cls}
              disabled={checked}
              onClick={() => {
                setSel(i);
                play("tap");
              }}
            >
              <span className="ln">{i + 1}</span>
              <span className="lc">{highlight(l)}{l === "" ? "\u200b" : null}</span>
            </button>
          );
        })}
      </div>
      <Footer>
        <button className="btn btn-primary" disabled={sel === null || checked} onClick={check}>Prüfen</button>
      </Footer>
    </>
  );
}

function CodeStep({ step, tpl, onResult, again }) {
  const [code, setCode] = useState(() => tpl(step.starter));
  const [res, setRes] = useState(null);
  const [running, setRunning] = useState(false);
  const [msg, setMsg] = useState(null);
  const [tries, setTries] = useState(0);
  const [hint, setHint] = useState(false);
  const [usedSolution, setUsed] = useState(false);
  const [pyErr, setPyErr] = useState(false);
  const [solved, setSolved] = useState(false);

  const run = async () => {
    setRunning(true);
    setMsg(null);
    setPyErr(false);
    try {
      const r = await runPython(code, step.inputs || []);
      setRes(r);
      if (!r.err) markRun("lesson");
      const c = checkCode(step.check, code, r, tpl);
      if (c.ok) {
        setSolved(true);
        onResult(true, { usedSolution, text: tpl(step.explain) });
      } else {
        setTries((t) => t + 1);
        play("bad");
        buzz(25);
        if (c.reason === "exact") setMsg({ exact: c.expected });
        else if (c.reason === "text") setMsg({ text: c.msg });
      }
    } catch {
      setPyErr(true);
    }
    setRunning(false);
  };

  return (
    <>
      <StepHead q={tpl(step.q)} again={again} kicker="Code schreiben" />
      <Editor value={code} onChange={setCode} disabled={solved} />
      <div className="code-tools">
        <button className="chip-btn" onClick={() => setHint(true)} disabled={hint}>💡 Tipp</button>
        {tries >= 2 && !usedSolution && (
          <button className="chip-btn" onClick={() => { setCode(tpl(step.solution)); setUsed(true); }}>Lösung zeigen</button>
        )}
        <button className="chip-btn" onClick={() => { setCode(tpl(step.starter)); setRes(null); setMsg(null); }}>↺ Von vorn</button>
      </div>
      {hint && <div className="hint">{tpl(step.hint)}</div>}
      <PyStatus />
      {pyErr && (
        <PyError onRetry={run} onSkip={() => onResult(true, { usedSolution: true, text: "Übersprungen. Wiederhol die Lektion später, wenn du Internet hast." })} />
      )}
      {msg && (
        <div className="checkmsg">
          {msg.exact != null ? (
            <>
              Fast! Die Ausgabe soll genau so aussehen:
              <pre>{msg.exact}</pre>
            </>
          ) : (
            msg.text
          )}
        </div>
      )}
      <Output res={res} running={running} />
      <Footer>
        <button className="btn btn-primary" onClick={run} disabled={running || solved}>
          <IconPlay size={18} /> Ausführen & prüfen
        </button>
      </Footer>
    </>
  );
}

/* ---------------- Lektion ---------------- */

function Feedback({ fb, onNext }) {
  const btn = useRef(null);
  useEffect(() => {
    const t = setTimeout(() => btn.current && btn.current.focus({ preventScroll: true }), 60);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className={"fb " + (fb.ok ? "fb-ok" : "fb-bad")} role="status">
      <div className="fb-inner">
        <div className="fb-title">
          <span className="fb-icon">{fb.ok ? <IconCheck size={22} /> : "✕"}</span>
          {fb.title}
        </div>
        {!fb.ok && fb.answer && (
          <div className="fb-answer">
            <span>Richtig ist:</span>
            {fb.mono ? <pre>{fb.answer}</pre> : <strong>{fb.answer}</strong>}
          </div>
        )}
        {fb.text && <p className="fb-text">{fb.text}</p>}
        {!fb.ok && <p className="fb-later">Die Aufgabe kommt am Ende noch einmal.</p>}
        <button ref={btn} className={"btn " + (fb.ok ? "btn-ok" : "btn-bad")} onClick={onNext}>Weiter</button>
      </div>
    </div>
  );
}

export default function Lesson({ lesson, onExit, onDone }) {
  const s = useStore();
  const tpl = makeTpl(s);
  const steps = lesson.steps;
  const [queue, setQueue] = useState(() => steps.map((_, i) => i));
  const [pos, setPos] = useState(0);
  const [doneSet, setDoneSet] = useState(() => new Set());
  const [wrong, setWrong] = useState(() => new Set());
  const [fb, setFb] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const stats = useRef({ answers: 0, wrongAnswers: 0, bugs: 0, start: Date.now() });
  const bodyRef = useRef(null);

  useEffect(() => {
    if (steps.some((st) => st.type === "code" || st.run)) preloadPython().catch(() => {});
  }, [steps]);
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [pos]);

  useBackLayer(true, () => {
    setConfirm((c) => !c);
    return true;
  });

  const idx = queue[pos];
  const step = steps[idx];
  const progress = doneSet.size / steps.length;
  const again = pos >= steps.length;

  const onResult = (ok, info = {}) => {
    stats.current.answers += 1;
    if (ok) {
      play("ok");
      buzz(15);
      if (step.type === "bug" && !wrong.has(idx)) stats.current.bugs += 1;
      if (info.usedSolution) setWrong((w) => new Set(w).add(idx));
      setDoneSet((d) => new Set(d).add(idx));
      setFb({ ok: true, title: pick(PRAISE), text: info.text !== undefined ? info.text : tpl(step.explain) });
    } else {
      stats.current.wrongAnswers += 1;
      play("bad");
      buzz([30, 40, 30]);
      setWrong((w) => new Set(w).add(idx));
      setQueue((q) => [...q, idx]);
      setFb({ ok: false, title: pick(OOPS), answer: info.answer, mono: info.mono, text: tpl(step.explain) });
    }
  };

  const finish = (doneCount) => {
    const seconds = Math.round((Date.now() - stats.current.start) / 1000);
    let summary = null;
    setState((st) => {
      const r = completeLesson(st, lesson, {
        mistakes: wrong.size,
        seconds,
        bugs: stats.current.bugs,
        answers: stats.current.answers,
      });
      summary = r.summary;
      return r.next;
    });
    summary.accuracy = stats.current.answers
      ? Math.round((100 * (stats.current.answers - stats.current.wrongAnswers)) / stats.current.answers)
      : 100;
    play("done");
    onDone(summary, doneCount);
  };

  const next = () => {
    setFb(null);
    let count = doneSet.size;
    if (step.type === "info" && !doneSet.has(idx)) {
      setDoneSet((d) => new Set(d).add(idx));
      count += 1;
    }
    if (pos + 1 >= queue.length) finish(count);
    else setPos((p) => p + 1);
  };

  const renderStep = () => {
    const props = { step, tpl, onResult, onNext: next, again };
    switch (step.type) {
      case "info": return <InfoStep {...props} />;
      case "choice": return <ChoiceStep {...props} />;
      case "fill": return <FillStep {...props} />;
      case "order": return <OrderStep {...props} />;
      case "bug": return <BugStep {...props} />;
      case "code": return <CodeStep {...props} />;
      default: return <p>Unbekannter Aufgabentyp.</p>;
    }
  };

  return (
    <div className="overlay lesson">
      <header className="lesson-top">
        <button className="icon-btn" onClick={() => setConfirm(true)} aria-label="Lektion beenden"><IconClose /></button>
        <div className="lightstick" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
          <div className="lightstick-fill" style={{ width: `${Math.max(6, progress * 100)}%` }} />
        </div>
        {lesson.boss && <span className="boss-chip" title="Era-Finale">👑</span>}
      </header>
      <main className="lesson-body" ref={bodyRef}>
        <div className="lesson-step" key={`${idx}-${pos}`}>{renderStep()}</div>
      </main>
      {fb && <Feedback fb={fb} onNext={next} />}
      {confirm && (
        <div className="confirm-wrap" role="dialog" aria-modal="true" aria-label="Lektion beenden?">
          <div className="confirm">
            <Baemi size={84} mood="think" />
            <h2>Lektion beenden?</h2>
            <p>Dein Fortschritt in dieser Lektion geht verloren.</p>
            <button className="btn btn-primary" onClick={() => setConfirm(false)}>Weiterlernen</button>
            <button className="btn btn-ghost" onClick={onExit}>Beenden</button>
          </div>
        </div>
      )}
    </div>
  );
}

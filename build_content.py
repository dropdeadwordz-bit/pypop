"""
PyPop – Inhalts-Generator & Validator.
Schreibt die Lektionen aus tools/content/era_XX.py nach src/content/era-XX.json
und prüft dabei JEDES Code-Beispiel mit echtem Python:
  - predict: die richtige Antwort wird aus der echten Ausgabe ermittelt
  - code:    Musterlösung muss den Check bestehen, Startcode darf ihn nicht bestehen
  - order:   alle Reihenfolgen mit gleicher Ausgabe werden automatisch akzeptiert
  - bug:     fehlerhafter Code muss wirklich einen Fehler werfen (in der markierten Zeile)
Aufruf:  python3 tools/build_content.py
"""
import json, re, sys, itertools, importlib.util, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
NS = {}
exec((ROOT / "tools" / "runner.py").read_text(), NS)
RUN = NS["__pypop_run"]

# Platzhalter: werden in der App durch Name/Gruppenname ersetzt
TPL = {"@@GRUPPE@@": "STARBYTE", "@@NAME@@": "Yara"}

def fill_tpl(s):
    for k, v in TPL.items():
        s = s.replace(k, v)
    return s

def run(code, inputs=None):
    return json.loads(RUN(fill_tpl(code), inputs or []))

def norm(s):
    lines = [l.rstrip() for l in s.replace("\r", "").split("\n")]
    while lines and lines[-1] == "":
        lines.pop()
    return "\n".join(lines)

WS = re.compile(r"\s+")
ASSIGN = re.compile(r"^\s*[A-Za-z_]\w*\s*(\+|-|\*|/)?=(?!=)", re.M)

def passes(check, code, res):
    """Spiegelbild von checkCode() in src/lib/check.js"""
    if res["err"]:
        return False
    out = norm(res["out"])
    c = fill_tpl(code)
    if "exact" in check and out != norm(fill_tpl(check["exact"])):
        return False
    for s in check.get("includes", []):
        if fill_tpl(s).lower() not in out.lower():
            return False
    flat = WS.sub("", c)
    for s in check.get("codeIncludes", []):
        if WS.sub("", fill_tpl(s)) not in flat:
            return False
    if len([l for l in out.split("\n") if l.strip()]) < check.get("minLines", 0):
        return False
    if len(ASSIGN.findall(c)) < check.get("minAssign", 0):
        return False
    return True

ERRORS = []
def fail(where, msg):
    ERRORS.append(f"[{where}] {msg}")

# ---------- Bausteine für Autor:innen ----------
def info(title, text, code=None, run_code=False, inputs=None, expect_error=False):
    return {"type": "info", "title": title, "text": text, "code": code, "run": run_code,
            "inputs": inputs, "_expect_error": expect_error}

def choice(q, options, answer, explain, code=None, mono=False):
    return {"type": "choice", "q": q, "options": options, "answer": answer,
            "explain": explain, "code": code, "mono": mono}

def predict(code, options, explain, q="Was gibt dieses Programm aus?", inputs=None):
    return {"type": "predict", "q": q, "code": code, "options": options,
            "explain": explain, "inputs": inputs}

def fill(q, code, solution, bank, explain, expect=None, alt=None):
    return {"type": "fill", "q": q, "code": code, "solutions": [solution] + (alt or []),
            "bank": bank, "explain": explain, "_expect": expect}

def order(q, lines, explain, expect=None, distractors=None):
    return {"type": "order", "q": q, "lines": lines, "distractors": distractors or [],
            "explain": explain, "_expect": expect}

def bug(q, code, line, explain, fixed):
    return {"type": "bug", "q": q, "code": code, "bugLine": line, "explain": explain, "_fixed": fixed}

def task(q, starter, solution, check, hint, explain, inputs=None):
    return {"type": "code", "q": q, "starter": starter, "solution": solution,
            "check": check, "hint": hint, "explain": explain, "inputs": inputs}

def lesson(lid, title, steps, boss=False):
    return {"id": lid, "title": title, "boss": boss, "steps": steps}

# ---------- Validierung ----------
def validate_step(where, st):
    t = st["type"]
    if t == "info":
        if st.get("run") and st.get("code"):
            r = run(st["code"], st.get("inputs"))
            if st.pop("_expect_error"):
                if not r["err"]:
                    fail(where, "info: Fehler erwartet, aber Code lief durch")
            elif r["err"]:
                fail(where, f"info: unerwarteter Fehler {r['err']}")
        else:
            st.pop("_expect_error", None)
    elif t == "predict":
        r = run(st["code"], st.get("inputs"))
        if r["err"]:
            fail(where, f"predict: Code wirft Fehler {r['err']}")
            return
        out = norm(r["out"])
        hits = [i for i, o in enumerate(st["options"]) if norm(fill_tpl(o)) == out]
        if len(hits) != 1:
            fail(where, f"predict: {len(hits)} passende Optionen für Ausgabe {out!r}")
            return
        st["type"] = "choice"
        st["answer"] = hits[0]
        st["mono"] = True
    elif t == "choice":
        if not (0 <= st["answer"] < len(st["options"])):
            fail(where, "choice: answer-Index ungültig")
    elif t == "fill":
        n = st["code"].count("___")
        for sol in st["solutions"]:
            if len(sol) != n:
                fail(where, f"fill: {n} Lücken, aber Lösung hat {len(sol)} Teile")
                return
            bank = list(st["bank"])
            for tok in sol:
                if tok in bank:
                    bank.remove(tok)
                else:
                    fail(where, f"fill: Token {tok!r} fehlt in der Bank")
            code = st["code"]
            for tok in sol:
                code = code.replace("___", tok, 1)
            r = run(code)
            if r["err"]:
                fail(where, f"fill: Lösung wirft Fehler {r['err']}")
            exp = st.get("_expect")
            if exp is not None and norm(r["out"]) != norm(fill_tpl(exp)):
                fail(where, f"fill: Ausgabe {norm(r['out'])!r} ≠ erwartet {exp!r}")
        st.pop("_expect", None)
    elif t == "order":
        lines = st["lines"]
        r = run("\n".join(lines))
        if r["err"]:
            fail(where, f"order: Lösung wirft Fehler {r['err']}")
            return
        target = norm(r["out"])
        exp = st.pop("_expect", None)
        if exp is not None and target != norm(fill_tpl(exp)):
            fail(where, f"order: Ausgabe {target!r} ≠ erwartet {exp!r}")
        accepted = set()
        for perm in set(itertools.permutations(lines)):
            rr = run("\n".join(perm))
            if not rr["err"] and norm(rr["out"]) == target:
                accepted.add(perm)
        st["accept"] = sorted([list(p) for p in accepted])
        for d in st["distractors"]:
            if d in lines:
                fail(where, "order: Distraktor ist auch Lösungszeile")
    elif t == "bug":
        r = run(st["code"])
        if not r["err"]:
            fail(where, "bug: fehlerhafter Code läuft ohne Fehler")
        elif r["err"]["line"] and r["err"]["line"] != st["bugLine"] + 1:
            fail(where, f"bug: Python meldet Zeile {r['err']['line']}, markiert ist {st['bugLine']+1}")
        rf = run(st.pop("_fixed"))
        if rf["err"]:
            fail(where, f"bug: korrigierter Code wirft Fehler {rf['err']}")
    elif t == "code":
        rs = run(st["solution"], st.get("inputs"))
        if not passes(st["check"], st["solution"], rs):
            fail(where, f"code: Musterlösung besteht Check nicht (out={rs['out']!r}, err={rs['err']})")
        r0 = run(st["starter"], st.get("inputs"))
        if passes(st["check"], st["starter"], r0):
            fail(where, "code: Startcode besteht den Check bereits")
    for k in [k for k, v in st.items() if v is None]:
        del st[k]

def build():
    eras = json.loads((ROOT / "tools" / "eras.json").read_text())
    (ROOT / "src" / "content" / "eras.json").write_text(json.dumps(eras, ensure_ascii=False, indent=1))
    total = 0
    for f in sorted((ROOT / "tools" / "content").glob("era_*.py")):
        spec = importlib.util.spec_from_file_location(f.stem, f)
        mod = importlib.util.module_from_spec(spec)
        mod.__dict__.update({k: globals()[k] for k in
                             ["info", "choice", "predict", "fill", "order", "bug", "task", "lesson"]})
        spec.loader.exec_module(mod)
        era = mod.ERA
        for L in era["lessons"]:
            for i, st in enumerate(L["steps"]):
                validate_step(f"{L['id']} Schritt {i+1}", st)
                total += 1
        out = ROOT / "src" / "content" / f"era-{era['era']:02d}.json"
        out.write_text(json.dumps(era, ensure_ascii=False, indent=1))
        print(f"{out.name}: {len(era['lessons'])} Lektionen, {sum(len(l['steps']) for l in era['lessons'])} Schritte")
    # Runner im Worker muss identisch sein
    worker = (ROOT / "public" / "py-worker.js").read_text()
    if (ROOT / "tools" / "runner.py").read_text().strip() not in worker:
        fail("py-worker.js", "Runner-Code weicht von tools/runner.py ab")
    if ERRORS:
        print("\nFEHLER:")
        for e in ERRORS:
            print(" -", e)
        sys.exit(1)
    print(f"OK – {total} Schritte geprüft.")

if __name__ == "__main__":
    build()

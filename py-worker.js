/* PyPop – Python-Worker (Pyodide/WebAssembly). Läuft getrennt vom UI,
   damit Endlosschleifen die App nicht einfrieren (Timeout -> Worker wird neu gestartet). */
const params = new URL(self.location.href).searchParams;
const BASE = params.get("base") || "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";
let pyodide = null;
let ready = null;

const RUNNER = String.raw`
import sys, io, json, traceback

def __pypop_run(code, inputs):
    out = io.StringIO()
    old_out = sys.stdout
    sys.stdout = out
    queue = [str(v) for v in inputs]
    missing = [0]
    def _input(prompt=""):
        out.write(str(prompt))
        if queue:
            value = queue.pop(0)
        else:
            value = ""
            missing[0] += 1
        out.write(value + "\n")
        return value
    ns = {"__name__": "__main__", "input": _input}
    err = None
    try:
        exec(compile(code, "<dein-code>", "exec"), ns)
    except SystemExit:
        pass
    except SyntaxError as e:
        err = {"type": type(e).__name__, "msg": str(e.msg), "line": e.lineno}
    except Exception as e:
        line = None
        for fr in traceback.extract_tb(e.__traceback__):
            if fr.filename == "<dein-code>":
                line = fr.lineno
        err = {"type": type(e).__name__, "msg": str(e), "line": line}
    finally:
        sys.stdout = old_out
    text = out.getvalue()
    if len(text) > 20000:
        text = text[:20000] + "\n...(Ausgabe gekürzt)"
    return json.dumps({"out": text, "err": err, "missingInputs": missing[0]})
`;

async function init() {
  importScripts(BASE + "pyodide.js");
  pyodide = await loadPyodide({ indexURL: BASE });
  pyodide.runPython(RUNNER);
}

self.onmessage = async (e) => {
  const msg = e.data || {};
  if (msg.type === "init") {
    try {
      ready = ready || init();
      await ready;
      self.postMessage({ type: "ready" });
    } catch (err) {
      ready = null;
      self.postMessage({ type: "init-error", error: String(err) });
    }
    return;
  }
  if (msg.type === "run") {
    try {
      ready = ready || init();
      await ready;
      const fn = pyodide.globals.get("__pypop_run");
      const res = fn(msg.code, pyodide.toPy(msg.inputs || []));
      fn.destroy();
      self.postMessage({ type: "result", id: msg.id, ...JSON.parse(res) });
    } catch (err) {
      self.postMessage({ type: "result", id: msg.id, out: "", missingInputs: 0,
        err: { type: "InternalError", msg: String(err), line: null } });
    }
  }
};

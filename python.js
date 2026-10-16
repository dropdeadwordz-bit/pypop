/* Startet Python (Pyodide) in einem Web Worker – erst wenn es gebraucht wird. */
import { useEffect, useState } from "react";

const BASE = import.meta.env.VITE_PYODIDE_BASE || "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";
let worker = null;
let readyP = null;
let status = "idle"; // idle | loading | ready | error
let seq = 0;
const pending = new Map();
const subs = new Set();

function setStatus(s) {
  status = s;
  subs.forEach((f) => f(s));
}

function spawn() {
  const w = new Worker("/py-worker.js?base=" + encodeURIComponent(BASE));
  w.addEventListener("message", (e) => {
    const m = e.data;
    if (m.type !== "result") return;
    const p = pending.get(m.id);
    if (!p) return;
    clearTimeout(p.timer);
    pending.delete(m.id);
    p.resolve(m);
  });
  worker = w;
  return w;
}

export function preloadPython() {
  if (readyP) return readyP;
  setStatus("loading");
  const w = spawn();
  readyP = new Promise((resolve, reject) => {
    const onMsg = (e) => {
      if (e.data.type === "ready") {
        w.removeEventListener("message", onMsg);
        setStatus("ready");
        resolve();
      } else if (e.data.type === "init-error") {
        w.removeEventListener("message", onMsg);
        w.terminate();
        if (worker === w) worker = null;
        readyP = null;
        setStatus("error");
        reject(new Error(e.data.error));
      }
    };
    w.addEventListener("message", onMsg);
    w.postMessage({ type: "init" });
  });
  return readyP;
}

export async function runPython(code, inputs = [], timeoutMs = 6000) {
  await preloadPython();
  return new Promise((resolve) => {
    const id = ++seq;
    const w = worker;
    const timer = setTimeout(() => {
      pending.delete(id);
      w.terminate();
      if (worker === w) {
        worker = null;
        readyP = null;
        setStatus("idle");
      }
      resolve({ out: "", err: { type: "Timeout", msg: "", line: null }, missingInputs: 0 });
      setTimeout(() => preloadPython().catch(() => {}), 50);
    }, timeoutMs);
    pending.set(id, { resolve, timer });
    w.postMessage({ type: "run", id, code, inputs });
  });
}

export function usePyStatus() {
  const [s, setS] = useState(status);
  useEffect(() => {
    subs.add(setS);
    setS(status);
    return () => subs.delete(setS);
  }, []);
  return s;
}

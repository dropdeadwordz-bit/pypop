/* „App installieren“ auf Android (Chrome zeigt den Dialog nur nach diesem Event) */
import { useEffect, useState } from "react";

let deferred = null;
const subs = new Set();
const notify = () => subs.forEach((f) => f());

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferred = e;
  notify();
});
window.addEventListener("appinstalled", () => {
  deferred = null;
  notify();
});

export const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

export function useInstall() {
  const [, force] = useState(0);
  useEffect(() => {
    const f = () => force((x) => x + 1);
    subs.add(f);
    return () => subs.delete(f);
  }, []);
  if (!deferred) return null;
  return async () => {
    const ev = deferred;
    ev.prompt();
    try { await ev.userChoice; } catch { /* abgebrochen */ }
    deferred = null;
    notify();
  };
}

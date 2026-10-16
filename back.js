/* Android-Zurück-Taste: schließt Overlays (Lektion, Album, Fenster), statt die App zu verlassen. */
import { useEffect, useRef } from "react";

const stack = [];
let depth = 0;
let ignore = 0;
let scheduled = false;

function reconcile() {
  scheduled = false;
  const want = stack.length;
  if (depth < want) {
    while (depth < want) {
      history.pushState({ pypop: depth + 1 }, "");
      depth++;
    }
  } else if (depth > want) {
    const diff = depth - want;
    ignore += 1;
    depth = want;
    history.go(-diff);
  }
}

function schedule() {
  if (!scheduled) {
    scheduled = true;
    setTimeout(reconcile, 0);
  }
}

window.addEventListener("popstate", () => {
  if (ignore > 0) {
    ignore--;
    return;
  }
  depth = Math.max(0, depth - 1);
  const top = stack[stack.length - 1];
  if (!top) return;
  const keep = top.ref.current ? top.ref.current() : false;
  if (!keep) stack.pop();
  schedule();
});

/** onBack() gibt true zurück, wenn das Overlay offen bleiben soll. */
export function useBackLayer(active, onBack) {
  const ref = useRef(onBack);
  ref.current = onBack;
  useEffect(() => {
    if (!active) return undefined;
    const layer = { ref };
    stack.push(layer);
    schedule();
    return () => {
      const i = stack.indexOf(layer);
      if (i >= 0) stack.splice(i, 1);
      schedule();
    };
  }, [active]);
}

import { useEffect, useState } from "react";

const subs = new Set();
let seq = 0;

export function toast(text, icon = "✨") {
  const t = { id: ++seq, text, icon };
  subs.forEach((f) => f(t));
}

export function useToasts() {
  const [list, setList] = useState([]);
  useEffect(() => {
    const f = (t) => {
      setList((l) => [...l, t]);
      setTimeout(() => setList((l) => l.filter((x) => x.id !== t.id)), 2800);
    };
    subs.add(f);
    return () => subs.delete(f);
  }, []);
  return list;
}

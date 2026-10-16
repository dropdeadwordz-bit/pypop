import { useRef } from "react";

const KEYS = [
  { label: "⇥", ins: "    ", aria: "Einrücken" },
  { label: "( )", ins: "(", after: ")" },
  { label: '" "', ins: '"', after: '"' },
  { label: "' '", ins: "'", after: "'" },
  { label: ":", ins: ":" },
  { label: "=", ins: "=" },
  { label: "+", ins: "+" },
  { label: "-", ins: "-" },
  { label: "*", ins: "*" },
  { label: "/", ins: "/" },
  { label: "%", ins: "%" },
  { label: "#", ins: "# " },
  { label: ",", ins: "," },
  { label: "[ ]", ins: "[", after: "]" },
];

/** Code-Editor fürs Handy: Symbolleiste, Auto-Einrückung, gerade Anführungszeichen */
export default function Editor({ value, onChange, minRows = 5, label = "Dein Code", disabled = false }) {
  const ta = useRef(null);
  const lines = value.split("\n").length;

  const apply = (text, a, b = a) => {
    onChange(text);
    requestAnimationFrame(() => {
      const el = ta.current;
      if (!el) return;
      el.focus();
      el.selectionStart = a;
      el.selectionEnd = b;
    });
  };

  const insert = (before, after = "") => {
    const el = ta.current;
    const s = el ? el.selectionStart : value.length;
    const e = el ? el.selectionEnd : value.length;
    const sel = value.slice(s, e);
    apply(value.slice(0, s) + before + sel + after + value.slice(e), s + before.length, s + before.length + sel.length);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const s = ta.current.selectionStart;
      const lineStart = value.lastIndexOf("\n", s - 1) + 1;
      const cur = value.slice(lineStart, s);
      const indent = cur.match(/^[ \t]*/)[0] + (cur.trimEnd().endsWith(":") ? "    " : "");
      insert("\n" + indent);
    } else if (e.key === "Tab") {
      e.preventDefault();
      insert("    ");
    }
  };

  const onInput = (e) => {
    const el = e.target;
    const v = el.value;
    const fixed = v.replace(/[“”„‟″«»]/g, '"').replace(/[‘’‚‛′]/g, "'").replace(/\u00A0/g, " ");
    if (fixed !== v) {
      const pos = el.selectionStart;
      apply(fixed, pos);
    } else {
      onChange(v);
    }
  };

  return (
    <div className={"editor" + (disabled ? " is-disabled" : "")}>
      <div className="editor-body">
        <pre className="editor-gutter" aria-hidden="true">
          {Array.from({ length: lines }, (_, i) => i + 1).join("\n")}
        </pre>
        <textarea
          ref={ta}
          className="editor-input"
          aria-label={label}
          value={value}
          onChange={onInput}
          onKeyDown={onKeyDown}
          rows={Math.max(minRows, lines + 1)}
          wrap="off"
          spellCheck={false}
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          enterKeyHint="enter"
          disabled={disabled}
        />
      </div>
      <div className="symbar" role="toolbar" aria-label="Sonderzeichen">
        {KEYS.map((k) => (
          <button
            key={k.label}
            type="button"
            className="sym"
            aria-label={k.aria || k.label}
            onPointerDown={(e) => {
              e.preventDefault();
              if (!disabled) insert(k.ins, k.after || "");
            }}
          >
            {k.label}
          </button>
        ))}
      </div>
    </div>
  );
}

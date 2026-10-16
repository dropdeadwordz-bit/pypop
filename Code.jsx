/* Syntax-Hervorhebung für Python (leichtgewichtig) */
const KW = new Set(["if", "elif", "else", "for", "while", "def", "return", "in", "and", "or", "not", "True", "False", "None", "import", "from", "as", "class", "break", "continue", "pass", "try", "except", "with", "lambda", "is", "global"]);
const BI = new Set(["print", "input", "int", "str", "float", "len", "range", "list", "dict", "type", "round", "min", "max", "sum", "abs", "sorted", "bool"]);
const TOKEN = /(#.*$)|("(?:[^"\\]|\\.)*"?|'(?:[^'\\]|\\.)*'?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_\u00C0-\u024F][\w\u00C0-\u024F]*)|(\s+)|(.)/g;

export function highlight(line, keyBase = "") {
  const out = [];
  let m;
  let k = 0;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(line))) {
    const [t, com, str, num, word] = m;
    const key = keyBase + k++;
    if (com) out.push(<span key={key} className="t-com">{t}</span>);
    else if (str) out.push(<span key={key} className="t-str">{t}</span>);
    else if (num) out.push(<span key={key} className="t-num">{t}</span>);
    else if (word && KW.has(word)) out.push(<span key={key} className="t-kw">{t}</span>);
    else if (word && BI.has(word)) out.push(<span key={key} className="t-fn">{t}</span>);
    else out.push(t);
    if (t === "") break;
  }
  return out;
}

export function CodeView({ code, numbers = true }) {
  const lines = String(code).split("\n");
  return (
    <pre className={"code" + (numbers && lines.length > 1 ? " numbered" : "")}>
      {lines.map((l, i) => (
        <div className="code-line" key={i}>
          {numbers && lines.length > 1 && <span className="ln">{i + 1}</span>}
          <span className="lc">{highlight(l, i + "-")}{l === "" ? "\u200b" : null}</span>
        </div>
      ))}
    </pre>
  );
}

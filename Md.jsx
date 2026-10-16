/* Mini-Markdown: **fett**, *kursiv*, `code`, Absätze pro Zeile */
function inline(text, keyBase) {
  const parts = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let last = 0;
  let m;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith("**")) parts.push(<strong key={keyBase + k++}>{t.slice(2, -2)}</strong>);
    else if (t.startsWith("`")) parts.push(<code key={keyBase + k++} className="ic">{t.slice(1, -1)}</code>);
    else parts.push(<em key={keyBase + k++}>{t.slice(1, -1)}</em>);
    last = m.index + t.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export default function Md({ text, className = "md" }) {
  if (!text) return null;
  return (
    <div className={className}>
      {text.split("\n").map((line, i) => (
        <p key={i}>{inline(line, i + "-")}</p>
      ))}
    </div>
  );
}

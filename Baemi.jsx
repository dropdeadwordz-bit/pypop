import { useId } from "react";

const INK = "#2B1A4F";
function mix(hex, to, t) {
  const a = hex.replace("#", "");
  const b = to.replace("#", "");
  const c = [0, 2, 4].map((i) => {
    const x = parseInt(a.slice(i, i + 2), 16);
    const y = parseInt(b.slice(i, i + 2), 16);
    return Math.round(x + (y - x) * t).toString(16).padStart(2, "0");
  });
  return "#" + c.join("");
}

function Coil({ s, w }) {
  return (
    <>
      <path d="M62 150 C 30 150, 30 182, 70 182 L 132 182 C 172 182, 172 150, 138 150" fill="none" stroke={s} strokeWidth={w} strokeLinecap="round" />
      <path d="M62 150 C 80 150, 92 160, 104 168" fill="none" stroke={s} strokeWidth={w} strokeLinecap="round" />
      <path d="M138 150 C 110 150, 96 140, 104 118 C 110 102, 128 96, 120 84" fill="none" stroke={s} strokeWidth={w + 2} strokeLinecap="round" />
    </>
  );
}

/** Baemi – die Code-Schlange (eigenes Maskottchen von PyPop) */
export default function Baemi({ size = 120, body = "#3FCFA6", acc = null, mood = "happy", className = "", title }) {
  const id = useId().replace(/:/g, "");
  const light = mix(body, "#ffffff", 0.45);
  const deep = mix(body, "#1a0f33", 0.22);
  return (
    <svg className={"baemi " + className} width={size} height={size} viewBox="0 0 200 200" role="img" aria-label={title || "Baemi, die Code-Schlange"}>
      <defs>
        <linearGradient id={"bg" + id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={light} />
          <stop offset="1" stopColor={body} />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="190" rx="62" ry="6" fill={INK} opacity=".12" />
      <Coil s={INK} w={33} />
      <ellipse cx="100" cy="166" rx="52" ry="12" fill={deep} />
      <Coil s={body} w={26} />
      <path d="M70 176 L 130 176" stroke={light} strokeWidth="5" strokeLinecap="round" opacity=".7" />
      <g className="baemi-head">
        <ellipse cx="104" cy="64" rx="52" ry="44" fill={`url(#bg${id})`} stroke={INK} strokeWidth="3.5" />
        <ellipse cx="84" cy="35" rx="17" ry="6.5" fill="#fff" opacity=".5" />
        {mood === "cheer" ? (
          <path d="M74 66 Q84 54 94 66 M114 66 Q124 54 134 66" stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" />
        ) : (
          <>
            <ellipse cx={mood === "think" ? 87 : 84} cy={mood === "think" ? 60 : 64} rx="9.5" ry="11.5" fill={INK} />
            <ellipse cx={mood === "think" ? 127 : 124} cy={mood === "think" ? 60 : 64} rx="9.5" ry="11.5" fill={INK} />
            <circle cx={mood === "think" ? 90.5 : 87.5} cy={mood === "think" ? 55 : 59} r="3.8" fill="#fff" />
            <circle cx={mood === "think" ? 130.5 : 127.5} cy={mood === "think" ? 55 : 59} r="3.8" fill="#fff" />
            <circle cx="81" cy="69" r="1.7" fill="#fff" />
            <circle cx="121" cy="69" r="1.7" fill="#fff" />
          </>
        )}
        <ellipse cx="67" cy="81" rx="9" ry="5.5" fill="#FF6FA8" opacity=".6" />
        <ellipse cx="141" cy="81" rx="9" ry="5.5" fill="#FF6FA8" opacity=".6" />
        {mood === "cheer" ? (
          <>
            <path d="M93 80 Q104 98 115 80 Z" fill={INK} />
            <path d="M98 87 Q104 93 110 87" fill="#FF6FA8" />
          </>
        ) : mood === "think" ? (
          <path d="M98 85 L110 83" stroke={INK} strokeWidth="3.6" fill="none" strokeLinecap="round" />
        ) : (
          <path d="M96 82 Q104 90 112 82" stroke={INK} strokeWidth="3.6" fill="none" strokeLinecap="round" />
        )}
        {acc && (
          <text x="152" y="38" fontSize="40" textAnchor="middle" dominantBaseline="middle" transform="rotate(14 152 38)">
            {acc}
          </text>
        )}
      </g>
    </svg>
  );
}

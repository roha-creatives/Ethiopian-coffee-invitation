const I = "var(--ink)";
const P = "var(--primary)";
const W = "#fbfbfb";
const s = { stroke: I, strokeWidth: 3.5, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

export function ProgramIcon({ name }: { name: "jebena" | "cups" | "barista" | "ice" | "mystery" }) {
  switch (name) {
    case "jebena":
      return (
        <svg viewBox="0 0 100 100" aria-hidden>
          <rect x="6" y="6" width="88" height="88" rx="18" fill={W} {...s} />
          <path d="M30,64 Q28,44 50,43 Q72,44 70,64 Q69,80 50,80 Q31,80 30,64 Z" fill={P} {...s} />
          <path d="M45,43 L43,22 Q50,18 57,22 L55,43 Z" fill={P} {...s} />
          <path d="M31,58 Q18,52 15,36" fill="none" {...s} />
          <path d="M69,50 Q82,50 80,62 Q78,72 68,70" fill="none" {...s} />
          <path d="M40,64 Q50,70 60,64" fill="none" stroke={W} strokeWidth={3} strokeLinecap="round" />
        </svg>
      );
    case "cups":
      return (
        <svg viewBox="0 0 100 100" aria-hidden>
          <rect x="6" y="6" width="88" height="88" rx="18" fill={W} {...s} />
          <path d="M14,72 L86,72 L80,80 L20,80 Z" fill={P} {...s} />
          {[28, 50, 72].map((x) => (
            <g key={x}>
              <path d={`M${x - 9},50 L${x + 9},50 L${x + 6},70 L${x - 6},70 Z`} fill={W} {...s} />
              <path d={`M${x},56 L${x},64`} stroke={P} strokeWidth={4} strokeLinecap="round" />
              <path d={`M${x},42 q-4,-6 0,-12 q4,-6 0,-12`} fill="none" stroke={I} strokeWidth={2.6} strokeLinecap="round" />
            </g>
          ))}
        </svg>
      );
    case "barista":
      return (
        <svg viewBox="0 0 100 100" aria-hidden>
          <rect x="6" y="6" width="88" height="88" rx="18" fill={W} {...s} />
          <path d="M22,90 Q22,62 50,62 Q78,62 78,90" fill={P} {...s} />
          <path d="M40,64 L40,90 M60,64 L60,90" stroke={W} strokeWidth={4} />
          <circle cx="50" cy="40" r="15" fill={W} {...s} />
          <path d="M34,34 Q36,18 50,18 Q66,18 67,32 Q56,26 46,30 Q40,32 34,34 Z" fill={I} />
          <path d="M44,46 Q50,51 56,46" fill="none" {...s} strokeWidth={2.8} />
        </svg>
      );
    case "ice":
      return (
        <svg viewBox="0 0 100 100" aria-hidden>
          <rect x="6" y="6" width="88" height="88" rx="18" fill={W} {...s} />
          <path d="M28,24 L72,24 L66,84 L34,84 Z" fill={W} {...s} />
          <path d="M31,48 L69,48 L66,84 L34,84 Z" fill={P} stroke="none" />
          <path d="M28,24 L72,24 L66,84 L34,84 Z" fill="none" {...s} />
          <rect x="36" y="38" width="13" height="13" rx="3" transform="rotate(-12 42 44)" fill={W} {...s} strokeWidth={2.8} />
          <rect x="51" y="44" width="13" height="13" rx="3" transform="rotate(14 57 50)" fill={W} {...s} strokeWidth={2.8} />
          <path d="M60,24 L68,10" {...s} />
        </svg>
      );
    case "mystery":
      return (
        <svg viewBox="0 0 100 100" aria-hidden>
          <rect x="6" y="6" width="88" height="88" rx="18" fill={W} {...s} />
          <path d="M26,34 L74,34 L68,78 Q50,86 32,78 Z" fill={P} {...s} />
          <path d="M43,48 Q43,40 51,40 Q59,40 59,47 Q59,52 52,55 L51,60" fill="none" stroke={W} strokeWidth={4.5} strokeLinecap="round" />
          <circle cx="51" cy="68" r="2.8" fill={W} />
          <path d="M40,28 q-4,-6 0,-12 M58,28 q-4,-6 0,-12" fill="none" stroke={I} strokeWidth={2.6} strokeLinecap="round" />
        </svg>
      );
  }
}

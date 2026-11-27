"use client";
import { useEffect, useState } from "react";

const pad = (n: number) => String(n).padStart(2, "0");

/** Live countdown to `to`. Calls `onEnd` once when it reaches zero. */
export default function Countdown({ to, label, onEnd }: { to: string; label: string; onEnd?: () => void }) {
  const target = Date.parse(to);
  const [left, setLeft] = useState<number | null>(null); // null until mounted (avoids a server/client mismatch)

  useEffect(() => {
    const tick = () => {
      const ms = Math.max(0, target - Date.now());
      setLeft(ms);
      return ms;
    };
    if (tick() === 0) { onEnd?.(); return; }
    const id = setInterval(() => { if (tick() === 0) { clearInterval(id); onEnd?.(); } }, 1000);
    return () => clearInterval(id);
  }, [target, onEnd]);

  const s = left === null ? null : Math.floor(left / 1000);
  const parts: [string, string][] = [
    ["Days", s === null ? "--" : pad(Math.floor(s / 86400))],
    ["Hours", s === null ? "--" : pad(Math.floor((s % 86400) / 3600))],
    ["Min", s === null ? "--" : pad(Math.floor((s % 3600) / 60))],
    ["Sec", s === null ? "--" : pad(s % 60)],
  ];

  return (
    <div className="countdown" role="timer" aria-label={label}>
      <p className="countdown-label">{label}</p>
      <div className="countdown-boxes">
        {parts.map(([unit, v]) => (
          <div key={unit} className="countdown-box" aria-hidden={unit === "Sec"}>
            <span>{v}</span>
            <small>{unit}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

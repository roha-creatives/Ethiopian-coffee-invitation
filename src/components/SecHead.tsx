"use client";
import { useEffect, useRef } from "react";
import { setupGsap } from "@/lib/anim";

/** Section label + big heading with an orange copy behind that follows the pointer (1–4px). */
export default function SecHead({ label, heading, light }: { label: string; heading: string; light?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const zone = ref.current;
    if (!zone || !matchMedia("(hover: hover)").matches) return;
    const { gsap } = setupGsap();
    const wrap = zone.querySelector<HTMLElement>(".sec-heading-wrap")!;
    const shadow = zone.querySelector<HTMLElement>(".sec-heading.shadow")!;
    const move = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const k = Math.min(1, Math.max(0.25, Math.hypot(dx, dy) / (Math.max(r.width, r.height) / 2 || 100)));
      const a = Math.atan2(dy, dx);
      gsap.to(shadow, { x: Math.cos(a) * k * 4, y: Math.sin(a) * k * 4, duration: 0.2, ease: "power1.out", overwrite: "auto" });
    };
    const leave = () => gsap.to(shadow, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1.1, 0.4)", overwrite: "auto" });
    zone.addEventListener("pointermove", move, { passive: true });
    zone.addEventListener("pointerleave", leave);
    return () => { zone.removeEventListener("pointermove", move); zone.removeEventListener("pointerleave", leave); };
  }, []);
  return (
    <div className={`sec-head ${light ? "light" : ""}`} ref={ref}>
      <p className="sec-label">{label}</p>
      <div className="sec-heading-wrap">
        <h2 className="sec-heading display">{heading}</h2>
        <p className="sec-heading shadow display" aria-hidden>{heading}</p>
      </div>
    </div>
  );
}

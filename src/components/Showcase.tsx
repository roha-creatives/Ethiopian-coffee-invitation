"use client";
import { useEffect, useRef } from "react";
import Image from "next/image";
import { setupGsap, prefersReducedMotion } from "@/lib/anim";

type Slide = { src: string; video?: string; alt: string };

/** Endless image strip that drifts, flips direction with scroll and speeds up with scroll velocity. */
export default function Showcase({ slides }: { slides: Slide[] }) {
  const wrap = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const sets = 3;

  useEffect(() => {
    const t = track.current;
    const w = wrap.current;
    if (!t || !w || prefersReducedMotion()) return;
    const { gsap, ScrollTrigger } = setupGsap();

    let setWidth = 0;
    const measure = () => {
      const all = t.children;
      const first = all[0] as HTMLElement, clone = all[slides.length] as HTMLElement;
      if (first && clone) setWidth = clone.offsetLeft - first.offsetLeft;
    };
    measure();
    addEventListener("resize", measure);

    let x = 0, dirTarget = -1, dir = -1, boost = 0, visible = false;
    const st = ScrollTrigger.create({
      trigger: document.body, start: "top top", end: "bottom bottom",
      onUpdate: (self) => {
        const d = self.direction === 1 ? -1 : 1;
        dirTarget = d;
        boost = Math.min(Math.abs(self.getVelocity()) / 220, 10) * d;
      },
    });
    const vis = ScrollTrigger.create({ trigger: w, start: "top bottom", end: "bottom top", onToggle: (s) => (visible = s.isActive) });
    const tick = () => {
      if (!visible) return;
      dir += (dirTarget - dir) * 0.06;
      boost *= 0.92;
      x += 1.5 * dir + boost;
      if (setWidth > 0) {
        while (x <= -setWidth) x += setWidth;
        while (x > 0) x -= setWidth;
      }
      gsap.set(t, { x, force3D: true });
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      st.kill(); vis.kill();
      removeEventListener("resize", measure);
    };
  }, [slides.length]);

  const all = Array.from({ length: sets }, () => slides).flat();
  return (
    <section className="showcase" ref={wrap} aria-label="Gallery">
      <div className="showcase-track" ref={track}>
        {all.map((s, i) => (
          <div className="showcase-slide" key={i} aria-hidden={i >= slides.length}>
            {s.video ? (
              <video src={s.video} poster={s.src} autoPlay muted loop playsInline preload="metadata" />
            ) : (
              <Image src={s.src} alt={i < slides.length ? s.alt : ""} fill sizes="(max-width: 767px) 260px, (max-width: 991px) 330px, 520px" quality={70} />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

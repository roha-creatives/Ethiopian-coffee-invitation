"use client";
import { useEffect, useRef, useState } from "react";
import type { Voice } from "@/lib/event";
import Image from "next/image";
import { setupGsap } from "@/lib/anim";
import SecHead from "./SecHead";

const ANGLES = [-7.5, 6.8, -5.5, 8.2, -8.5, 6.2, -7.0, 7.8];

/** Stacked card deck: click top half / swipe up = next, bottom half / swipe down = previous. */
export default function Voices({ voices }: { voices: Voice[] }) {
  const bg = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [touch, setTouch] = useState(false);

  useEffect(() => {
    const box = bg.current;
    if (!box) return;
    const { gsap } = setupGsap();
    const cards = Array.from(box.querySelectorAll<HTMLElement>(".v-card"));
    const total = cards.length;
    let cur = 0, busy = false;
    const isTouch = matchMedia("(pointer: coarse)").matches || innerWidth < 992;
    setTouch(isTouch);

    const order = () =>
      cards.forEach((c, i) => {
        c.style.zIndex = String(total - ((i - cur + total) % total));
        if (i !== cur) gsap.to(c, { rotation: ANGLES[i % ANGLES.length], yPercent: -50, duration: 0.35, ease: "power2.out", overwrite: "auto" });
      });
    // GSAP owns the transform, so centring is done with xPercent/yPercent (CSS translate would be overwritten)
    cards.forEach((c, i) => gsap.set(c, { xPercent: -50, yPercent: -50, rotation: i === 0 ? 0 : ANGLES[i % ANGLES.length] }));
    order();

    const next = () => {
      if (busy || total < 2) return;
      busy = true;
      const out = cards[cur], ni = (cur + 1) % total;
      gsap.to(cards[ni], { rotation: 0, duration: 0.35, ease: "power2.out" });
      gsap.to(out, {
        yPercent: -190, rotation: ANGLES[cur % 8] + (cur % 2 ? -9 : 9), duration: 0.38, ease: "power2.inOut",
        onComplete: () => {
          const was = cur;
          cur = ni; order(); out.style.zIndex = "1";
          gsap.to(out, { yPercent: -50, rotation: ANGLES[was % 8], duration: 0.38, ease: "power2.out", onComplete: () => { order(); busy = false; } });
        },
      });
      setActive(ni);
    };
    const prev = () => {
      if (busy || total < 2) return;
      busy = true;
      const pi = (cur - 1 + total) % total, inc = cards[pi];
      gsap.to(cards[cur], { rotation: ANGLES[cur % 8], duration: 0.35, ease: "power2.out" });
      gsap.to(inc, {
        yPercent: 70, rotation: ANGLES[pi % 8] + (pi % 2 ? -8 : 8), duration: 0.38, ease: "power2.inOut",
        onComplete: () => {
          cur = pi; order(); inc.style.zIndex = String(total + 10);
          gsap.to(inc, { yPercent: -50, rotation: 0, duration: 0.38, ease: "power2.out", onComplete: () => { order(); busy = false; } });
        },
      });
      setActive(pi);
    };

    // cursor arrow (desktop)
    const arrow = box.querySelector<HTMLElement>(".v-arrow")!;
    const arrowSvg = arrow.querySelector("svg")!;
    gsap.set(arrow, { xPercent: -50, yPercent: -50, scale: 0, opacity: 0 });
    const qx = gsap.quickTo(arrow, "x", { duration: 0.15, ease: "power2.out" });
    const qy = gsap.quickTo(arrow, "y", { duration: 0.15, ease: "power2.out" });
    const pos = (e: MouseEvent) => {
      const r = box.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      qx(x); qy(y);
      arrowSvg.style.rotate = y < r.height / 2 ? "0deg" : "180deg";
    };
    const enter = (e: MouseEvent) => { const r = box.getBoundingClientRect(); gsap.set(arrow, { x: e.clientX - r.left, y: e.clientY - r.top }); gsap.to(arrow, { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(2)" }); };
    const leave = () => gsap.to(arrow, { scale: 0, opacity: 0, duration: 0.2 });

    let sy = 0, sx = 0, swiped = false;
    const ts = (e: TouchEvent) => { sy = e.touches[0].clientY; sx = e.touches[0].clientX; swiped = false; };
    const te = (e: TouchEvent) => {
      const dy = e.changedTouches[0].clientY - sy, dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) { swiped = true; if (dx < 0) next(); else prev(); }
    };
    const click = (e: MouseEvent) => {
      if (swiped) { swiped = false; return; }
      const r = box.getBoundingClientRect();
      if (e.clientY - r.top < r.height / 2) next(); else prev();
    };
    const key = (e: KeyboardEvent) => { if (e.key === "ArrowRight" || e.key === "ArrowDown") next(); if (e.key === "ArrowLeft" || e.key === "ArrowUp") prev(); };

    if (!isTouch) { box.addEventListener("mouseenter", enter); box.addEventListener("mousemove", pos); box.addEventListener("mouseleave", leave); }
    box.addEventListener("touchstart", ts, { passive: true });
    box.addEventListener("touchend", te, { passive: true });
    box.addEventListener("click", click);
    box.addEventListener("keydown", key);
    return () => {
      box.removeEventListener("mouseenter", enter); box.removeEventListener("mousemove", pos); box.removeEventListener("mouseleave", leave);
      box.removeEventListener("touchstart", ts); box.removeEventListener("touchend", te);
      box.removeEventListener("click", click); box.removeEventListener("keydown", key);
    };
  }, []);

  return (
    <section className="voices" id="voices">
      <SecHead label="From the bar" heading="What's brewing" />
      <div className="voices-body">
        <div className="voices-bg" ref={bg} tabIndex={0} role="region" aria-roledescription="carousel" aria-label="Notes from the team">
          {voices.map((v, i) => (
            <figure className="v-card" key={i} aria-hidden={i !== active}>
              <div className="v-inner">
                <blockquote className="v-headline" lang="am">{v.headline}</blockquote>
                <div className="v-bottom">
                  <figcaption className="v-pfp">
                    <span className="v-img">
                      <Image src={v.avatar} alt="" width={120} height={120} sizes="120px" quality={70} />
                    </span>
                    <span>
                      <span className="v-name">{v.name}</span>
                      <span className="v-role" style={{ display: "block" }}>{v.role}</span>
                    </span>
                  </figcaption>
                  <p className="v-text">{v.text}</p>
                </div>
              </div>
            </figure>
          ))}
          <div className="v-side" aria-hidden>
            {voices.map((_, i) => <span key={i} className={`v-tick ${i === active ? "on" : ""}`} />)}
          </div>
          <div className="v-arrow" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none"><path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          {touch && <p className="v-hint">Swipe or tap for the next card</p>}
        </div>
      </div>
    </section>
  );
}

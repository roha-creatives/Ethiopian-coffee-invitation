"use client";
import { useEffect, useRef, useState } from "react";
import type { ProgramItem } from "@/lib/event";
import { setupGsap, prefersReducedMotion } from "@/lib/anim";
import SecHead from "./SecHead";
import { ProgramIcon } from "./ProgramIcons";

/* Our own winding road: desktop and a taller phone version, each with loops.
   `at` = where each program stop sits along the road (0..1), on its flat stretches. */
const DESK = {
  w: 1616, h: 2187, stroke: 16,
  d: "M1601 15C1426.5 76.1 1334.9 290 1150 290C1036.5 290 958.2 377.8 855 425C811.8 444.8 792.8 495.8 812.6 539C832.4 582.2 883.4 601.2 926.6 581.4C969.8 561.6 988.8 510.6 969 467.4C949.2 424.2 898.2 405.2 855 425C751.8 472.2 672.3 543.2 560 560C408.3 582.8 170 606.6 170 760C170 988.4 571.6 930 800 930C1039.4 930 1460 870.6 1460 1110C1460 1262 1232 1320 1080 1320C964.1 1320 885 1411 780 1460C740 1478.7 692.4 1461.4 673.7 1421.3C655 1381.3 672.3 1333.7 712.3 1315C752.4 1296.3 800 1313.6 818.7 1353.7C837.3 1393.7 820 1441.3 780 1460C675 1509 595.3 1588.5 480 1600C349.3 1613.1 204.2 1751.2 230 1880C254.5 2002.5 138.6 2146.5 15 2165",
  at: [0.088, 0.283, 0.477, 0.678, 0.869],
};
const MOB = {
  w: 407, h: 2334, stroke: 20,
  d: "M430 12C326.5 48.2 324.7 240 215 240C125.7 240 70 360.7 70 450C70 537.4 117.6 660 205 660C297.8 660 345 792.2 345 885C345 978.7 293.7 1110 200 1110C152.2 1110 157.8 1188 135 1230C120.8 1256.2 88 1266 61.8 1251.8C35.6 1237.6 25.8 1204.8 40 1178.6C54.2 1152.3 87 1142.6 113.2 1156.8C139.5 1171 149.2 1203.8 135 1230C112.2 1272 70 1302.2 70 1350C70 1437.4 117.6 1560 205 1560C297.8 1560 345 1692.2 345 1785C345 1878.7 293.7 2010 200 2010C39.4 2010 13.8 2271.9 -140 2318",
  at: [0.096, 0.257, 0.428, 0.69, 0.861],
};

function Hole({ flip }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 33 38" fill="none" aria-hidden>
      <ellipse cx={flip ? 12.5 : 20.5} cy="34.5" rx="12.5" ry="3.5" fill="var(--ink)" />
      <ellipse cx={flip ? 20.5 : 12.46} cy="18" rx="12.44" ry="18" fill="var(--primary)" stroke="var(--ink)" />
      <ellipse cx={flip ? 18.5 : 14.5} cy="18" rx="9" ry="14.5" fill="var(--ink)" opacity=".35" />
    </svg>
  );
}

export default function Program({ items }: { items: ProgramItem[] }) {
  const body = useRef<HTMLDivElement>(null);
  const [mobile, setMobile] = useState(false);
  const [anchors, setAnchors] = useState<[number, number][]>([]);
  const road = mobile ? MOB : DESK;
  const H = road.h;
  const d = road.d;

  useEffect(() => {
    const mq = matchMedia("(max-width: 479px)");
    const set = () => setMobile(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  // place each stop exactly on the road
  useEffect(() => {
    const el = body.current;
    if (!el) return;
    const path = el.querySelector<SVGPathElement>(".svc-ghost path")!;
    const L = path.getTotalLength();
    setAnchors(road.at.map((f) => {
      const p = path.getPointAtLength(L * f);
      return [(p.x / road.w) * 100, (p.y / H) * 100];
    }));
  }, [mobile, road, H, d]);

  // scroll-scrubbed: the solid road draws down as you scroll, and undraws when you scroll back up
  useEffect(() => {
    const el = body.current;
    if (!el || !anchors.length) return;
    const { gsap, ScrollTrigger } = setupGsap();
    const reduced = prefersReducedMotion();
    const ctx = gsap.context(() => {
      const dark = el.querySelector<SVGPathElement>(".svc-dark path")!;
      const icons = gsap.utils.toArray<HTMLElement>(".svc-icon");
      const paras = gsap.utils.toArray<HTMLElement>(".svc-para");
      const times = gsap.utils.toArray<HTMLElement>(".svc-time");
      if (reduced) return;
      const widths = icons.map((ic) => ic.getBoundingClientRect().width);
      // use the true length: px values get rounded, so a 0..1 length would only ever be empty or full
      const len = dark.getTotalLength();
      gsap.set(dark, { strokeDasharray: len, strokeDashoffset: len });
      gsap.set(icons, { width: 0, scale: 0, opacity: 0, margin: 0 });
      gsap.set(paras, { scale: 0, rotation: 0, opacity: 0 });
      gsap.set(times, { scale: 0, rotation: 0, opacity: 0 });

      const tl = gsap.timeline({
        scrollTrigger: { trigger: el, start: "top 70%", end: "bottom 70%", scrub: 1.2, invalidateOnRefresh: true },
      });
      tl.to(dark, { strokeDashoffset: 0, ease: "none", duration: 1 }, 0);
      road.at.forEach((f, i) => {
        const t = Math.max(0, f - 0.04);
        tl.to(icons[i], { width: widths[i], scale: 1, opacity: 1, duration: 0.14, ease: "back.out(3.5)" }, t);
        tl.to(paras[i], { scale: 1, rotation: -5, opacity: 1, duration: 0.14, ease: "back.out(3.5)" }, t + 0.02);
        tl.to(times[i], { scale: 1, rotation: 4, opacity: 1, duration: 0.14, ease: "back.out(3.5)" }, t + 0.01);
      });
      requestAnimationFrame(() => ScrollTrigger.refresh());
    }, el);
    return () => ctx.revert();
  }, [anchors, road]);

  return (
    <section className="program" id="program">
      <SecHead label="The afternoon" heading="How it unfolds" />
      <div className="svc-body" ref={body} style={{ aspectRatio: `${road.w} / ${H}` }}>
        <svg className="svc-ghost" viewBox={`0 0 ${road.w} ${H}`} aria-hidden>
          <path d={d} strokeWidth={road.stroke} />
        </svg>
        <svg className="svc-dark" viewBox={`0 0 ${road.w} ${H}`} aria-hidden>
          <path d={d} strokeWidth={road.stroke} />
        </svg>
        {!mobile && <div className="svc-hole start"><Hole /></div>}
        {!mobile && <div className="svc-hole end"><Hole flip /></div>}
        <ol className="svc-list">
          {items.map((it, i) => (
            <li className="svc-block" key={i} style={anchors[i] ? { left: `${anchors[i][0]}%`, top: `${anchors[i][1]}%` } : { visibility: "hidden" }}>
              <span className="svc-time">{it.time}</span>
              <span className="svc-text l">{it.title[0]}</span>
              <span className="svc-icon"><ProgramIcon name={it.icon} /></span>
              <span className="svc-text r">{it.title[1] ?? ""}</span>
              <span className="svc-para"><p>{it.note}</p></span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

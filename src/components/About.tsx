"use client";
import { useEffect, useRef } from "react";
import { SplitText } from "gsap/SplitText";
import { setupGsap, prefersReducedMotion } from "@/lib/anim";

export default function About({ label, text, pills }: { label: string; text: string; pills: [string, string, string] }) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const { gsap } = setupGsap();
    gsap.registerPlugin(SplitText);
    const css = getComputedStyle(document.documentElement);
    const primary = css.getPropertyValue("--primary").trim() || "#24385c";
    const ink = css.getPropertyValue("--ink").trim() || "#0b1424";
    const faded = css.getPropertyValue("--accent").trim() || "#b5c4d8";

    const ctx = gsap.context(() => {
      const para = el.querySelector<HTMLElement>(".about-para")!;
      const split = new SplitText(para, { type: "words,chars", wordsClass: "about-word", charsClass: "about-char" });
      const chars = split.chars as HTMLElement[];
      const pillEls = gsap.utils.toArray<HTMLElement>(".about-pill");

      gsap.set(chars, { color: faded });
      // keep each pill's tilt (GSAP owns the transform, so the tilt is set here, not in CSS)
      pillEls.forEach((p) => gsap.set(p, { rotation: Number(p.dataset.rot || 0), opacity: 0, scale: 0.6, y: 24 }));

      const pinDistance = () => (innerWidth < 480 ? 1150 : innerWidth < 992 ? 1550 : 2200);
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: () => `+=${pinDistance()}`,
          pin: true,
          scrub: innerWidth < 992 ? 0.6 : 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
      const span = 85;
      chars.forEach((c, i) => {
        const at = (i / chars.length) * span;
        tl.to(c, {
          color: primary, scale: 1.12, rotation: gsap.utils.random(-4, 4),
          textShadow: `0.6px 0.6px 0 ${primary}, -0.6px -0.6px 0 ${primary}`, duration: 3.5, ease: "power1.out",
        }, at);
        tl.to(c, { color: ink, scale: 1, rotation: 0, textShadow: "0 0 0 transparent", duration: 3.5, ease: "power1.inOut" }, at + 3.5);
      });
      [35, 72, 96].forEach((at, i) => pillEls[i] && tl.to(pillEls[i], { opacity: 1, scale: 1, y: 0, duration: 6, ease: "back.out(2)" }, at));
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section className="about" ref={root} aria-label={label}>
      <div className="about-wrap">
        <p className="about-label">{label}</p>
        <div className="about-pinned">
          {/* pills live in the open space above and below the text, never on top of it */}
          <div className="about-pills top">
            <div className="about-pill" data-rot="-5"><span>{pills[0]}</span></div>
            <div className="about-pill" data-rot="4"><span>{pills[1]}</span></div>
          </div>
          <h2 className="about-para">{text}</h2>
          <div className="about-pills bottom">
            <div className="about-pill" data-rot="-3"><span>{pills[2]}</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}

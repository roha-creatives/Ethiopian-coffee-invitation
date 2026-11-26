"use client";
import { useEffect, useRef } from "react";
import { setupGsap, onReady, prefersReducedMotion } from "@/lib/anim";
import Image from "next/image";
import Walkers from "./Walkers";
import { Cta } from "./Header";

type Props = {
  heading: string;
  titleAm: string;
  slides: { src: string; alt: string; pos?: string; posWide?: string }[];
  marquee: string[];
  signs: { left: string; right: string };
};

const BAND = "M-120,500 C220,350 640,232 1000,214 C1190,205 1340,222 1560,250";

/**
 * Hero: a photo card whose images swipe up one over another (only the images move).
 * When the last photo has landed, the title, the button, the walkers with their signs
 * and the jebena come in; the curved band draws itself below.
 */
export default function Hero({ heading, titleAm, slides, marquee, signs }: Props) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const { gsap, ScrollTrigger } = setupGsap();
    const reduced = prefersReducedMotion();

    const ctx = gsap.context(() => {
      const band = el.querySelector<SVGPathElement>(".hero-marquee .band")!;
      const text = el.querySelector<SVGTextElement>(".hero-marquee text")!;
      const tp = el.querySelector<SVGTextPathElement>(".hero-marquee textPath")!;

      // endless text along the curve
      const n = Number(tp.dataset.repeat || 1);
      const unit = text.getComputedTextLength() / n;
      gsap.fromTo(tp, { attr: { startOffset: 0 } }, { attr: { startOffset: -unit }, duration: unit / 90, ease: "none", repeat: -1 });

      const slideEls = gsap.utils.toArray<HTMLElement>(".hero-slide");
      const imgs = slideEls.map((s) => s.querySelector("img")!);
      const copy = gsap.utils.toArray<HTMLElement>(".hero-copy > *");
      const stage = el.querySelector(".hero-stage");

      if (reduced) {
        gsap.set(slideEls, { clipPath: "inset(0% 0 0 0)" });
        return;
      }

      // start: only the first photo, everything else waits
      gsap.set(slideEls.slice(1), { clipPath: "inset(100% 0 0 0)" });
      gsap.set(imgs, { scale: 1.12 });
      gsap.set(copy, { opacity: 0, y: 26 });
      gsap.set(stage, { opacity: 0, y: 60 });
      const bandLen = band.getTotalLength();
      gsap.set(band, { strokeDasharray: bandLen, strokeDashoffset: -bandLen });
      gsap.set(text, { opacity: 0 });

      const tl = gsap.timeline({ paused: true });
      tl.to(imgs[0], { scale: 1, duration: 1.6, ease: "power2.out" }, 0);
      slideEls.slice(1).forEach((s, i) => {
        const at = 1.1 + i * 1.35;
        // the next photo wipes up from the bottom and settles, the previous one sinks a little
        tl.to(s, { clipPath: "inset(0% 0 0 0)", duration: 1.05, ease: "expo.inOut" }, at)
          .fromTo(imgs[i + 1], { yPercent: 18, scale: 1.18 }, { yPercent: 0, scale: 1, duration: 1.3, ease: "expo.out" }, at + 0.05)
          .to(imgs[i], { yPercent: -10, duration: 1.05, ease: "expo.inOut" }, at);
      });
      const end = 1.1 + (slideEls.length - 1) * 1.35 + 0.7;
      tl.to(copy, { opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: "back.out(1.6)" }, end)
        .to(stage, { opacity: 1, y: 0, duration: 1, ease: "power3.out" }, end + 0.25)
        .to(band, { strokeDashoffset: 0, duration: 1.3, ease: "power2.out" }, end + 0.4)
        .to(text, { opacity: 1, duration: 0.4 }, end + 1.1);

      onReady(() => {
        // if the hero is already scrolled past, skip straight to the end
        if (window.scrollY > el.offsetHeight * 0.6) tl.progress(1);
        else tl.play();
        ScrollTrigger.refresh();
      });
    }, el);

    return () => ctx.revert();
  }, []);

  const unitText = marquee.join("   •   ") + "   •   ";
  const repeat = 4;

  return (
    <section className="hero" ref={root} id="top">
      <div className="hero-wrap">
        <div className="hero-card">
          {slides.map((s, i) => (
            <div className="hero-slide" key={s.src} style={{ zIndex: i + 1 }}>
              <Image
                src={s.src}
                alt={s.alt}
                fill
                // card is full width on phones, max ~1400px on desktop
                sizes="(max-width: 1440px) 100vw, 1440px"
                quality={72}
                priority={i === 0}
                loading={i === 0 ? undefined : "eager"}
                style={{ "--pos": s.pos ?? "50% 50%", "--pos-wide": s.posWide ?? s.pos ?? "50% 50%" } as React.CSSProperties}
              />
            </div>
          ))}
          <div className="hero-shade" aria-hidden />
          <div className="hero-copy">
            <p className="hero-am" lang="am">{titleAm}</p>
            <h1 className="hero-heading display">{heading}</h1>
            <div className="hero-cta"><Cta href="#rsvp" className="light">Reserve now</Cta></div>
          </div>
        </div>

        <div className="hero-stage">
          <Walkers left={signs.left} right={signs.right} />
        </div>
      </div>

      <div className="hero-marquee" aria-hidden>
        <svg viewBox="0 0 1440 560">
          <defs>
            {/* separate path for the text: pathLength would rescale startOffset */}
            <path id="band-text" d={BAND} />
          </defs>
          <path className="band" d={BAND} strokeWidth={150} />
          <text fontSize="96" dy="34">
            <textPath href="#band-text" data-repeat={repeat} startOffset="0">
              {unitText.repeat(repeat)}
            </textPath>
          </text>
        </svg>
      </div>
    </section>
  );
}

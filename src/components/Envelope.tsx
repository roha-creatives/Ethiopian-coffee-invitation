"use client";
import { useEffect, useRef, useState } from "react";
import { markReady, prefersReducedMotion, setupGsap } from "@/lib/anim";
import { startMusicEvent } from "./AmbientMusic";

/**
 * Opening screen: brand logo, an envelope sealed with a turning "sini" (coffee cup) stamp.
 * Tapping the sini (or the button) presses the seal, swings the flap open in 3D (the seal
 * goes with it), slides the card out of the pocket and brings it to the centre of the screen.
 */
export default function Envelope({ host, card, logo, sini, ring }: {
  host: string; card: string; logo: string; sini: string; ring: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);
  const opened = useRef(false);

  const finish = () => {
    document.body.classList.remove("is-locked");
    window.scrollTo(0, 0);
    try { sessionStorage.setItem("envelope-opened", "1"); } catch {}
    root.current?.classList.add("gone");
    markReady();
    setTimeout(() => setGone(true), 900);
  };

  useEffect(() => {
    const skip = new URLSearchParams(location.search).get("open") === "1" ||
      (() => { try { return sessionStorage.getItem("envelope-opened") === "1"; } catch { return false; } })();
    if (skip) { opened.current = true; finish(); return; }
    document.body.classList.add("is-locked");
    // gentle entrance
    const el = root.current!;
    if (!prefersReducedMotion()) {
      const { gsap } = setupGsap();
      gsap.from(el.querySelector(".intro-logo"), { y: -20, opacity: 0, duration: 0.9, ease: "power3.out", delay: 0.1 });
      gsap.from(el.querySelector(".env"), { y: 60, rotation: -4, opacity: 0, duration: 1.1, ease: "power3.out", delay: 0.2 });
      gsap.from(el.querySelector(".intro-cta"), { y: 16, opacity: 0, duration: 0.8, ease: "power3.out", delay: 0.7 });
    }
    return () => document.body.classList.remove("is-locked");
  }, []);

  const open = () => {
    if (opened.current) return;
    opened.current = true;
    window.dispatchEvent(new Event(startMusicEvent)); // the tap lets the browser start the music
    if (prefersReducedMotion()) return finish();
    const { gsap } = setupGsap();
    const el = root.current!;
    const env = el.querySelector<HTMLElement>(".env")!;
    const flap = el.querySelector<HTMLElement>(".env-flap")!;
    const seal = el.querySelector<HTMLElement>(".env-seal")!;
    const cardEl = el.querySelector<HTMLElement>(".env-card")!;
    const wrap = el.querySelector<HTMLElement>(".env-cardwrap")!;
    const parts = el.querySelectorAll<HTMLElement>(".env-back, .env-pocket, .env-flap");
    const w = env.offsetWidth;

    env.classList.add("opening");
    const tl = gsap.timeline({ onComplete: finish });
    tl.to(".intro-cta, .intro-note", { opacity: 0, y: 10, duration: 0.3, ease: "power2.in" }, 0)
      // press the seal
      .to(seal, { scale: 0.88, duration: 0.14, ease: "power2.in" }, 0)
      .to(seal, { scale: 1.06, duration: 0.22, ease: "back.out(3)" }, 0.14)
      // flap swings open in 3D, carrying the seal; it passes behind the card at 90°
      .to(flap, { rotateX: 180, duration: 0.95, ease: "power2.inOut" }, 0.32)
      .to(seal, { opacity: 0, duration: 0.12 }, 0.72)
      .set(flap, { zIndex: 1 }, 0.78)
      .to(env, { y: 8, duration: 0.25, ease: "power1.out" }, 0.9)
      .to(env, { y: 0, duration: 0.5, ease: "power2.out" }, 1.15)
      // card eases out of the pocket
      .to(cardEl, { y: -w * 0.98, duration: 1.15, ease: "power3.inOut" }, 1.1)
      .add(() => {
        // free the card from the pocket clip, then fly it to the centre
        wrap.style.clipPath = "none";
        const r = cardEl.getBoundingClientRect();
        const k = Math.min((innerHeight * 0.78) / r.height, (innerWidth * 0.84) / r.width, 1.6);
        const dx = innerWidth / 2 - (r.left + r.width / 2);
        const dy = innerHeight / 2 - (r.top + r.height / 2);
        gsap.timeline()
          .to(parts, { y: "75vh", opacity: 0, duration: 0.9, ease: "power2.in" }, 0)
          .fromTo(cardEl, { rotation: -3 }, { x: dx, y: `+=${dy}`, scale: k, rotation: 0, duration: 1.05, ease: "power3.inOut" }, 0.05)
          .to(cardEl, { boxShadow: "0 40px 80px -30px rgba(11,20,36,.55)", duration: 0.8 }, 0.1);
      }, 2.3)
      .to({}, { duration: 1.45 }); // hold on the card for a beat
  };

  if (gone) return null;
  return (
    <div className="intro" ref={root} role="dialog" aria-label={`Invitation from ${host}`}>
      <div className="intro-light" aria-hidden />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="intro-logo" src={logo} alt={host} width={286} height={278} fetchPriority="high" />

      <div className="env" onClick={open}>
        <div className="env-back" />
        <div className="env-cardwrap"><div className="env-card" style={{ backgroundImage: `url(${card})` }} /></div>
        <div className="env-pocket">
          <p className="env-to"><b>You&apos;re invited</b></p>
        </div>
        <div className="env-flap">
          <i className="flap-front" />
          <i className="flap-inside" />
          {/* decorative tap area — the "Tap the sini to open" button below is the accessible control */}
          <div className="env-seal" aria-hidden onClick={(e) => { e.stopPropagation(); open(); }}>
            <svg className="seal-ring" viewBox="0 0 120 120" aria-hidden>
              <defs><path id="seal-circle" d="M60,60 m-49,0 a49,49 0 1,1 98,0 a49,49 0 1,1 -98,0" /></defs>
              <text><textPath href="#seal-circle" textLength="300" lengthAdjust="spacingAndGlyphs">{ring}</textPath></text>
            </svg>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="seal-cup" src={sini} alt="" width={240} height={240} />
          </div>
        </div>
      </div>

      <button className="intro-cta" onClick={open}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={sini} alt="" width={34} height={34} />
        <span>Tap the sini to open</span>
      </button>
      <button className="intro-note" onClick={() => { opened.current = true; window.dispatchEvent(new Event(startMusicEvent)); finish(); }}>Skip</button>
    </div>
  );
}

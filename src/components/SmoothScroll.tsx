"use client";
import { useEffect } from "react";
import Lenis from "lenis";
import { setupGsap, prefersReducedMotion } from "@/lib/anim";

/**
 * Scrolling glue.
 * - Mouse/trackpad: Lenis smooth scrolling, synced with GSAP ScrollTrigger.
 * - Touch screens: the phone's own native scrolling (smoother, cheaper on battery).
 * Always: smooth in-page anchors, and re-measuring scroll animations when the page changes size.
 */
export default function SmoothScroll() {
  useEffect(() => {
    const { gsap, ScrollTrigger } = setupGsap();
    const reduced = prefersReducedMotion();
    const touch = matchMedia("(pointer: coarse)").matches;
    const lenis = reduced || touch ? null : new Lenis({ lerp: 0.1, smoothWheel: true });

    let tick: ((t: number) => void) | null = null;
    if (lenis) {
      (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
      lenis.on("scroll", ScrollTrigger.update);
      tick = (t: number) => lenis.raf(t * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    }

    // smooth in-page anchors
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href")!;
      const target = id === "#top" ? document.body : document.querySelector<HTMLElement>(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(id === "#top" ? 0 : target, { offset: 0, duration: 1.4 });
      else target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    };
    document.addEventListener("click", onClick);

    // Re-measure every scroll animation whenever the page's real scroll length changes.
    // (While the envelope is shown the page is locked, so positions measured then are wrong —
    // without this the program road would fill all at once instead of following the scroll.)
    let refreshTimer = 0;
    let lastH = 0;
    const refresh = () => {
      clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        lenis?.resize();
        ScrollTrigger.refresh();
        lastH = document.documentElement.scrollHeight;
      }, 120);
    };
    const ro = new ResizeObserver(() => {
      if (Math.abs(document.documentElement.scrollHeight - lastH) > 2) refresh();
    });
    ro.observe(document.body);
    document.fonts?.ready.then(refresh);
    window.addEventListener("load", refresh);

    // lock while the envelope / mobile menu is open
    let wasLocked = document.body.classList.contains("is-locked");
    const mo = new MutationObserver(() => {
      const locked = document.body.classList.contains("is-locked") || document.documentElement.classList.contains("menu-lock");
      if (lenis) { if (locked) lenis.stop(); else lenis.start(); }
      const envLocked = document.body.classList.contains("is-locked");
      if (wasLocked && !envLocked) requestAnimationFrame(refresh); // envelope just opened
      wasLocked = envLocked;
    });
    mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    if (wasLocked) lenis?.stop();

    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("load", refresh);
      clearTimeout(refreshTimer);
      ro.disconnect();
      mo.disconnect();
      if (tick) gsap.ticker.remove(tick);
      lenis?.destroy();
    };
  }, []);
  return null;
}

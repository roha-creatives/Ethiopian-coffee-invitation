"use client";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;
export function setupGsap() {
  if (!registered && typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
    registered = true;
  }
  return { gsap, ScrollTrigger };
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Fires once the envelope has been opened (or skipped). */
export const READY_EVENT = "invite:ready";
export function onReady(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const w = window as unknown as { __inviteReady?: boolean };
  if (w.__inviteReady) {
    cb();
    return () => {};
  }
  window.addEventListener(READY_EVENT, cb, { once: true });
  return () => window.removeEventListener(READY_EVENT, cb);
}
export function markReady() {
  (window as unknown as { __inviteReady?: boolean }).__inviteReady = true;
  window.dispatchEvent(new Event(READY_EVENT));
}

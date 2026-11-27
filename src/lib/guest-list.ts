import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { serverSecret } from "./sheets";

/** "0911 22 33 44", "+251911223344", "911223344" → "+251911223344" (null if not an Ethiopian mobile). */
export function normalizePhone(input: unknown): string | null {
  const digits = String(input ?? "").replace(/\D/g, "").replace(/^251/, "").replace(/^0/, "");
  return /^[79]\d{8}$/.test(digits) ? "+251" + digits : null;
}

const words = (s: string) => s.toLowerCase().normalize("NFC").replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);

/**
 * Same person? Every word of the shorter name must start a word of the longer one, in order:
 * "Selam" ≈ "Selam Bekele", "selam b." ≈ "Selam Bekele", but "Selam Tadesse" ≠ "Selam Bekele".
 */
export function sameName(a: string, b: string) {
  let x = words(a), y = words(b);
  if (!x.length || !y.length) return false;
  if (x.length > y.length) [x, y] = [y, x];
  let j = 0;
  for (const w of x) {
    while (j < y.length && !y[j].startsWith(w)) j++;
    if (j === y.length) return false;
    j++;
  }
  return true;
}

const ALPHA = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function newPassCode(taken: Set<string>) {
  for (;;) {
    let s = "";
    for (let i = 0; i < 12; i++) s += ALPHA[randomInt(ALPHA.length)];
    const code = `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8)}`;
    if (!taken.has(code)) return code;
  }
}
export const isPassCode = (s: string) => /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(s);

// ---------- gate staff session ----------
export const GATE_COOKIE = "gate";
export const GATE_SESSION_SECONDS = 60 * 60 * 36; // a staff phone stays signed in for 36 hours

const sign = (exp: number) =>
  createHmac("sha256", serverSecret()).update(`gate:${process.env.GATE_PIN || ""}:${exp}`).digest("hex");

export function pinMatches(pin: string) {
  const expected = process.env.GATE_PIN;
  if (!expected) return false;
  const a = Buffer.from(String(pin)), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Signed, expiring session value: "<expiry>.<signature>". Changing GATE_PIN or GATE_SECRET signs everyone out. */
export function gateCookieValue() {
  const exp = Math.floor(Date.now() / 1000) + GATE_SESSION_SECONDS;
  return `${exp}.${sign(exp)}`;
}

/** True when the request comes from a signed-in gate staff phone. */
export async function isStaff() {
  if (!process.env.GATE_PIN) return false;
  const v = (await cookies()).get(GATE_COOKIE)?.value ?? "";
  const [expStr, sig = ""] = v.split(".");
  const exp = Number(expStr);
  if (!exp || exp < Date.now() / 1000) return false;
  const a = Buffer.from(sig), b = Buffer.from(sign(exp));
  return a.length === b.length && timingSafeEqual(a, b);
}

// ---------- PIN guessing limit (best effort, per server instance) ----------
const attempts = new Map<string, { n: number; until: number }>();
const MAX_TRIES = 5, WINDOW_MS = 15 * 60 * 1000;

/** Returns false when this address has had too many wrong PINs recently. */
export function pinAllowed(ip: string) {
  const a = attempts.get(ip);
  return !a || a.until < Date.now() || a.n < MAX_TRIES;
}
export function pinFailed(ip: string) {
  const a = attempts.get(ip);
  if (!a || a.until < Date.now()) attempts.set(ip, { n: 1, until: Date.now() + WINDOW_MS });
  else a.n++;
}
export const pinSucceeded = (ip: string) => attempts.delete(ip);

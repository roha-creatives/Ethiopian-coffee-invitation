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

/** Same person? People type their names differently ("Abebe K." vs "abebe kebede"), so be forgiving. */
export function sameName(a: string, b: string) {
  const x = words(a), y = words(b);
  if (!x.length || !y.length) return false;
  if (x[0] === y[0]) return true;
  const jx = x.join(""), jy = y.join("");
  return jx.includes(jy) || jy.includes(jx);
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
const gateToken = () => createHmac("sha256", serverSecret()).update("gate:" + (process.env.GATE_PIN || "")).digest("hex");

export function pinMatches(pin: string) {
  const expected = process.env.GATE_PIN;
  if (!expected) return false;
  const a = Buffer.from(String(pin)), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const gateCookieValue = () => gateToken();

/** True when the request comes from a signed-in gate staff phone. */
export async function isStaff() {
  if (!process.env.GATE_PIN) return false;
  const v = (await cookies()).get(GATE_COOKIE)?.value;
  if (!v) return false;
  const a = Buffer.from(v), b = Buffer.from(gateToken());
  return a.length === b.length && timingSafeEqual(a, b);
}

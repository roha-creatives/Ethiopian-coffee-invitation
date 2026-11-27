import { NextResponse } from "next/server";
import { GATE_COOKIE, GATE_SESSION_SECONDS, gateCookieValue, pinMatches, pinAllowed, pinFailed, pinSucceeded } from "@/lib/guest-list";

/** Gate staff sign in with the PIN (GATE_PIN env). 5 wrong tries → locked for 15 minutes. */
export async function POST(req: Request) {
  if (!process.env.GATE_PIN) return NextResponse.json({ error: "Gate PIN is not set up." }, { status: 503 });
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
  if (!pinAllowed(ip)) return NextResponse.json({ error: "Too many wrong tries. Wait 15 minutes." }, { status: 429 });
  const { pin } = (await req.json().catch(() => ({}))) as { pin?: string };
  if (!pin || !pinMatches(pin)) {
    pinFailed(ip);
    await new Promise((r) => setTimeout(r, 1000)); // slow down guessing
    return NextResponse.json({ error: "Wrong PIN." }, { status: 401 });
  }
  pinSucceeded(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(GATE_COOKIE, gateCookieValue(), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" /* "strict" could drop the cookie when a link opens from the camera app */, path: "/", maxAge: GATE_SESSION_SECONDS,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(GATE_COOKIE);
  return res;
}

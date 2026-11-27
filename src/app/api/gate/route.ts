import { NextResponse } from "next/server";
import { GATE_COOKIE, gateCookieValue, pinMatches } from "@/lib/guest-list";

/** Gate staff sign in with the PIN (GATE_PIN env). The phone then keeps a signed cookie for 2 days. */
export async function POST(req: Request) {
  const { pin } = (await req.json().catch(() => ({}))) as { pin?: string };
  if (!process.env.GATE_PIN) return NextResponse.json({ error: "Gate PIN is not set up." }, { status: 503 });
  if (!pin || !pinMatches(pin)) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return NextResponse.json({ error: "Wrong PIN." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(GATE_COOKIE, gateCookieValue(), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 48,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(GATE_COOKIE);
  return res;
}

import { NextResponse } from "next/server";
import { randomInt } from "node:crypto";
import { getGuest, GENERAL_LINKS } from "@/lib/event";

/**
 * Demo RSVP endpoint. In production this proxies to the Nest API:
 *   POST /public/invitations/:token/rsvp
 *   POST /public/links/:code/rsvp
 * Nothing is persisted here.
 */
const ALPHA = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function passCode() {
  let s = "";
  for (let i = 0; i < 12; i++) s += ALPHA[randomInt(ALPHA.length)];
  return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8)}`;
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const attending = body.attending === "yes" ? "yes" : body.attending === "no" ? "no" : null;
  if (!attending) return NextResponse.json({ error: "Please let us know if you can come." }, { status: 422 });
  const note = typeof body.note === "string" ? body.note.slice(0, 500) : "";

  // name + phone are asked of every guest (personal and general links)
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 80) : "";
  if (name.length < 2) return NextResponse.json({ error: "Please enter your full name." }, { status: 422 });
  const digits = String(body.phone ?? "").replace(/\D/g, "").replace(/^251/, "").replace(/^0/, "");
  if (!/^[79]\d{8}$/.test(digits)) return NextResponse.json({ error: "Please enter a valid Ethiopian phone number (9XX XXX XXX or 7XX XXX XXX)." }, { status: 422 });
  const phone = "+251" + digits;

  let max = 1;
  let approval = false;
  if (typeof body.token === "string") {
    const g = getGuest(body.token);
    if (!g) return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
    max = g.maxParty;
  } else if (typeof body.code === "string" && GENERAL_LINKS[body.code]) {
    const link = GENERAL_LINKS[body.code];
    max = link.maxPerRequest;
    approval = link.mode === "approval";
  } else {
    return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
  }

  const seats = attending === "yes" ? Math.min(max, Math.max(1, Number(body.seats) || 1)) : 0;
  const status = attending === "no" ? "declined" : approval ? "pending_approval" : "confirmed";
  return NextResponse.json({
    status,
    name,
    phone,
    seats,
    note,
    passCode: status === "confirmed" ? (typeof body.passCode === "string" && /^[A-Z0-9-]{14}$/.test(body.passCode) ? body.passCode : passCode()) : null,
  });
}

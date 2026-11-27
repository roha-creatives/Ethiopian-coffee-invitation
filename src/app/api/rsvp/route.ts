import { NextResponse } from "next/server";
import { EVENT } from "@/lib/event";
import { allRows, appendRow, updateRow, addisNow } from "@/lib/sheets";
import { normalizePhone, sameName, newPassCode } from "@/lib/guest-list";

/**
 * RSVP → one row in the guest-list Google Sheet.
 * The phone number identifies a guest:
 *   - new phone                         → saved; "yes" gets a pass code
 *   - same phone, same person, said yes → "already reserved" + their existing pass (lost passes come back)
 *   - same phone, said no before, now yes → row updated, pass issued
 *   - same phone, different name        → refused (nobody can fetch someone else's pass)
 */
export const dynamic = "force-dynamic";

const fail = (error: string, status = 422) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  if (Date.now() >= Date.parse(EVENT.rsvpClosesAt)) return fail("RSVP is closed.", 410);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid request", 400);
  }
  // hidden field real people never fill in
  if (typeof body.website === "string" && body.website) return fail("Invalid request", 400);

  const attending = body.attending === "yes" ? "Yes" : body.attending === "no" ? "No" : null;
  if (!attending) return fail("Please let us know if you can come.");
  const name = typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ").slice(0, 80) : "";
  if (name.length < 2) return fail("Please enter your full name.");
  const phone = normalizePhone(body.phone);
  if (!phone) return fail("Please enter a valid Ethiopian phone number (9XX XXX XXX or 7XX XXX XXX).");
  // a leading = + - @ would make the sheet treat the note as a formula if someone re-enters it
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 500).replace(/^[=+\-@]+/, "") : "";

  try {
    const rows = await allRows();
    const existing = rows.find((r) => normalizePhone(r.phone) === phone);
    const taken = new Set(rows.map((r) => r.passCode).filter(Boolean));

    if (existing) {
      if (!sameName(existing.name, name)) {
        return fail("This phone number is already registered under another name. If that's you, please use the name you registered with.", 409);
      }
      if (existing.coming === "Yes") {
        if (!existing.passCode) { // added by hand in the sheet without a code
          existing.passCode = newPassCode(taken);
          await updateRow(existing);
        }
        return NextResponse.json({ status: "confirmed", already: true, name: existing.name, phone, passCode: existing.passCode });
      }
      if (attending === "No") {
        return NextResponse.json({ status: "declined", already: true, name: existing.name, phone, passCode: null });
      }
      // said no before, now coming
      const updated = { ...existing, coming: "Yes" as const, time: addisNow(), note: note || existing.note, passCode: newPassCode(taken) };
      await updateRow(updated);
      return NextResponse.json({ status: "confirmed", already: false, name: updated.name, phone, passCode: updated.passCode });
    }

    const passCode = attending === "Yes" ? newPassCode(taken) : "";
    await appendRow({ time: addisNow(), name, phone, coming: attending, note, passCode, checkedInAt: "" });
    return NextResponse.json({
      status: attending === "Yes" ? "confirmed" : "declined",
      already: false,
      name,
      phone,
      passCode: passCode || null,
    });
  } catch (err) {
    console.error("[rsvp]", err);
    return fail("We couldn't save your reply right now. Please try again in a minute.", 503);
  }
}

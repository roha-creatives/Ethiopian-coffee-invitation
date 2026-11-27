import { NextResponse } from "next/server";
import { EVENT } from "@/lib/event";
import { allRows, appendRow, updateRow, addisNow } from "@/lib/sheets";
import { normalizePhone, sameName, newPassCode } from "@/lib/guest-list";

/**
 * RSVP → one row in the guest-list Google Sheet.
 * Same name + same phone as an earlier reply → no new row, the guest quietly gets the same pass back
 * (so a lost pass can be recovered). Anything else is a new row. The reply never says whether a phone
 * number is already on the list, so nobody can use the form to find out who is coming.
 *   - said no before, now yes → that row is updated and a pass issued
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
  if (!attending) return fail("Please choose Yes or No.");
  const name = typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ").slice(0, 80) : "";
  if (name.length < 2) return fail("Please enter your name.");
  const phone = normalizePhone(body.phone);
  if (!phone) return fail(String(body.phone ?? "").trim() ? "Please check your phone number, e.g. 0911 234 567." : "Please enter your phone number.");
  // a leading = + - @ would make the sheet treat the note as a formula if someone re-enters it
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 500).replace(/^[=+\-@]+/, "") : "";

  try {
    const rows = await allRows({ maxAgeMs: 0 }); // always fresh: decides whether to add a row
    const existing = rows.find((r) => normalizePhone(r.phone) === phone && sameName(r.name, name));
    const taken = new Set(rows.map((r) => r.passCode).filter(Boolean));

    if (existing) {
      if (existing.coming === "Yes") {
        if (!existing.passCode) { // added by hand in the sheet without a code
          existing.passCode = newPassCode(taken);
          await updateRow(existing);
        }
        return NextResponse.json({ status: "confirmed", name: existing.name, phone, passCode: existing.passCode });
      }
      if (attending === "No") {
        return NextResponse.json({ status: "declined", name: existing.name, phone, passCode: null });
      }
      // said no before, now coming
      const updated = { ...existing, coming: "Yes" as const, time: addisNow(), note: note || existing.note, passCode: newPassCode(taken) };
      await updateRow(updated);
      return NextResponse.json({ status: "confirmed", name: updated.name, phone, passCode: updated.passCode });
    }

    const passCode = attending === "Yes" ? newPassCode(taken) : "";
    await appendRow({ time: addisNow(), name, phone, coming: attending, note, passCode, checkedInAt: "" });
    return NextResponse.json({
      status: attending === "Yes" ? "confirmed" : "declined",
      name,
      phone,
      passCode: passCode || null,
    });
  } catch (err) {
    console.error("[rsvp]", err);
    return fail("Sorry, we couldn't save your reply. Please try again in a minute.", 503);
  }
}

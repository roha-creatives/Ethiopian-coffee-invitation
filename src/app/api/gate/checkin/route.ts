import { NextResponse } from "next/server";
import { allRows, updateRow, addisNow } from "@/lib/sheets";
import { isStaff, isPassCode } from "@/lib/guest-list";

export const dynamic = "force-dynamic";

/** Mark a pass as used. A second scan of the same pass says when it was already used. */
export async function POST(req: Request) {
  if (!(await isStaff())) return NextResponse.json({ error: "Staff only. Sign in at /gate." }, { status: 401 });
  const { code } = (await req.json().catch(() => ({}))) as { code?: string };
  const c = String(code ?? "").trim().toUpperCase();
  if (!isPassCode(c)) return NextResponse.json({ error: "Invalid pass code." }, { status: 422 });
  try {
    // the pass page usually read the sheet a moment ago, so this is often just one write
    const row = (await allRows({ maxAgeMs: 8000 })).find((r) => r.passCode === c);
    if (!row || row.coming !== "Yes") return NextResponse.json({ error: "Pass not found." }, { status: 404 });
    if (row.checkedInAt) return NextResponse.json({ already: true, name: row.name, checkedInAt: row.checkedInAt });
    row.checkedInAt = addisNow();
    await updateRow(row);
    return NextResponse.json({ already: false, name: row.name, checkedInAt: row.checkedInAt });
  } catch (err) {
    console.error("[checkin]", err);
    return NextResponse.json({ error: "Couldn't reach the guest list. Try again." }, { status: 503 });
  }
}

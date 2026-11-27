import { NextResponse } from "next/server";
import { allRows } from "@/lib/sheets";
import { isStaff, normalizePhone } from "@/lib/guest-list";

export const dynamic = "force-dynamic";

/** Staff look-up by name, phone or pass code (backup when a guest can't show the QR) + live counts. */
export async function GET(req: Request) {
  if (!(await isStaff())) return NextResponse.json({ error: "Staff only." }, { status: 401 });
  const q = (new URL(req.url).searchParams.get("q") || "").trim().toLowerCase();
  try {
    const rows = (await allRows()).filter((r) => r.coming === "Yes");
    const stats = { confirmed: rows.length, checkedIn: rows.filter((r) => r.checkedInAt).length };
    if (q.length < 2) return NextResponse.json({ stats, results: [] });
    const qPhone = q.replace(/\D/g, "").replace(/^251/, "").replace(/^0/, "");
    const results = rows
      .filter((r) =>
        r.name.toLowerCase().includes(q) ||
        r.passCode.toLowerCase().replace(/-/g, "").includes(q.replace(/-/g, "")) ||
        (qPhone.length >= 3 && (normalizePhone(r.phone) ?? r.phone).includes(qPhone)))
      .slice(0, 20)
      .map((r) => ({ name: r.name, phone: r.phone, passCode: r.passCode, checkedInAt: r.checkedInAt }));
    return NextResponse.json({ stats, results });
  } catch (err) {
    console.error("[gate search]", err);
    return NextResponse.json({ error: "Couldn't reach the guest list." }, { status: 503 });
  }
}

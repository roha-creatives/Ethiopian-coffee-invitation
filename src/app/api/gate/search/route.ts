import { NextResponse } from "next/server";
import { allRows } from "@/lib/sheets";
import { isStaff, normalizePhone } from "@/lib/guest-list";

export const dynamic = "force-dynamic";

/**
 * Staff search. The guest list never leaves the server: only the few guests matching the query are
 * returned, with the phone number shortened to its last 4 digits. Staff session required.
 */
const phoneKey = (s: string) => s.replace(/\D/g, "").replace(/^251/, "").replace(/^0+/, "");
const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(req: Request) {
  if (!(await isStaff())) return NextResponse.json({ error: "Staff only." }, { status: 401, headers: NO_STORE });
  const q = (new URL(req.url).searchParams.get("q") || "").trim().toLowerCase().slice(0, 40);
  try {
    const rows = (await allRows({ maxAgeMs: 15000 })).filter((r) => r.coming === "Yes" && r.passCode);
    const stats = { confirmed: rows.length, checkedIn: rows.filter((r) => r.checkedInAt).length };
    let results: { name: string; phone: string; passCode: string; checkedInAt: string }[] = [];
    if (q.length >= 2) {
      const code = q.replace(/[\s-]/g, "").toUpperCase();
      const isPhone = /^[\d\s+()-]+$/.test(q);
      const k = isPhone ? phoneKey(q) : "";
      results = rows
        .filter((r) =>
          r.name.toLowerCase().includes(q) ||
          (code.length >= 3 && r.passCode.replace(/-/g, "").includes(code)) ||
          (isPhone && k.length >= 3 && phoneKey(normalizePhone(r.phone) ?? r.phone).includes(k)))
        .slice(0, 10)
        .map((r) => ({ name: r.name, phone: "••• " + phoneKey(r.phone).slice(-4), passCode: r.passCode, checkedInAt: r.checkedInAt }));
    }
    return NextResponse.json({ stats, results }, { headers: NO_STORE });
  } catch (err) {
    console.error("[gate search]", err);
    return NextResponse.json({ error: "Couldn't reach the guest list." }, { status: 503, headers: NO_STORE });
  }
}

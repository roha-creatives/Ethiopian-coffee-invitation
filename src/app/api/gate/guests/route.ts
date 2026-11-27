import { NextResponse } from "next/server";
import { allRows } from "@/lib/sheets";
import { isStaff } from "@/lib/guest-list";

export const dynamic = "force-dynamic";

/** The reserved guests, sent once to the gate phone so search there is instant. */
export async function GET() {
  if (!(await isStaff())) return NextResponse.json({ error: "Staff only." }, { status: 401 });
  try {
    const guests = (await allRows())
      .filter((r) => r.coming === "Yes" && r.passCode)
      .map((r) => ({ name: r.name, phone: r.phone, passCode: r.passCode, checkedInAt: r.checkedInAt }));
    return NextResponse.json({ guests });
  } catch (err) {
    console.error("[gate guests]", err);
    return NextResponse.json({ error: "Couldn't reach the guest list." }, { status: 503 });
  }
}

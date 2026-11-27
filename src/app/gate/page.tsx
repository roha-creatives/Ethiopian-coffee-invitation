import type { Metadata } from "next";
import { isStaff } from "@/lib/guest-list";
import { PinForm, GateHome } from "@/components/GateTools";

/** Gate staff page: sign in once with the PIN, then scan guests' QR codes with the phone camera. */
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Gate", robots: { index: false, follow: false } };

export default async function Gate() {
  const staff = await isStaff();
  return (
    <main className="pass-page">
      <h1 className="gate-title">Gate check-in</h1>
      {staff ? <GateHome /> : <PinForm />}
    </main>
  );
}

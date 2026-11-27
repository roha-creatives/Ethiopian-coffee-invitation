import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { headers } from "next/headers";
import { EVENT } from "@/lib/event";
import { allRows } from "@/lib/sheets";
import { isPassCode, isStaff } from "@/lib/guest-list";
import { CheckIn } from "@/components/GateTools";

/**
 * The page a pass QR opens (any phone camera).
 *  - Guest: sees their pass.
 *  - Gate staff (signed in at /gate): sees the guest + a Check in button; second scans are flagged.
 */
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Entry pass", robots: { index: false, follow: false } };

type Props = { params: Promise<{ code: string }> };

export default async function PassPage({ params }: Props) {
  const code = decodeURIComponent((await params).code).toUpperCase();
  const staff = await isStaff();
  let row = null;
  let error = "";
  if (isPassCode(code)) {
    try {
      row = (await allRows()).find((r) => r.passCode === code && r.coming === "Yes") ?? null;
    } catch (e) {
      console.error("[pass]", e);
      error = "Couldn't load the guest list. Please try again.";
    }
  }
  const qr = row ? await QRCode.toString(`${await siteUrl()}/p/${code}`, { type: "svg", margin: 0, color: { dark: "#0b1424", light: "#fbfbfb" } }) : "";

  return (
    <main className="pass-page">
      <Image src={EVENT.brand.logoNavy} alt={EVENT.title} width={120} height={80} className="pass-page-logo" priority />
      {staff && (
        <div className={`gate-result ${row ? (row.checkedInAt ? "warn" : "ok") : "bad"}`}>
          {row ? <CheckIn code={code} name={row.name} checkedInAt={row.checkedInAt} /> : <p><b>✕ Not a valid pass</b>{error && <><br />{error}</>}</p>}
        </div>
      )}
      {row ? (
        <div className="pass">
          <div className="pass-top">
            <p className="pass-label">Entry pass · {EVENT.host}</p>
            <p className="pass-name">{row.name}</p>
            <div className="pass-meta"><span>{EVENT.dateShort}</span><span>{EVENT.venue.name}</span></div>
          </div>
          <div className="pass-cut" aria-hidden />
          <div className="pass-bottom">
            <div className="qr" role="img" aria-label="Entry QR code" dangerouslySetInnerHTML={{ __html: qr }} />
            <span className="pass-code">{code}</span>
            {!staff && <p className="pass-hint">Show this at the entrance.</p>}
          </div>
        </div>
      ) : !staff ? (
        <div className="card note"><h3>Pass not found</h3><p>{error || "Please check the link, or reply again on the invitation page to get your pass."}</p><p><Link href="/#rsvp">Open the invitation</Link></p></div>
      ) : null}
      {staff && <p className="pass-page-foot"><Link href="/gate">← Gate home</Link></p>}
    </main>
  );
}

async function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
}

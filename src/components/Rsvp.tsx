"use client";
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import type { EventContent, Viewer } from "@/lib/event";
import { Cta } from "./Header";

type Saved = {
  status: "confirmed" | "declined" | "pending_approval";
  name: string;
  phone: string | null;
  seats: number;
  note: string;
  passCode: string | null;
  attending: "yes" | "no";
};

const PASS_BASE = "https://yourdomain.et/p/"; // QR target — real pass page on the platform

const store = {
  get(k: string): Saved | null { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch { return null; } },
  set(k: string, v: Saved) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

const toUTC = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export default function Rsvp({ event, viewer }: { event: EventContent; viewer: Viewer }) {
  const key = viewer.kind === "individual" ? `rsvp:i:${viewer.guest.token}` : `rsvp:g:${viewer.code}`;
  const [saved, setSaved] = useState<Saved | null>(null);
  const [editing, setEditing] = useState(true);
  const [attending, setAttending] = useState<"yes" | "no" | null>(null);
  const [seats, setSeats] = useState(viewer.maxParty);
  const [name, setName] = useState(viewer.kind === "individual" ? viewer.guest.name : "");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [qr, setQr] = useState("");

  useEffect(() => {
    const s = store.get(key);
    if (s) { setSaved(s); setEditing(false); }
  }, [key]);

  useEffect(() => {
    if (saved?.passCode) QRCode.toString(PASS_BASE + saved.passCode, { type: "svg", margin: 0, color: { dark: "#0b1424", light: "#fbfbfb" } }).then(setQr);
  }, [saved?.passCode]);

  const location = `${event.venue.name}, ${event.venue.city}`;
  const gcal = useMemo(() =>
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    `&text=${encodeURIComponent(event.title + " — launch")}` +
    `&dates=${toUTC(event.startsAt)}/${toUTC(event.endsAt)}` +
    `&details=${encodeURIComponent("Please join us for our first pour.")}` +
    `&location=${encodeURIComponent(location)}`, [event, location]);

  const downloadIcs = () => {
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//roha//invite//EN", "BEGIN:VEVENT",
      `UID:${event.slug}@roha`, `DTSTAMP:${toUTC(new Date().toISOString())}`,
      `DTSTART:${toUTC(event.startsAt)}`, `DTEND:${toUTC(event.endsAt)}`,
      `SUMMARY:${event.title} — launch`, `LOCATION:${location}`,
      "BEGIN:VALARM", "TRIGGER:-PT3H", "ACTION:DISPLAY", "DESCRIPTION:Reminder", "END:VALARM",
      "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = `${event.slug}.ics`;
    document.body.appendChild(a); a.click(); a.remove();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!attending) return setError("Please let us know if you can come.");
    setBusy(true);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(viewer.kind === "individual" ? { token: viewer.guest.token } : { code: viewer.code }),
          name, phone,
          attending, seats, note, passCode: saved?.passCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Something went wrong. Please try again.");
      const s: Saved = { ...data, attending };
      store.set(key, s);
      setSaved(s);
      setEditing(false);
    } catch {
      setError("No connection. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const edit = () => {
    if (saved) {
      setAttending(saved.attending); setSeats(saved.seats || viewer.maxParty); setNote(saved.note || "");
      setName(saved.name); setPhone((saved.phone || "").replace("+251", ""));
    }
    setEditing(true);
  };

  const people = (n: number) => `${n} ${n > 1 ? "people" : "person"}`;

  return (
    <section className="rsvp" id="rsvp">
      <svg className="rsvp-texture" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <path d="M-40,180 C160,40 300,320 460,200 S700,40 820,180 S1080,380 1220,220 S1420,80 1500,160" />
        <path d="M-60,620 C120,480 260,760 440,640 C560,560 520,440 420,470 C320,500 380,700 560,720 C760,742 900,560 1060,620 S1360,800 1500,700" />
        <path d="M200,900 C260,780 380,820 360,740 C340,660 240,700 270,760 C310,840 520,820 600,900" />
      </svg>
      <div className="rsvp-wrap">
        <div className="rsvp-col">
          {editing ? (
            <form className="card form" onSubmit={submit} noValidate>
              <h3>Will you join us?</h3>
              <p className="muted">
                Kindly reply by {event.rsvpDeadline}.{viewer.kind === "general" && viewer.mode === "approval" ? " Your spot will be confirmed by SMS." : ""}
              </p>
              <label className="field"><span>Full name</span>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="e.g. Selam Bekele" /></label>
              <label className="field"><span>Phone number</span>
                <span className="phone"><b>+251</b><input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel-national" placeholder="9XX XXX XXX" /></span></label>
              <div className="choice" role="radiogroup" aria-label="Will you attend?">
                <label><input type="radio" name="attending" checked={attending === "yes"} onChange={() => setAttending("yes")} /><span>Yes, I&apos;ll be there</span></label>
                <label><input type="radio" name="attending" checked={attending === "no"} onChange={() => setAttending("no")} /><span>Sadly, I can&apos;t</span></label>
              </div>
              {attending === "yes" && viewer.maxParty > 1 && (
                <div className="seats">
                  <p>How many people?<small>Including you · up to {viewer.maxParty}</small></p>
                  <div className="stepper">
                    <button type="button" aria-label="Fewer" disabled={seats <= 1} onClick={() => setSeats(seats - 1)}>−</button>
                    <output aria-live="polite">{seats}</output>
                    <button type="button" aria-label="More" disabled={seats >= viewer.maxParty} onClick={() => setSeats(seats + 1)}>+</button>
                  </div>
                </div>
              )}
              <label className="field"><span>A note for {event.host} <i>(optional)</i></span>
                <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="How do you take your coffee?" /></label>
              {error && <p className="form-error" role="alert">{error}</p>}
              <div><Cta type="submit" className="lg" disabled={busy}>{busy ? "Sending…" : "Send RSVP"}</Cta></div>
            </form>
          ) : saved?.status === "confirmed" ? (
            <div>
              <div className="pass">
                <div className="pass-top">
                  <p className="pass-label">Entry pass · {event.host}</p>
                  <p className="pass-name">{saved.name}</p>
                  <div className="pass-meta"><span>{people(saved.seats)}</span><span>{event.dateShort}</span><span>{event.venue.name}</span></div>
                </div>
                <div className="pass-cut" aria-hidden />
                <div className="pass-bottom">
                  <div className="qr" role="img" aria-label="Entry QR code" dangerouslySetInnerHTML={{ __html: qr }} />
                  <span className="pass-code">{saved.passCode}</span>
                  <p className="pass-hint">Show this at the entrance — screenshot it to keep it handy.</p>
                </div>
              </div>
              <div className="result-actions">
                <Cta href={gcal} className="light">Add to calendar</Cta>
                <Cta className="light" onClick={edit}>Change my reply</Cta>
              </div>
            </div>
          ) : (
            <div>
              <div className="card note">
                {saved?.status === "pending_approval" ? (
                  <>
                    <h3>Request received</h3>
                    <p>Thank you, {saved.name.split(" ")[0]}. {event.host} will confirm your spot for {people(saved.seats)}.</p>
                    <p>Your entry pass will be sent by SMS to {saved.phone}.</p>
                  </>
                ) : (
                  <>
                    <h3>We&apos;ll miss you</h3>
                    <p>Thank you for letting us know. If your plans change, you can update your reply until {event.rsvpDeadline}.</p>
                  </>
                )}
              </div>
              <div className="result-actions"><Cta className="light" onClick={edit}>Change my reply</Cta></div>
            </div>
          )}

          <div className="rsvp-info">
            <div className="rsvp-facts">
              <div><small>When</small><span>{event.dateLong} · {event.timeLabel}</span><span lang="am" style={{ fontSize: ".95em", opacity: .9 }}>{event.ethDate}</span></div>
              <div><small>Where</small><span><a href={event.venue.mapUrl} target="_blank" rel="noopener">{event.venue.name}, {event.venue.city} ↗</a></span></div>
            </div>
            <div className="rsvp-cal">
              <Cta href={gcal} className="light">Google Calendar</Cta>
              <Cta className="light" onClick={downloadIcs}>Apple / Outlook</Cta>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

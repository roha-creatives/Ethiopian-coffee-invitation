"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import type { EventContent, Viewer } from "@/lib/event";
import { Cta } from "./Header";
import Countdown from "./Countdown";
import { savePass } from "@/lib/pass-image";

type Saved = {
  status: "confirmed" | "declined";
  name: string;
  phone: string | null;
  note: string;
  passCode: string | null;
  attending: "yes" | "no";
  already?: boolean;
};

// the QR opens the pass page on this site; gate staff check guests in from there
const passUrl = (code: string) => `${window.location.origin}/p/${code}`;

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
  const [name, setName] = useState(viewer.kind === "individual" ? viewer.guest.name : "");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [qr, setQr] = useState("");
  const [closed, setClosed] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [saving, setSaving] = useState(false);
  const onEnd = useCallback(() => setClosed(true), []);

  useEffect(() => {
    const s = store.get(key);
    if (s) { setSaved(s); setEditing(false); }
  }, [key]);

  useEffect(() => {
    if (saved?.passCode) QRCode.toString(passUrl(saved.passCode), { type: "svg", margin: 0, color: { dark: "#0b1424", light: "#fbfbfb" } }).then(setQr);
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
          attending, note, website,
        }),
      });
      const data = await res.json();
      if (res.status === 410) setClosed(true);
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
      setAttending(saved.attending); setNote(saved.note || "");
      setName(saved.name); setPhone((saved.phone || "").replace("+251", ""));
    }
    setEditing(true);
  };

  const download = async () => {
    if (!saved?.passCode) return;
    setSaving(true);
    try {
      await savePass({
        name: saved.name, passCode: saved.passCode, url: passUrl(saved.passCode), host: event.host,
        when: `${event.dateLong} · ${event.timeLabel}`, where: `${event.venue.name}, ${event.venue.city}`, logo: event.brand.logoWhite,
      });
    } catch {
      alert("Couldn't create the image. Please take a screenshot instead.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rsvp" id="rsvp">
      <svg className="rsvp-texture" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <path d="M-40,180 C160,40 300,320 460,200 S700,40 820,180 S1080,380 1220,220 S1420,80 1500,160" />
        <path d="M-60,620 C120,480 260,760 440,640 C560,560 520,440 420,470 C320,500 380,700 560,720 C760,742 900,560 1060,620 S1360,800 1500,700" />
        <path d="M200,900 C260,780 380,820 360,740 C340,660 240,700 270,760 C310,840 520,820 600,900" />
      </svg>
      <div className="rsvp-wrap">
        <div className="rsvp-col">
          {!closed && <Countdown to={event.rsvpClosesAt} label="The first pour begins in" onEnd={onEnd} />}
          {editing && closed ? (
            <div className="card note">
              <h3>RSVP is closed</h3>
              <p>The first pour has begun. If you already reserved, show the entry pass you saved.</p>
            </div>
          ) : editing ? (
            <form className="card form" onSubmit={submit} noValidate>
              <h3>Will you join us?</h3>
              <p className="muted">
                Kindly reply by {event.rsvpDeadline}. You&apos;ll get your entry pass right here.
              </p>
              <label className="field"><span>Full name</span>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="e.g. Selam Bekele" /></label>
              <label className="field"><span>Phone number</span>
                <span className="phone"><b>+251</b><input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel-national" placeholder="9XX XXX XXX" /></span></label>
              <div className="choice" role="radiogroup" aria-label="Will you attend?">
                <label><input type="radio" name="attending" checked={attending === "yes"} onChange={() => setAttending("yes")} /><span>Yes, I&apos;ll be there</span></label>
                <label><input type="radio" name="attending" checked={attending === "no"} onChange={() => setAttending("no")} /><span>Sadly, I can&apos;t</span></label>
              </div>
              <label className="field"><span>A note for {event.host} <i>(optional)</i></span>
                <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="How do you take your coffee?" /></label>
              <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden value={website} onChange={(e) => setWebsite(e.target.value)} name="website" />
              {error && <p className="form-error" role="alert">{error}</p>}
              <div><Cta type="submit" className="lg" disabled={busy}>{busy ? "Sending…" : "Send RSVP"}</Cta></div>
            </form>
          ) : saved?.status === "confirmed" ? (
            <div>
              {saved.already && <p className="pass-already" role="status">You&apos;re already reserved. Here&apos;s your pass again.</p>}
              <div className="pass">
                <div className="pass-top">
                  <p className="pass-label">Entry pass · {event.host}</p>
                  <p className="pass-name">{saved.name}</p>
                  <div className="pass-meta"><span>{event.dateShort}</span><span>{event.venue.name}</span></div>
                </div>
                <div className="pass-cut" aria-hidden />
                <div className="pass-bottom">
                  <div className="qr" role="img" aria-label="Entry QR code" dangerouslySetInnerHTML={{ __html: qr }} />
                  <span className="pass-code">{saved.passCode}</span>
                  <p className="pass-hint">Show this at the entrance. Save it to your phone so it&apos;s handy.</p>
                </div>
              </div>
              <div className="result-actions">
                <Cta className="light" onClick={download} disabled={saving}>{saving ? "Preparing…" : "Download pass"}</Cta>
                <Cta href={gcal} className="light">Add to calendar</Cta>
              </div>
            </div>
          ) : (
            <div>
              <div className="card note">
                <h3>We&apos;ll miss you</h3>
                <p>Thank you for letting us know. If your plans change, you can reply again until {event.rsvpDeadline}.</p>
              </div>
              {!closed && <div className="result-actions"><Cta className="light" onClick={edit}>Change my reply</Cta></div>}
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

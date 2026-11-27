"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { EventContent, Viewer } from "@/lib/event";
import { Cta } from "./Header";
import Countdown from "./Countdown";
import { preparePass, sharePass, type PassFile } from "@/lib/pass-image";
import { qrSvg, QR_LOGO } from "@/lib/qr";

type Saved = {
  status: "confirmed" | "declined";
  name: string;
  phone: string | null;
  note: string;
  passCode: string | null;
  attending: "yes" | "no";
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
  const [passFile, setPassFile] = useState<PassFile | null>(null);
  const [calHref, setCalHref] = useState("");
  const onEnd = useCallback(() => setClosed(true), []);

  useEffect(() => {
    const s = store.get(key);
    if (s) { setSaved(s); setEditing(false); }
  }, [key]);

  // QR on screen + the downloadable image, prepared as soon as there is a pass
  useEffect(() => {
    if (!saved?.passCode) return;
    const code = saved.passCode;
    qrSvg(passUrl(code)).then(setQr);
    let url = "";
    preparePass({
      name: saved.name, passCode: code, url: passUrl(code), host: event.host,
      when: `${event.dateLong} · ${event.timeLabel}`, where: `${event.venue.name}, ${event.venue.city}`, logo: event.brand.logoWhite,
    }).then((f) => { url = f.url; setPassFile(f); }).catch(() => setPassFile(null));
    return () => { if (url) URL.revokeObjectURL(url); setPassFile(null); };
  }, [saved?.passCode, saved?.name, event]);

  const location = `${event.venue.name}, ${event.venue.city}`;
  const gcal = useMemo(() =>
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    `&text=${encodeURIComponent(event.title + " — launch")}` +
    `&dates=${toUTC(event.startsAt)}/${toUTC(event.endsAt)}` +
    `&details=${encodeURIComponent("The first pour. Bring your entry pass. Map: " + event.venue.mapUrl)}` +
    `&location=${encodeURIComponent(location)}` +
    "&ctz=Africa/Addis_Ababa", [event, location]);

  // one "Add to calendar" button: Apple devices get the calendar file (opens Calendar),
  // everyone else (Android, Windows) gets Google Calendar
  useEffect(() => {
    const apple = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);
    setCalHref(apple ? "/event.ics" : gcal);
  }, [gcal]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const digits = phone.replace(/\D/g, "").replace(/^251/, "").replace(/^0/, "");
    if (name.trim().length < 2) return setError("Please enter your name.");
    if (!digits) return setError("Please enter your phone number.");
    if (!/^[79]\d{8}$/.test(digits)) return setError("Please check your phone number, e.g. 0911 234 567.");
    if (!attending) return setError("Please choose Yes or No.");
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
      setError("No internet connection. Please try again.");
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

  const onDownload = (e: React.MouseEvent) => {
    if (!passFile) { e.preventDefault(); return; }
    if (sharePass(passFile)) e.preventDefault(); // phones: share sheet; otherwise the link downloads
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
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Full name" aria-label="Full name" />
              <span className="phone"><b>+251</b><input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel-national" placeholder="Phone number" aria-label="Phone number" /></span>
              <div className="choice" role="radiogroup" aria-label="Will you attend?">
                <label><input type="radio" name="attending" checked={attending === "yes"} onChange={() => setAttending("yes")} /><span>Yes, I&apos;ll be there</span></label>
                <label><input type="radio" name="attending" checked={attending === "no"} onChange={() => setAttending("no")} /><span>Sadly, I can&apos;t</span></label>
              </div>
              <textarea className="input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder={`A note for ${event.host} (optional)`} aria-label={`A note for ${event.host} (optional)`} />
              <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden value={website} onChange={(e) => setWebsite(e.target.value)} name="website" />
              {error && <p className="form-error" role="alert">{error}</p>}
              <div><Cta type="submit" className="lg" disabled={busy}>{busy ? "Sending…" : "Send RSVP"}</Cta></div>
            </form>
          ) : saved?.status === "confirmed" ? (
            <div>
              <div className="pass">
                <div className="pass-top">
                  <p className="pass-label">Entry pass · {event.host}</p>
                  <p className="pass-name">{saved.name}</p>
                  <div className="pass-meta"><span>{event.dateShort}</span><span>{event.venue.name}</span></div>
                </div>
                <div className="pass-cut" aria-hidden />
                <div className="pass-bottom">
                  <div className="qr" role="img" aria-label="Entry QR code">
                    <div className="qr-code" dangerouslySetInnerHTML={{ __html: qr }} />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="qr-logo" src={QR_LOGO} alt="" width={48} height={48} />
                  </div>
                  <span className="pass-code">{saved.passCode}</span>
                  <p className="pass-hint">Show this at the entrance. Save it to your phone so it&apos;s handy.</p>
                </div>
              </div>
              <div className="result-actions">
                <Cta className="light" href={passFile?.url ?? "#"} download={passFile?.file.name} onClick={onDownload}>
                  {passFile ? "Download pass" : "Preparing…"}
                </Cta>
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
              <Cta href={calHref || gcal} className="light" newTab={!calHref.endsWith(".ics")}>Add to calendar</Cta>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

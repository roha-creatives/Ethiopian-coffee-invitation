"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Cta } from "./Header";

/** Check-in panel shown to signed-in staff on a pass page. */
export function CheckIn({ code, name, checkedInAt }: { code: string; name: string; checkedInAt: string }) {
  const [at, setAt] = useState(checkedInAt);
  const [justNow, setJustNow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const checkIn = async () => {
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/gate/checkin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Something went wrong.");
      setAt(data.checkedInAt);
      setJustNow(!data.already);
    } catch {
      setError("No connection. Try again.");
    } finally {
      setBusy(false);
    }
  };

  if (at && justNow) return <p><b>✓ Welcome, {name}</b><br />Checked in at {at.slice(11)}</p>;
  if (at) return <p><b>⚠ Already used</b><br />{name} checked in at {at.slice(11)} ({at.slice(0, 10)}). Ask for ID if this is a second person.</p>;
  return (
    <div>
      <p><b>✓ Valid pass</b><br />{name}</p>
      <Cta className="lg" onClick={checkIn} disabled={busy}>{busy ? "Checking in…" : "Check in"}</Cta>
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  );
}

/** PIN sign-in for gate staff. */
export function PinForm() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/gate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin }) });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Couldn't sign in.");
      router.refresh();
    } catch {
      setError("No connection. Try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="card form" onSubmit={submit}>
      <h3>Staff sign-in</h3>
      <label className="field"><span>Gate PIN</span>
        <input className="input" value={pin} onChange={(e) => setPin(e.target.value)} autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} type="password" /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div><Cta type="submit" className="lg" disabled={busy || !pin}>{busy ? "Checking…" : "Sign in"}</Cta></div>
    </form>
  );
}

type Guest = { name: string; phone: string; passCode: string; checkedInAt: string };

/** Digits a phone number is compared on: "+251 911…", "251911…", "0911…", "911…" → "911…". */
const phoneKey = (s: string) => s.replace(/\D/g, "").replace(/^251/, "").replace(/^0+/, "");

function matches(g: Guest, q: string) {
  const t = q.trim().toLowerCase();
  if (t.length < 2) return false;
  if (g.name.toLowerCase().includes(t)) return true;
  const code = t.replace(/[\s-]/g, "").toUpperCase();
  if (code.length >= 3 && g.passCode.replace(/-/g, "").includes(code)) return true;
  // phone in any format (09…, 9…, 251…, +251…), with or without spaces
  if (/^[\d\s+()-]+$/.test(t)) {
    const k = phoneKey(t);
    return k.length >= 2 && phoneKey(g.phone).includes(k);
  }
  return false;
}

/** Signed-in gate home: the guest list is loaded once, so search is instant; check in right from the list. */
export function GateHome() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [guests, setGuests] = useState<Guest[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/gate/guests", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Couldn't load the guest list.");
      setError(""); setGuests(data.guests);
    } catch {
      setError("No connection.");
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 20000); // pick up new RSVPs and other gates' check-ins
    return () => clearInterval(id);
  }, [load]);

  const checkIn = async (code: string) => {
    setBusy(code);
    try {
      const res = await fetch("/api/gate/checkin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Couldn't check in.");
      setGuests((gs) => gs?.map((g) => (g.passCode === code ? { ...g, checkedInAt: data.checkedInAt } : g)) ?? gs);
    } catch {
      setError("No connection. Try again.");
    } finally {
      setBusy("");
    }
  };

  const signOut = async () => { await fetch("/api/gate", { method: "DELETE" }); router.refresh(); };
  const hits = guests && q ? guests.filter((g) => matches(g, q)).slice(0, 20) : [];
  const inCount = guests?.filter((g) => g.checkedInAt).length ?? 0;

  return (
    <div className="gate-home">
      <div className="card note">
        <h3>Scan a guest</h3>
        <p>Open your phone&apos;s <b>camera</b> and point it at the guest&apos;s QR code, then tap the link that appears. You&apos;ll see the guest&apos;s name and a <b>Check in</b> button.</p>
        <p className="gate-stats">{guests ? <><b>{inCount}</b> checked in · <b>{guests.length}</b> reserved</> : "Loading guest list…"}</p>
      </div>
      <div className="card form">
        <h3>Find a guest</h3>
        <label className="field"><span>Name, phone or pass code</span>
          <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Selam or 0911…" autoComplete="off" /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        {hits.length > 0 && (
          <ul className="gate-hits">
            {hits.map((h) => (
              <li key={h.passCode}>
                <div>
                  <b>{h.name}</b>
                  <span>{h.phone} · {h.checkedInAt ? `in at ${h.checkedInAt.slice(11)}` : "not in yet"}</span>
                </div>
                {h.checkedInAt
                  ? <span className="gate-in">✓ In</span>
                  : <button type="button" className="gate-btn" disabled={busy === h.passCode} onClick={() => checkIn(h.passCode)}>{busy === h.passCode ? "…" : "Check in"}</button>}
              </li>
            ))}
          </ul>
        )}
        {guests && q.trim().length >= 2 && hits.length === 0 && <p className="muted">No reserved guest matches.</p>}
      </div>
      <p className="pass-page-foot"><button type="button" className="linkish" onClick={signOut}>Sign out</button></p>
    </div>
  );
}

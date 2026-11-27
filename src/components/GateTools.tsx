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

type Hit = { name: string; phone: string; passCode: string; checkedInAt: string };

/**
 * Signed-in gate home. Search runs on the server (the guest list never reaches the phone):
 * a short pause after typing, and older requests are cancelled so only the latest answer shows.
 */
export function GateHome() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [stats, setStats] = useState<{ confirmed: number; checkedIn: number } | null>(null);
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState("");

  const search = useCallback(async (query: string, signal?: AbortSignal) => {
    try {
      const res = await fetch(`/api/gate/search?q=${encodeURIComponent(query)}`, { cache: "no-store", signal });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Couldn't search."); return; }
      setError(""); setStats(data.stats); setHits(data.results);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError("No connection.");
    } finally {
      if (!signal?.aborted) setSearching(false);
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    const query = q.trim();
    setSearching(query.length >= 2);
    const t = setTimeout(() => search(query, ctrl.signal), query ? 250 : 0);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q, search]);

  const checkIn = async (code: string) => {
    setBusy(code);
    try {
      const res = await fetch("/api/gate/checkin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Couldn't check in.");
      setHits((hs) => hs.map((h) => (h.passCode === code ? { ...h, checkedInAt: data.checkedInAt } : h)));
      setStats((st) => (st && !data.already ? { ...st, checkedIn: st.checkedIn + 1 } : st));
    } catch {
      setError("No connection. Try again.");
    } finally {
      setBusy("");
    }
  };

  const signOut = async () => { await fetch("/api/gate", { method: "DELETE" }); router.refresh(); };
  const query = q.trim();

  return (
    <div className="gate-home">
      <div className="card note">
        <h3>Scan a guest</h3>
        <p>Open your phone&apos;s <b>camera</b> and point it at the guest&apos;s QR code, then tap the link that appears. You&apos;ll see the guest&apos;s name and a <b>Check in</b> button.</p>
        <p className="gate-stats">{stats ? <><b>{stats.checkedIn}</b> checked in · <b>{stats.confirmed}</b> reserved</> : "Loading…"}</p>
      </div>
      <div className="card form">
        <h3>Find a guest</h3>
        <label className="field"><span>Name, phone or pass code</span>
          <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Selam or 0911…" autoComplete="off" /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        {searching && hits.length === 0 && <p className="muted">Searching…</p>}
        {hits.length > 0 && (
          <ul className={`gate-hits${searching ? " is-stale" : ""}`}>
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
        {!searching && query.length >= 2 && hits.length === 0 && !error && <p className="muted">No reserved guest matches.</p>}
      </div>
      <p className="pass-page-foot"><button type="button" className="linkish" onClick={signOut}>Sign out</button></p>
    </div>
  );
}

import "server-only";
import { createSign } from "node:crypto";

/**
 * RSVP storage in a private Google Sheet, through a Google service account.
 * No SDK: the service account signs a JWT with Node's crypto and calls the Sheets REST API.
 *
 * Env:
 *   GOOGLE_SERVICE_ACCOUNT_JSON  the whole key file (JSON) downloaded from Google Cloud
 *   GOOGLE_SHEET_ID              the long id in the sheet URL: docs.google.com/spreadsheets/d/<ID>/edit
 *   GOOGLE_SHEET_TAB             tab name (default "RSVPs"); the tab must exist
 *
 * Without these (local development only) RSVPs are kept in memory so the site still works.
 */

export const COLUMNS = ["Time", "Name", "Phone", "Coming", "Note", "Pass code", "Checked in at"] as const;

export type Row = {
  row: number; // sheet row number (1-based; header is row 1)
  time: string;
  name: string;
  phone: string;
  coming: "Yes" | "No";
  note: string;
  passCode: string;
  checkedInAt: string;
};

type Creds = { client_email: string; private_key: string };

function creds(): Creds | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const json = raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
    const c = JSON.parse(json) as Creds;
    return { client_email: c.client_email, private_key: c.private_key.replace(/\\n/g, "\n") };
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON");
  }
}

const SHEET_ID = () => process.env.GOOGLE_SHEET_ID || "";
const TAB = () => process.env.GOOGLE_SHEET_TAB || "RSVPs";
export const sheetsConfigured = () => Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON && SHEET_ID());

/** Secret used to sign the staff cookie; falls back to the service account key. */
export function serverSecret() {
  return process.env.GATE_SECRET || creds()?.private_key || "dev-only-secret";
}

// ---------- auth ----------
let cached: { token: string; exp: number } | null = null;

async function accessToken() {
  if (cached && cached.exp > Date.now() + 60_000) return cached.token;
  const c = creds();
  if (!c) throw new Error("Google service account is not configured");
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const unsigned =
    b64({ alg: "RS256", typ: "JWT" }) + "." +
    b64({ iss: c.client_email, scope: "https://www.googleapis.com/auth/spreadsheets", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 });
  const sig = createSign("RSA-SHA256").update(unsigned).sign(c.private_key, "base64url");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${sig}` }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Google sign-in failed (${res.status}): ${await res.text()}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cached = { token: data.access_token, exp: Date.now() + data.expires_in * 1000 };
  return cached.token;
}

async function api(path: string, init: RequestInit = {}) {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID()}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json", ...init.headers },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Google Sheets error (${res.status}): ${await res.text()}`);
  return res.json();
}

const range = (r: string) => encodeURIComponent(`'${TAB().replace(/'/g, "''")}'!${r}`);
const LAST = String.fromCharCode(64 + COLUMNS.length); // "G"

let headerChecked = false;
async function ensureHeader() {
  if (headerChecked) return;
  const data = await api(`/values/${range(`A1:${LAST}1`)}`);
  if (!data.values?.[0]?.length) {
    await api(`/values/${range(`A1:${LAST}1`)}?valueInputOption=RAW`, { method: "PUT", body: JSON.stringify({ values: [COLUMNS] }) });
  }
  headerChecked = true;
}

const toRow = (v: string[], i: number): Row => ({
  row: i + 2,
  time: v[0] ?? "",
  name: v[1] ?? "",
  phone: v[2] ?? "",
  coming: (v[3] ?? "").toLowerCase().startsWith("y") ? "Yes" : "No",
  note: v[4] ?? "",
  passCode: (v[5] ?? "").toUpperCase(),
  checkedInAt: v[6] ?? "",
});
const toValues = (r: Omit<Row, "row">) => [r.time, r.name, r.phone, r.coming, r.note, r.passCode, r.checkedInAt];

// ---------- in-memory fallback (local development without credentials) ----------
const mem: Row[] = ((globalThis as unknown as { __rsvpMem?: Row[] }).__rsvpMem ??= []);

function assertUsable() {
  if (!sheetsConfigured() && process.env.VERCEL) throw new Error("RSVP storage is not configured (GOOGLE_SERVICE_ACCOUNT_JSON / GOOGLE_SHEET_ID)");
}

// ---------- public API ----------
// Each Google read takes ~0.3–0.5 s, so reads are cached briefly per server instance.
// `maxAgeMs: 0` forces a fresh read (used before anything is written).
let cache: { rows: Row[]; at: number } | null = null;

export async function allRows({ maxAgeMs = 5000 }: { maxAgeMs?: number } = {}): Promise<Row[]> {
  assertUsable();
  if (!sheetsConfigured()) return mem.map((r) => ({ ...r }));
  if (cache && Date.now() - cache.at <= maxAgeMs) return cache.rows.map((r) => ({ ...r }));
  await ensureHeader();
  const data = await api(`/values/${range(`A2:${LAST}`)}`);
  const rows = ((data.values as string[][] | undefined) ?? []).map(toRow).filter((r) => r.name || r.phone);
  cache = { rows, at: Date.now() };
  return rows.map((r) => ({ ...r }));
}

/** Age of the cached copy in ms (Infinity when there is none). */
export const cacheAge = () => (cache ? Date.now() - cache.at : Infinity);

export async function appendRow(r: Omit<Row, "row">): Promise<void> {
  assertUsable();
  if (!sheetsConfigured()) { mem.push({ ...r, row: mem.length + 2 }); return; }
  await ensureHeader();
  await api(`/values/${range(`A:${LAST}`)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
    method: "POST",
    body: JSON.stringify({ values: [toValues(r)] }),
  });
  cache = null; // row number unknown until the next read
}

export async function updateRow(r: Row): Promise<void> {
  assertUsable();
  if (!sheetsConfigured()) { mem[r.row - 2] = { ...r }; return; }
  await api(`/values/${range(`A${r.row}:${LAST}${r.row}`)}?valueInputOption=RAW`, {
    method: "PUT",
    body: JSON.stringify({ values: [toValues(r)] }),
  });
  if (cache) cache.rows = cache.rows.map((x) => (x.row === r.row ? { ...r } : x));
}

/** Current time in Addis Ababa, e.g. "2026-12-05 16:12". */
export const addisNow = () =>
  new Date().toLocaleString("sv-SE", { timeZone: "Africa/Addis_Ababa", hour12: false }).slice(0, 16);

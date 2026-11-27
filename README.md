# Invitation site — "The First Pour"

Mobile-first digital invitation for **Ethiopian Coffee by Hanan Tarq** — launch event, December 5, 2026, Friendship Park, Phase Two, Addis Ababa.

Built with Next.js 15 (App Router), GSAP + ScrollTrigger, Lenis (desktop only) and `next/image`.
Powered by [Roha Creatives](https://rohacreatives.com).

## What the guest sees

1. **Envelope** — tap the sini to open; the invitation card slides out.
2. **Hero** — product photos swipe up one over another, then the title, *Reserve now* button and the walking characters with their signs.
3. **The invitation** — pinned text that colours letter by letter as you scroll.
4. **Gallery** — product photo strip that drifts with the scroll.
5. **The afternoon** — the program on a winding road that fills as you scroll down and drains as you scroll up.
6. **From the bar** — swipeable card deck.
7. **RSVP** — countdown to the start, then name, phone, yes/no, note → QR entry pass (downloadable as an image). RSVP closes when the countdown ends (the start of the program).

## Links

| URL | Opens |
|---|---|
| `/` | The invitation (one general link for everyone) |
| `/?open=1` | Skips the envelope (useful when testing) |
| `/p/<pass code>` | A guest's entry pass. This is what the QR code opens. |
| `/gate` | Gate staff: sign in with the PIN, then scan QR codes with the phone camera |

## Guest list & check-in (Google Sheet)

Every RSVP becomes a row in a private Google Sheet:
`Time | Name | Phone | Coming | Note | Pass code | Checked in at`.

- **Phone number = the guest.** Same phone and the same person again → "You're already reserved" and their existing pass (so a lost pass can be recovered). Same phone but a different name → refused.
- Someone who said *no* can come back and say *yes*; they then get a pass.
- **At the gate:** staff open `/gate` once and enter the PIN. After that, scanning a guest's QR with the normal camera shows ✓ *Valid pass* with a **Check in** button. A second scan of the same pass shows ⚠ *Already used* with the time. Staff can also search by name, phone or code.
- Rows can be edited by hand in the sheet. A row added by hand with `Coming = Yes` gets a pass code the first time that guest submits the form.

### One-time setup
1. In [Google Cloud Console](https://console.cloud.google.com/): create a project → enable **Google Sheets API** → *IAM & Admin → Service accounts* → create one → *Keys → Add key → JSON*. A `.json` file downloads.
2. In the sheet: rename the first tab to **RSVPs**, then **Share** it with the service account's email (`…@….iam.gserviceaccount.com`) as **Editor**.
3. In Vercel → *Project → Settings → Environment Variables*, add the values listed in `.env.example` (paste the whole JSON file as `GOOGLE_SERVICE_ACCOUNT_JSON`). Redeploy.

Without these variables the site keeps RSVPs **in memory** locally (for testing) and refuses to take RSVPs on Vercel (so nothing is silently lost).

## Run locally

Node 20+.

```bash
npm install
npm run dev          # http://localhost:3000
# production
npm run build && npm start
```

## Configuration

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Public site URL, e.g. `https://invite.example.com`. Used for share previews and in the QR codes. **Set it before deploying.** |
| `GOOGLE_SERVICE_ACCOUNT_JSON`, `GOOGLE_SHEET_ID`, `GOOGLE_SHEET_TAB` | Guest-list sheet (see above). |
| `GATE_PIN`, `GATE_SECRET` | Gate staff sign-in. |

## Where things live

- `src/lib/event.ts` — all event content (texts, program, photos, venue, RSVP closing time). This is the shape the backend API will provide later.
- `src/components/` — one component per section (`Envelope`, `Hero`, `About`, `Showcase`, `Program`, `Voices`, `Rsvp`, …).
- `src/app/api/rsvp/route.ts` — RSVP endpoint (validation, duplicate rules, pass codes).
- `src/lib/sheets.ts` — Google Sheets read/write (service account, no SDK).
- `src/app/p/[code]` + `src/app/gate` + `src/app/api/gate/*` — pass page and gate check-in.
- `public/` — images (brand, event card, hero and product photos). Photos are served resized as AVIF/WebP by `next/image`.

## Mobile notes

- Native scrolling on touch screens (smooth-scroll library only for mouse/trackpad).
- Tap targets ≥ 44px; form inputs ≥ 16px so iOS doesn't zoom in.
- Respects *reduce motion*: animations are skipped and content is shown directly.
- Personal invitation pages are `noindex`; link previews still work on WhatsApp, Telegram and Facebook.

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
7. **RSVP** — name, phone, yes/no, note → QR entry pass. When / where and calendar buttons below.

## Links

| URL | Opens |
|---|---|
| `/` | General invitation (guest types name + phone) |
| `/?g=first-pour-vip` | General link that needs host approval |
| `/?i=<token>` | Personal invitation for a known guest |
| `/?open=1` | Skips the envelope (useful when testing) |

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
| `NEXT_PUBLIC_SITE_URL` | Public site URL, e.g. `https://invite.example.com`. Used for share previews (Open Graph images). **Set it before deploying.** |

## Where things live

- `src/lib/event.ts` — all event content (texts, program, photos, venue, demo guests/links). This is the shape the backend API will provide later.
- `src/components/` — one component per section (`Envelope`, `Hero`, `About`, `Showcase`, `Program`, `Voices`, `Rsvp`, …).
- `src/app/api/rsvp/route.ts` — **demo** RSVP endpoint (validates, returns a pass code, stores nothing). To be replaced by the real API.
- `public/` — images (brand, event card, hero and product photos). Photos are served resized as AVIF/WebP by `next/image`.

## Mobile notes

- Native scrolling on touch screens (smooth-scroll library only for mouse/trackpad).
- Tap targets ≥ 44px; form inputs ≥ 16px so iOS doesn't zoom in.
- Respects *reduce motion*: animations are skipped and content is shown directly.
- Personal invitation pages are `noindex`; link previews still work on WhatsApp, Telegram and Facebook.

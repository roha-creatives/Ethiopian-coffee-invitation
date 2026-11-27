import { EVENT } from "@/lib/event";

/** Calendar file for Apple Calendar / Outlook / any calendar app: /event.ics */
const utc = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

export const dynamic = "force-static";

export function GET() {
  const location = `${EVENT.venue.name}, ${EVENT.venue.city}`;
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Roha Creatives//Invitation//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${EVENT.slug}@ethiopian-coffee-invitation`,
    `DTSTAMP:${utc("2026-11-27T00:00:00Z")}`,
    `DTSTART:${utc(EVENT.startsAt)}`,
    `DTEND:${utc(EVENT.endsAt)}`,
    `SUMMARY:${esc(`${EVENT.title} — launch`)}`,
    `LOCATION:${esc(location)}`,
    `DESCRIPTION:${esc(`The first pour. Bring your entry pass. Map: ${EVENT.venue.mapUrl}`)}`,
    `URL:${EVENT.venue.mapUrl}`,
    "BEGIN:VALARM", "TRIGGER:-PT3H", "ACTION:DISPLAY", "DESCRIPTION:The first pour starts in 3 hours", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR", "",
  ].join("\r\n");
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${EVENT.slug}.ics"`,
    },
  });
}

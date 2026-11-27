import type { EventContent, Viewer } from "@/lib/event";
import SmoothScroll from "./SmoothScroll";
import Envelope from "./Envelope";
import Header from "./Header";
import Hero from "./Hero";
import About from "./About";
import Showcase from "./Showcase";
import Program from "./Program";
import Voices from "./Voices";
import Rsvp from "./Rsvp";
import AmbientMusic from "./AmbientMusic";

export default function Invitation({ event, viewer }: { event: EventContent; viewer: Viewer }) {
  return (
    <>
      <SmoothScroll />
      <AmbientMusic />
      <Envelope host={event.title} card={event.card} logo={event.brand.logoNavy} sini={event.brand.sini} ring={event.brand.sealRing} />
      <Header host={event.title} logo={event.brand.logoNavy} timing={[event.dateShort, event.venue.name]} mapUrl={event.venue.mapUrl} />
      <main>
        <Hero heading={event.heroHeading} titleAm={event.heroTitleAm} slides={event.heroSlides} marquee={event.marquee} signs={event.signs} />
        <About label={event.aboutLabel} text={event.aboutText} pills={event.aboutPills} />
        <Showcase slides={event.showcase} />
        <Program items={event.program} />
        <Voices voices={event.voices} />
        <Rsvp event={event} viewer={viewer} />
      </main>
      <footer className="footer">
        <p>© 2026 {event.host} · {event.venue.city}</p>
        <p>Powered by <a href={event.poweredBy.url} target="_blank" rel="noopener"><b>{event.poweredBy.name}</b></a></p>
      </footer>
    </>
  );
}

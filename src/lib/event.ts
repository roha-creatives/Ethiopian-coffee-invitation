/**
 * Event content for the "first-pour" template.
 * In production this comes from the Nest API:
 *   GET /public/invitations/:token   (individual invitation)
 *   GET /public/links/:code          (general invitation)
 * Keep the shape stable — the components only read from these types.
 */

export type ProgramItem = {
  time: string; // PLACEHOLDER times — confirm with the client
  title: [string, string?]; // split around the icon: [left word(s), right word(s)]
  note: string;
  icon: "jebena" | "cups" | "barista" | "ice" | "mystery";
};

export type Voice = {
  headline: string;
  text: string;
  name: string;
  role: string;
  avatar: string;
};

export type EventContent = {
  slug: string;
  host: string;
  title: string;
  amharicMark: string;
  heroHeading: string;
  heroTitleAm: string;
  heroSlides: { src: string; alt: string; pos?: string; posWide?: string }[];
  aboutLabel: string;
  aboutText: string;
  aboutPills: [string, string, string];
  marquee: string[];
  startsAt: string;
  endsAt: string;
  dateLong: string;
  dateShort: string;
  timeLabel: string;
  ethDate: string;
  venue: { name: string; city: string; mapUrl: string };
  rsvpDeadline: string;
  /** RSVPs close (and the countdown ends) at this moment */
  rsvpClosesAt: string;
  signs: { left: string; right: string };
  card: string;
  brand: { logoNavy: string; logoWhite: string; sini: string; sealRing: string };
  showcase: { src: string; video?: string; alt: string }[];
  program: ProgramItem[];
  voices: Voice[];
  poweredBy: { name: string; url: string };
};

export type Guest = { token: string; name: string; firstName: string; maxParty: number };

export type Viewer =
  | { kind: "individual"; guest: Guest; maxParty: number }
  | { kind: "general"; code: string; mode: "auto" | "approval"; maxParty: number };

export const EVENT: EventContent = {
  slug: "first-pour",
  host: "Hanan Tarq",
  title: "Ethiopian Coffee by Hanan Tarq",
  amharicMark: "ኑ ቡና ጠጡ",
  heroHeading: "Come for the first pour",
  heroTitleAm: "ኑ ቡና ጠጡ",
  // photos from the client's brand site; they swipe up one over another, the last one stays
  heroSlides: [
    { src: "/hero/products-shelf.webp", alt: "Ethiopian Coffee single-origin bags on a shelf", pos: "50% 55%" },
    { src: "/hero/products-float.jpg", alt: "Two Ethiopian Coffee bags, navy and white", pos: "50% 48%" },
    { src: "/hero/ceremony.webp", alt: "A woman enjoying coffee at a traditional coffee ceremony", pos: "60% 30%", posWide: "62% 28%" },
  ],
  aboutLabel: "The invitation",
  aboutText:
    "On Saturday, December 5 at 4 PM, join us at Friendship Park, Phase Two, Addis Ababa, for the unveiling of Ethiopian Coffee by Hanan Tarq, and share the very first cup with us under the open sky.",
  aboutPills: ["From the jebena", "Into the sini", "Under the open sky"],
  marquee: ["Fresh from the jebena", "ኑ ቡና ጠጡ", "First sip, first story", "See you on December 5"],
  startsAt: "2026-12-05T16:00:00+03:00",
  endsAt: "2026-12-05T19:00:00+03:00", // ASSUMPTION — end time not given
  dateLong: "Saturday, December 5, 2026",
  dateShort: "Dec 5 · 4 PM",
  timeLabel: "4:00 PM",
  ethDate: "ቅዳሜ ህዳር 26 ቀን 2019 ዓ.ም · ከቀኑ 10 ሰዓት",
  venue: {
    name: "Friendship Park, Phase Two",
    city: "Addis Ababa",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Friendship+Park+Addis+Ababa",
  },
  rsvpDeadline: "December 5 at 4 PM",
  rsvpClosesAt: "2026-12-05T16:00:00+03:00", // same as the start of the program
  signs: { left: "/event/sign-left.webp", right: "/event/sign-right.webp" },
  card: "/event/card.webp",
  brand: {
    logoNavy: "/brand/logo-navy.png",
    logoWhite: "/brand/logo-white.png",
    sini: "/event/sini.webp",
    sealRing: "Tap the sini  •  ኑ ቡና ጠጡ  •  Tap the sini  •  ኑ ቡና ጠጡ  •",
  },
  // product photos from the client's site (ethiopiancoffee-nine.vercel.app)
  showcase: [
    { src: "/products/bags-navy.webp", alt: "Navy Ethiopian Coffee single-origin bags" },
    { src: "/products/bags-white.webp", alt: "White Ethiopian Coffee single-origin bags" },
    { src: "/products/espresso-bar.webp", alt: "Ethiopian Coffee bag and cups at an espresso machine" },
    { src: "/products/bags-pair.webp", alt: "A navy and a white Ethiopian Coffee bag" },
    { src: "/products/bags-all.webp", alt: "The Ethiopian Coffee range, navy and white bags together" },
  ],
  program: [
    { time: "4:00 PM", title: ["The first", "cup"], icon: "jebena",
      note: "Coffee poured from the jebena into a sini, shared under the open sky." },
    { time: "4:30 PM", title: ["Origins", "side by side"], icon: "cups",
      note: "Taste coffees from different Ethiopian origins — fragrance, sweetness, finish." },
    { time: "5:15 PM", title: ["Meet the", "baristas"], icon: "barista",
      note: "The people behind our signature drinks." },
    { time: "5:45 PM", title: ["Served", "chilled"], icon: "ice",
      note: "What happens when Ethiopian coffee is served cold." },
    { time: "6:15 PM", title: ["The surprise", "pour"], icon: "mystery",
      note: "Take the first sip, tell us what you taste, then hear the story." },
  ],
  // Amharic coffee proverbs (headline) with a short English meaning
  voices: [
    { headline: "የዶሮ ዓይን የመሰለ ቡና",
      text: "“Coffee like a hen’s eye.” Said of the perfect cup: clear, bright and deep red-brown. That’s the cup we’re pouring for you.",
      name: "Ethiopian proverb", role: "On the perfect cup", avatar: "/event/sini.webp" },
    { headline: "የቡና ቁርስ አለ",
      text: "“Coffee has its breakfast.” Coffee is never served alone: there’s always kolo, popcorn or bread to share around the cups.",
      name: "Ethiopian proverb", role: "On sharing", avatar: "/products/pack-beans-navy.jpg" },
    { headline: "ከአቦል እስከ በረካ",
      text: "“From abol to bereka.” From the first round of the ceremony to the third, the blessing. Stay with us for every cup.",
      name: "Ethiopian proverb", role: "On the three rounds", avatar: "/products/roasted-tins.jpg" },
  ],
  poweredBy: { name: "Roha Creatives", url: "https://rohacreatives.com" },
};

// The one general link guests receive. One RSVP = one person = one pass.
export const GENERAL_LINKS: Record<string, { mode: "auto" | "approval"; maxPerRequest: number }> = {
  "first-pour": { mode: "auto", maxPerRequest: 1 },
};

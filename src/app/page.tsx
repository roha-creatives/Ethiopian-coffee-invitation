import type { Metadata } from "next";
import Invitation from "@/components/Invitation";
import { EVENT, GENERAL_LINKS, getGuest, type Viewer } from "@/lib/event";

/**
 * The invitation home page.
 *   /                 → general invitation (guest types name + phone)
 *   /?g=<code>        → a specific general link (e.g. one that needs approval)
 *   /?i=<token>       → personal invitation for that guest
 */
type Props = { searchParams: Promise<{ i?: string; g?: string }> };

const DEFAULT_LINK = "first-pour"; // the plain link is the general invitation

function resolve(sp: { i?: string; g?: string }): Viewer {
  const guest = sp.i ? getGuest(sp.i) : undefined;
  if (guest) return { kind: "individual", guest, maxParty: guest.maxParty };
  const code = sp.g && GENERAL_LINKS[sp.g] ? sp.g : DEFAULT_LINK;
  const l = GENERAL_LINKS[code];
  return { kind: "general", code, mode: l.mode, maxParty: l.maxPerRequest };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const v = resolve(await searchParams);
  // personal links get a personal tab title; the share preview stays the same for everyone
  return v.kind === "individual" ? { title: `${v.guest.firstName}, you're invited` } : {};
}

export default async function Home({ searchParams }: Props) {
  const viewer = resolve(await searchParams);
  return <Invitation event={EVENT} viewer={viewer} />;
}

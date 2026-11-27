import Invitation from "@/components/Invitation";
import { EVENT, GENERAL_LINKS, type Viewer } from "@/lib/event";

/**
 * The invitation home page: one general link for everyone.
 * Guests type their name + phone; each RSVP is saved to the guest-list sheet.
 */
const CODE = "first-pour";

export default function Home() {
  const l = GENERAL_LINKS[CODE];
  const viewer: Viewer = { kind: "general", code: CODE, mode: l.mode, maxParty: l.maxPerRequest };
  return <Invitation event={EVENT} viewer={viewer} />;
}

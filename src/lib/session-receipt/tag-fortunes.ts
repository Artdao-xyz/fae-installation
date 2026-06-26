import { FOCUS_AREA_LABELS } from "@/data/content-taxonomy";

/**
 * Poetic tag fortunes — 1–2 per Focus tag, each <150 chars.
 * Horoscope-adjacent, emotionally honest, open to interpretation.
 */
export const TAG_FORTUNES: Record<string, readonly string[]> = {
  AI: [
    "The machine learns you before you learn it—follow what feels uncanny, not what explains itself.",
    "Your attention already trains the model; wander toward what you cannot quite trust.",
  ],
  Artists: [
    "The work knows something you forgot—stay with the piece that refuses to perform for you.",
    "Let the artist's doubt become your compass; credibility is overrated.",
  ],
  Blockchain: [
    "Trust is a story told in public—look for the ledger that remembers what you'd rather forget.",
    "Somewhere a chain holds a promise; follow the link that feels too permanent to ignore.",
  ],
  "Creative R&D": [
    "The prototype is honest when the pitch is not—seek what still breaks beautifully.",
    "Experimentation is a form of hope; drift toward the unfinished.",
  ],
  "Cultural Strategy": [
    "Culture moves before policy names it—notice what institutions are already rehearsing.",
    "The future is negotiated in rooms you haven't entered yet; find the side door.",
  ],
  Data: [
    "What gets counted gets cared for—and what escapes counting may matter more.",
    "Follow the dataset that makes you slightly uncomfortable; it may be yours.",
  ],
  Ecology: [
    "The planet keeps score in slow motion—listen for what thrives without permission.",
    "You are already inside the ecosystem you are looking for; look down.",
  ],
  Economy: [
    "Value hides in exchanges too small to graph—follow the informal, the gifted, the shared.",
    "Money tells one story; follow what people protect when no one is buying.",
  ],
  Gaming: [
    "Every world has rules someone wrote—play until you find whose rules you are inside.",
    "The quest is rarely the point; linger where the game forgets to win.",
  ],
  Governance: [
    "Power whispers before it legislates—watch who speaks in the conditional tense.",
    "Democracy is a habit, not a building; find where decisions are still being made.",
  ],
  Infrastructure: [
    "What holds everything up is rarely visible—look for the maintenance, the cable, the care.",
    "The system works until it doesn't; explore the seams.",
  ],
  Interoperability: [
    "Translation is never neutral—seek the border where two systems misunderstand each other.",
    "What connects also excludes; follow the handshake, not the handshake's logo.",
  ],
  Legal: [
    "The law dreams in precedent—find the case that hasn't been argued yet.",
    "Rights are stories with enforcement; look for who is still writing the footnotes.",
  ],
  Ownership: [
    "To hold is not always to have—ask what you are willing to steward instead of claim.",
    "The deed is a fiction everyone agrees to; find the gift economy underneath.",
  ],
  Policy: [
    "Policy is grief management at scale—notice what gets named too late.",
    "The brief is never the whole story; read between the funding line.",
  ],
  "Public Value": [
    "The commons is whatever we defend together—find who is already defending it.",
    "Public does not mean neutral; look for the argument about who counts as public.",
  ],
  Robotics: [
    "The body of the machine is a question about yours—follow the gesture that almost looks human.",
    "Automation is a wish; find where the wish still needs a hand.",
  ],
  Simulation: [
    "The model is not the territory—but sometimes it dreams the territory true.",
    "Enter the world that knows it is a world; see what it wants from you.",
  ],
  Stewardship: [
    "Care outlasts ownership—find what someone has been tending without applause.",
    "Stewardship begins where extraction ends; look for the long commit.",
  ],
  Systems: [
    "Every system optimises for something—discover what this one cannot help but optimise for.",
    "The map is not the mess; walk the mess anyway.",
  ],
  "Virtual Environments": [
    "Presence without a body is still presence—notice where you feel located.",
    "The portal is open; step through the room that remembers your name differently.",
  ],
  Worldbuilding: [
    "Every world begins as a refusal of this one—find the fiction someone needs to be true.",
    "Build nothing yet; walk the world that is already being built in conversation.",
  ],
};

const FALLBACK_FORTUNES = [
  "Something in the archive is looking back—follow the thread that has no conclusion.",
  "You have already chosen, you just haven't arrived—let the next room surprise you.",
  "The exhibition is a mirror with delay; trust what you keep returning to.",
] as const;

export function fortunesForFocusTag(tag: string): readonly string[] {
  return TAG_FORTUNES[tag] ?? [];
}

export function pickTagFortune(tag: string | null, seed: number): string {
  if (tag) {
    const pool = fortunesForFocusTag(tag);
    if (pool.length > 0) {
      return pool[seed % pool.length]!;
    }
  }
  return FALLBACK_FORTUNES[seed % FALLBACK_FORTUNES.length]!;
}

/** All focus tags that have fortunes defined (for validation). */
export const FORTUNE_FOCUS_TAGS = FOCUS_AREA_LABELS.filter(
  (label) => fortunesForFocusTag(label).length > 0,
);

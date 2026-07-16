import { FOCUS_AREA_LABELS } from "@/data/content-taxonomy";

/**
 * Tag fortunes — 1–3 per Focus tag, each <150 chars (QR/thermal prompt budget).
 * Producer-supplied set (Jul 2026); aphoristic, open to interpretation.
 * Keys must match FOCUS_AREA_LABELS exactly or the fortune never fires.
 */
export const TAG_FORTUNES: Record<string, readonly string[]> = {
  AI: [
    "Power is secured by those that can design and maintain its architecture.",
    "The machine is not granted permission to be useful.",
    "What may at first appear to be Roko’s basilisk is almost always an ouroboros.",
  ],
  Artists: [
    "Allow skill and concept to conspire as allies.",
    "Think twice before putting your trust in an artist who has never had a day job.",
  ],
  Blockchain: [
    "Be mindful - chains that support value today may break under the strain of tomorrow.",
    "A busy Discord server is more powerful than an empty DAO.",
  ],
  "Creative R&D": [
    "The prototype is honest when the pitch is not—seek what still breaks beautifully.",
    "Experimentation is a form of hope; drift toward the unfinished.",
  ],
  "Cultural Strategy": [
    "Unexpected insights serve as the most precious outputs.",
    "Expand your cultural research practice beyond panel discussions and ChatGPT.",
  ],
  Data: [
    "Ask not what the system eats, but who it was fed by.",
    "Worry not of the paucity of data, but of the lack of compute.",
    "Make Data Sexy Again.",
  ],
  Ecology: [
    "We do not receive the earth from our ancestors; we borrow it from those not yet born.",
    "Acknowledge the labourers, not just the land.",
  ],
  Economy: [
    "When capital lifts away from its human substrate, does capitalism even need us anymore?",
    "While centralised economies can weather markets, speculative economies are buffeted by them.",
  ],
  Gaming: [
    "The games you play today shape the worlds others inhabit tomorrow.",
    "Subcultures held in contempt may one day rule the contemptuous.",
  ],
  Governance: [
    "Policy without imagination leaves the future to chance; imagination without policy limits the future to fiction.",
    "Wet or wired, intelligence flourishes under thoughtful stewardship.",
  ],
  Infrastructure: [
    "Complex tools are forged for patient hands.",
    "The rhizome is not the only structure worth borrowing from nature.",
  ],
  Interoperability: [
    "Culture united under common standards will outlive any monopoly.",
    "What’s the difference between ‘working together’ and ‘interoperability’? Start another session to find out!",
    "Those who find clarity in division are often the most deluded.",
  ],
  Legal: [
    "The compression of the world’s knowledge does not necessitate the compression of the responsibility of the individual.",
    "Just as new tools require new rules, new rules breathe life into old tools.",
  ],
  Ownership: [
    "Tools for all must be kept sharp by everyone.",
    "I browsed the new FAE website and all I got was this lousy receipt.",
  ],
  Policy: [
    "Good policy excavates space for the unexpected.",
    "Guard what is sacred before the architecture of the future makes it profane.",
  ],
  "Public Value": [
    "What is precious for the market may have no value for the community.",
    "Judge not the Serpentine on its ticket sales, but on the number of first dates facilitated by its exhibitions.",
    "Is any of this making sense to you?",
  ],
  Robotics: [
    "The body of the machine is a question about yours—follow the gesture that almost looks human.",
    "Automation is a wish; find where the wish still needs a hand.",
  ],
  Simulation: [
    "Everything can be computer.",
    "Making space for community play is as essential as public debate.",
  ],
  Stewardship: [
    "Care for what endures and those who are lost will find their way back to it.",
    "Not all stewards wear lanyards.",
  ],
  Systems: [
    "Between opt-in and opt-out stretches a wasteland of choice.",
    "Where artists use systems as raw materials, anything can happen.",
    "The bravest act in any world is to imagine it otherwise.",
  ],
  "Virtual Environments": [
    "Our future is not written in the stars, but in the frameworks we choose to challenge.",
    "To locate new worlds, first map the one you find yourself in.",
  ],
  Worldbuilding: [
    "The medium is not only the message, but the world within which the message is received.",
    "Attention and reflection are both acts of worldbuilding.",
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

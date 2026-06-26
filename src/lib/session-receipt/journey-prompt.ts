import { dominantFocusTag } from "./focus-tag-tally";
import { pickTagFortune } from "./tag-fortunes";
import type { SessionEvent } from "./types";
import { THERMAL_JOURNEY_PROMPT_MAX_LENGTH } from "./thermal-spec";

export const TAG_FORTUNE_PREFIX = "To guide your journey: ";
/** @deprecated Use TAG_FORTUNE_PREFIX */
export const JOURNEY_PROMPT_PREFIX = TAG_FORTUNE_PREFIX;
export const JOURNEY_PROMPT_MAX_LENGTH = THERMAL_JOURNEY_PROMPT_MAX_LENGTH;

function truncateFortune(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= JOURNEY_PROMPT_MAX_LENGTH) return trimmed;
  return `${trimmed.slice(0, JOURNEY_PROMPT_MAX_LENGTH - 1).trimEnd()}…`;
}

/**
 * Tag Fortune suffix (max 150 chars) from the session's dominant Focus tag.
 * Prefix added at render time.
 */
export function deriveTagFortune(
  events: readonly SessionEvent[],
  seed: number,
): string {
  const tag = dominantFocusTag(events);
  return truncateFortune(pickTagFortune(tag, seed));
}

/** @deprecated Use deriveTagFortune */
export const deriveJourneyPrompt = deriveTagFortune;

export function formatTagFortuneLine(fortune: string): string {
  return `${TAG_FORTUNE_PREFIX}${fortune}`;
}

/** @deprecated Use formatTagFortuneLine */
export const formatJourneyPromptLine = formatTagFortuneLine;

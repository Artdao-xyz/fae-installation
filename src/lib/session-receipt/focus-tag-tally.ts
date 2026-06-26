import type { SessionEvent } from "./types";

/** Count focus-tag searches (toggles on) and reads (page opens tagged with that focus). */
export function tallyFocusTags(
  events: readonly SessionEvent[],
): Map<string, number> {
  const tally = new Map<string, number>();

  for (const event of events) {
    if (event.type === "tag" && event.taxonomy === "focus" && event.action === "on") {
      tally.set(event.label, (tally.get(event.label) ?? 0) + 1);
      continue;
    }
    if (event.type === "page" && event.focusAreas?.length) {
      for (const label of event.focusAreas) {
        tally.set(label, (tally.get(label) ?? 0) + 1);
      }
    }
  }

  return tally;
}

/** Focus tag with the highest tally; ties broken by the latest interaction. */
export function dominantFocusTag(events: readonly SessionEvent[]): string | null {
  const tally = tallyFocusTags(events);
  if (tally.size === 0) return null;

  const maxCount = Math.max(...tally.values());
  const candidates = new Set(
    [...tally.entries()]
      .filter(([, count]) => count === maxCount)
      .map(([label]) => label),
  );

  let lastSeen: string | null = null;
  for (const event of events) {
    if (
      event.type === "tag" &&
      event.taxonomy === "focus" &&
      event.action === "on" &&
      candidates.has(event.label)
    ) {
      lastSeen = event.label;
    }
    if (event.type === "page" && event.focusAreas?.length) {
      for (const label of event.focusAreas) {
        if (candidates.has(label)) lastSeen = label;
      }
    }
  }

  return lastSeen;
}

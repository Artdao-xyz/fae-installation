import type { SessionEvent, SessionTagTaxonomy } from "./types";

export type QrSummaryTier = 0 | 1 | 2 | 3 | 4;

const TIER_CONFIG: Record<
  QrSummaryTier,
  {
    maxTitleLength: number;
    maxTagOnEvents: number | null;
    maxPageEvents: number | null;
    tagsAsFinalSnapshot: boolean;
    pagesOnly: boolean;
  }
> = {
  0: {
    maxTitleLength: Number.POSITIVE_INFINITY,
    maxTagOnEvents: null,
    maxPageEvents: null,
    tagsAsFinalSnapshot: false,
    pagesOnly: false,
  },
  1: {
    maxTitleLength: 48,
    maxTagOnEvents: 40,
    maxPageEvents: 25,
    tagsAsFinalSnapshot: false,
    pagesOnly: false,
  },
  2: {
    maxTitleLength: 32,
    maxTagOnEvents: 20,
    maxPageEvents: 15,
    tagsAsFinalSnapshot: true,
    pagesOnly: false,
  },
  3: {
    maxTitleLength: 28,
    maxTagOnEvents: 12,
    maxPageEvents: 10,
    tagsAsFinalSnapshot: true,
    pagesOnly: false,
  },
  4: {
    maxTitleLength: 0,
    maxTagOnEvents: 0,
    maxPageEvents: 0,
    tagsAsFinalSnapshot: false,
    pagesOnly: true,
  },
};

function truncateText(text: string, maxLength: number): string {
  const trimmed = text.trim();
  if (!Number.isFinite(maxLength) || maxLength <= 0) return "";
  if (trimmed.length <= maxLength) return trimmed;
  if (maxLength <= 1) return "…";
  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
}

/** Replay tag toggles — returns one `on` event per active filter at session end. */
export function finalActiveTagEvents(
  events: readonly SessionEvent[],
): SessionEvent[] {
  const active = new Map<
    string,
    { taxonomy: SessionTagTaxonomy; label: string; ts: number }
  >();

  for (const event of events) {
    if (event.type !== "tag") continue;
    const key = `${event.taxonomy}\0${event.label}`;
    if (event.action === "on") {
      active.set(key, {
        taxonomy: event.taxonomy,
        label: event.label,
        ts: event.ts,
      });
    } else {
      active.delete(key);
    }
  }

  return [...active.values()]
    .sort((a, b) => a.ts - b.ts)
    .map(({ taxonomy, label, ts }) => ({
      type: "tag" as const,
      action: "on" as const,
      taxonomy,
      label,
      ts,
    }));
}

function dedupePageEventsByTitle(
  events: readonly SessionEvent[],
): SessionEvent[] {
  const latestByTitle = new Map<string, SessionEvent>();

  for (const event of events) {
    if (event.type !== "page") continue;
    const prev = latestByTitle.get(event.title);
    if (!prev || event.ts >= prev.ts) {
      latestByTitle.set(event.title, event);
    }
  }

  const pages = [...latestByTitle.values()].sort((a, b) => a.ts - b.ts);
  const nonPages = events.filter((event) => event.type !== "page");
  return [...nonPages, ...pages].sort((a, b) => a.ts - b.ts);
}

function dropTagOffEvents(events: readonly SessionEvent[]): SessionEvent[] {
  return events.filter(
    (event) => event.type !== "tag" || event.action === "on",
  );
}

function capMostRecent<T extends { ts: number }>(
  items: readonly T[],
  max: number | null,
): T[] {
  if (max === null || items.length <= max) return [...items];
  return [...items].sort((a, b) => a.ts - b.ts).slice(-max);
}

function applyTitleTruncation(
  events: readonly SessionEvent[],
  maxTitleLength: number,
): SessionEvent[] {
  if (!Number.isFinite(maxTitleLength)) return [...events];

  return events.map((event) => {
    if (event.type === "page") {
      return {
        ...event,
        title: truncateText(event.title, maxTitleLength),
      };
    }
    if (event.type === "tag") {
      return {
        ...event,
        label: truncateText(event.label, maxTitleLength),
      };
    }
    return event;
  });
}

export type SummarizeEventsForQrResult = {
  events: SessionEvent[];
  omittedCount: number;
  tier: QrSummaryTier;
};

/**
 * Produce a smaller event list for the QR payload. Full `receipt.events` stay on
 * the printed transcript; omitted items are counted for digital disclosure.
 */
export function summarizeEventsForQr(
  events: readonly SessionEvent[],
  tier: QrSummaryTier,
): SummarizeEventsForQrResult {
  const config = TIER_CONFIG[tier];
  const originalCount = events.length;

  if (config.pagesOnly || tier === 4) {
    return {
      events: [],
      omittedCount: originalCount,
      tier,
    };
  }

  let working = dropTagOffEvents(events);
  working = dedupePageEventsByTitle(working);

  const pageEvents = working.filter((event) => event.type === "page");
  let tagEvents: SessionEvent[] = working.filter((event) => event.type === "tag");

  if (config.tagsAsFinalSnapshot) {
    tagEvents = finalActiveTagEvents(events);
  }

  const cappedPages = capMostRecent(pageEvents, config.maxPageEvents);
  const cappedTags = capMostRecent(tagEvents, config.maxTagOnEvents);

  let summarized = [...cappedTags, ...cappedPages].sort(
    (a, b) => a.ts - b.ts,
  );
  summarized = applyTitleTruncation(summarized, config.maxTitleLength);

  return {
    events: summarized,
    omittedCount: Math.max(0, originalCount - summarized.length),
    tier,
  };
}

export const QR_SUMMARY_TIERS: readonly QrSummaryTier[] = [0, 1, 2, 3, 4];

import type { SessionEvent, SessionReceipt, SessionTagTaxonomy } from "./types";
import { encodePathField, decodePathField } from "./path-grid";
import { normalizeSessionReceipt } from "./normalize-receipt";
import { pickReceiptViewOrigin } from "./resolve-view-origin";
import { receiptUrlFitsInQr } from "./qr-payload-fit";
import {
  QR_SUMMARY_TIERS,
  summarizeEventsForQr,
  type QrSummaryTier,
} from "./summarize-events-for-qr";

const RECEIPT_VIEW_PATH = "/v";

/** QR payload schema — v2 uses numeric timestamps + indexed taxonomies (smaller matrix). */
const PAYLOAD_VERSION = 2;

const TAXONOMY_TO_INDEX: Record<SessionTagTaxonomy, number> = {
  focus: 0,
  activity: 1,
  format: 2,
  network: 3,
  artist: 4,
};

const INDEX_TO_TAXONOMY: SessionTagTaxonomy[] = [
  "focus",
  "activity",
  "format",
  "network",
  "artist",
];

/** v2 — relative ms from session start. */
type CompactTagV2 = [0, 0 | 1, number, string, number];
type CompactPageV2 = [1, string, number];
type CompactEventV2 = CompactTagV2 | CompactPageV2;

type CompactReceiptV2 = {
  v: typeof PAYLOAD_VERSION;
  s: number;
  e: CompactEventV2[];
  p: string;
  x?: number;
  /** Nibble-packed 16×10 visit grid (base64url). */
  m?: string;
  /** Sparse [cellIndex, visitCount] pairs when fewer than ~half the grid is visited. */
  pv?: number[][];
  st?: number;
  en?: number;
  /** Interactions omitted from QR for scan reliability (digital disclosure). */
  om?: number;
};

/** v1 — ISO timestamps + string taxonomies. */
type CompactTagV1 = ["t", "on" | "off", SessionTagTaxonomy, string, number];
type CompactPageV1 = ["p", string, string | null, number];
type CompactEventV1 = CompactTagV1 | CompactPageV1;

type CompactReceiptV1 = {
  v: 1;
  s: string;
  e: CompactEventV1[];
  p: string;
  x?: string;
};

/** Legacy Phase 1 payloads. */
type CompactReceiptLegacy = {
  s: string;
  e: Array<
    | ["t", "on" | "off", string, string, number]
    | ["p", string, string | null, number]
  >;
  n?: number;
  x?: string;
  p?: string;
};

function isAbsoluteTimestamp(value: number): boolean {
  return value > 1_000_000_000_000;
}

function sessionStartMs(sessionStart: string): number {
  const ms = Date.parse(sessionStart);
  return Number.isFinite(ms) ? ms : 0;
}

function compactEventV2(event: SessionEvent, startMs: number): CompactEventV2 {
  const rel = event.ts - startMs;
  if (event.type === "tag") {
    return [
      0,
      event.action === "on" ? 1 : 0,
      TAXONOMY_TO_INDEX[event.taxonomy],
      event.label,
      rel,
    ];
  }
  return [1, event.title, rel];
}

function expandEventV2(raw: CompactEventV2, startMs: number): SessionEvent | null {
  if (raw[0] === 0) {
    const [, onOff, taxIdx, label, rel] = raw;
    const taxonomy = INDEX_TO_TAXONOMY[taxIdx];
    if (!taxonomy || typeof label !== "string" || typeof rel !== "number") {
      return null;
    }
    const ts = isAbsoluteTimestamp(rel) ? rel : startMs + rel;
    return {
      type: "tag",
      action: onOff === 1 ? "on" : "off",
      label,
      taxonomy,
      ts,
    };
  }
  const [, title, rel] = raw;
  if (typeof title !== "string" || typeof rel !== "number") return null;
  const ts = isAbsoluteTimestamp(rel) ? rel : startMs + rel;
  return { type: "page", title, ts };
}

function expandEventV1(raw: CompactEventV1, startMs: number): SessionEvent | null {
  if (raw[0] === "t") {
    const [, action, taxonomy, label, rel] = raw;
    if (typeof label !== "string" || typeof rel !== "number") return null;
    const ts = isAbsoluteTimestamp(rel) ? rel : startMs + rel;
    return { type: "tag", action, label, taxonomy, ts };
  }
  const [, title, slug, rel] = raw;
  if (typeof title !== "string" || typeof rel !== "number") return null;
  const ts = isAbsoluteTimestamp(rel) ? rel : startMs + rel;
  return { type: "page", title, slug: slug ?? undefined, ts };
}

function expandLegacyEvent(
  raw: CompactReceiptLegacy["e"][number],
  startMs: number,
): SessionEvent | null {
  if (raw[0] === "t") {
    const [, action, taxonomy, label, tsOrRel] = raw;
    const ts = isAbsoluteTimestamp(tsOrRel) ? tsOrRel : startMs + tsOrRel;
    return {
      type: "tag",
      action,
      label,
      taxonomy: taxonomy as SessionTagTaxonomy,
      ts,
    };
  }
  const [, title, slug, tsOrRel] = raw;
  const ts = isAbsoluteTimestamp(tsOrRel) ? tsOrRel : startMs + tsOrRel;
  return {
    type: "page",
    title,
    slug: slug ?? undefined,
    ts,
  };
}

function toBase64Url(json: string): string {
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(encoded: string): string {
  const padded = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (padded.length % 4)) % 4;
  const base64 = padded + "=".repeat(padLen);
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Self-contained blob embedded in the QR code (`?d=`). */
export function encodeReceiptPayload(
  receipt: SessionReceipt,
  options?: {
    events?: readonly SessionEvent[];
    omittedInteractionCount?: number;
  },
): string {
  const startMs = sessionStartMs(receipt.sessionStart);
  const events = options?.events ?? receipt.events;
  const compact: CompactReceiptV2 = {
    v: PAYLOAD_VERSION,
    s: startMs,
    e: events.map((event) => compactEventV2(event, startMs)),
    p: receipt.prompt,
  };
  if (receipt.sessionEnd) {
    compact.x = sessionStartMs(receipt.sessionEnd);
  }
  const omitted = options?.omittedInteractionCount ?? 0;
  if (omitted > 0) {
    compact.om = omitted;
  }
  const pathField = receipt.path ? encodePathField(receipt.path) : null;
  if (pathField) {
    compact.st = pathField.st;
    compact.en = pathField.en;
    if (pathField.m) compact.m = pathField.m;
    if (pathField.pv) compact.pv = pathField.pv;
  }
  return toBase64Url(JSON.stringify(compact));
}

export type ReceiptQrPayload = {
  encoded: string;
  omittedInteractionCount: number;
  qrEventCount: number;
  summaryTier: QrSummaryTier;
};

function encodeEmergencyReceiptPayload(
  receipt: SessionReceipt,
  options?: { includePath?: boolean; promptMax?: number },
): string {
  const includePath = options?.includePath ?? true;
  const promptMax = options?.promptMax ?? 80;
  const startMs = sessionStartMs(receipt.sessionStart);
  const compact: CompactReceiptV2 = {
    v: PAYLOAD_VERSION,
    s: startMs,
    e: [],
    p: receipt.prompt.slice(0, promptMax),
    om: receipt.events.length,
  };
  if (receipt.sessionEnd) {
    compact.x = sessionStartMs(receipt.sessionEnd);
  }
  if (includePath && receipt.path) {
    const pathField = encodePathField(receipt.path);
    if (pathField) {
      compact.st = pathField.st;
      compact.en = pathField.en;
      if (pathField.m) compact.m = pathField.m;
      if (pathField.pv) compact.pv = pathField.pv;
    }
  }
  return toBase64Url(JSON.stringify(compact));
}

function buildEmergencyQrPayload(
  receipt: SessionReceipt,
  origin?: string,
): ReceiptQrPayload {
  const attempts: Array<() => string> = [
    () => encodeEmergencyReceiptPayload(receipt, { includePath: true, promptMax: 150 }),
    () => encodeEmergencyReceiptPayload(receipt, { includePath: true, promptMax: 80 }),
    () => encodeEmergencyReceiptPayload(receipt, { includePath: false, promptMax: 80 }),
    () => encodeEmergencyReceiptPayload(receipt, { includePath: false, promptMax: 40 }),
  ];

  for (const encode of attempts) {
    const encoded = encode();
    const url = buildReceiptViewUrlFromEncoded(encoded, origin);
    if (receiptUrlFitsInQr(url)) {
      return {
        encoded,
        omittedInteractionCount: receipt.events.length,
        qrEventCount: 0,
        summaryTier: 4,
      };
    }
  }

  const lastEncode = attempts[attempts.length - 1]!;
  return {
    encoded: lastEncode(),
    omittedInteractionCount: receipt.events.length,
    qrEventCount: 0,
    summaryTier: 4,
  };
}

/**
 * Pick the richest event summary that still fits in a scannable QR for `origin`.
 * Always returns a payload — falls back to journey metadata only if needed.
 */
export function buildReceiptQrPayload(
  receipt: SessionReceipt,
  origin?: string,
): ReceiptQrPayload {
  for (const tier of QR_SUMMARY_TIERS) {
    const summary = summarizeEventsForQr(receipt.events, tier);
    const encoded = encodeReceiptPayload(receipt, {
      events: summary.events,
      omittedInteractionCount: summary.omittedCount,
    });
    const url = buildReceiptViewUrlFromEncoded(encoded, origin);
    if (receiptUrlFitsInQr(url)) {
      if (summary.omittedCount > 0 || tier > 0) {
        logQrSummary(tier, receipt.events.length, summary);
      }
      return {
        encoded,
        omittedInteractionCount: summary.omittedCount,
        qrEventCount: summary.events.length,
        summaryTier: tier,
      };
    }
  }

  const encoded = buildEmergencyQrPayload(receipt, origin);
  logQrSummary(4, receipt.events.length, {
    events: [],
    omittedCount: receipt.events.length,
  });
  return encoded;
}

function logQrSummary(
  tier: QrSummaryTier,
  originalCount: number,
  summary: { events: SessionEvent[]; omittedCount: number },
): void {
  if (typeof console === "undefined") return;
  console.info(
    `[session-receipt] QR summary tier ${tier}: ${summary.events.length}/${originalCount} interactions encoded` +
      (summary.omittedCount > 0
        ? ` (${summary.omittedCount} omitted for scan reliability)`
        : ""),
  );
}

export function decodeReceiptPayload(encoded: string): SessionReceipt | null {
  try {
    const parsed = JSON.parse(fromBase64Url(encoded)) as
      | CompactReceiptV2
      | CompactReceiptV1
      | CompactReceiptLegacy;

    if (!parsed || !Array.isArray(parsed.e)) return null;

    if ("v" in parsed && parsed.v === PAYLOAD_VERSION && typeof parsed.s === "number") {
      const sessionStart = new Date(parsed.s).toISOString();
      const events = parsed.e
        .map((raw) => expandEventV2(raw as CompactEventV2, parsed.s))
        .filter((event): event is SessionEvent => event != null);
      if (typeof parsed.p !== "string") return null;
      const path = decodePathField(parsed);
      return normalizeSessionReceipt(sessionStart, events, {
        sessionEnd:
          typeof parsed.x === "number"
            ? new Date(parsed.x).toISOString()
            : undefined,
        prompt: parsed.p,
        path,
        qrOmittedInteractionCount:
          typeof parsed.om === "number" && parsed.om > 0 ? parsed.om : undefined,
      });
    }

    if (typeof parsed.s !== "string") return null;
    const startMs = sessionStartMs(parsed.s);

    if ("v" in parsed && parsed.v === 1) {
      const events = parsed.e
        .map((raw) => expandEventV1(raw as CompactEventV1, startMs))
        .filter((event): event is SessionEvent => event != null);
      if (typeof parsed.p !== "string") return null;
      return normalizeSessionReceipt(parsed.s, events, {
        sessionEnd: typeof parsed.x === "string" ? parsed.x : undefined,
        prompt: parsed.p,
      });
    }

    const events = (parsed.e as CompactReceiptLegacy["e"])
      .map((raw) => expandLegacyEvent(raw, startMs))
      .filter((event): event is SessionEvent => event != null);

    return normalizeSessionReceipt(parsed.s, events, {
      sessionEnd: typeof parsed.x === "string" ? parsed.x : undefined,
      prompt: typeof parsed.p === "string" ? parsed.p : undefined,
    });
  } catch {
    return null;
  }
}

export function buildReceiptViewUrlFromEncoded(
  encoded: string,
  origin?: string,
): string {
  const base = pickReceiptViewOrigin(origin);
  return `${base}${RECEIPT_VIEW_PATH}?d=${encodeURIComponent(encoded)}`;
}

export function buildReceiptViewUrl(
  receipt: SessionReceipt,
  origin?: string,
): string {
  const { encoded } = buildReceiptQrPayload(receipt, origin);
  const url = buildReceiptViewUrlFromEncoded(encoded, origin);

  if (typeof console !== "undefined" && url.length > 900) {
    console.warn(
      `[session-receipt] QR URL is ${url.length} chars — matrix may be dense. Summary tier reduced event count.`,
    );
  }

  return url;
}

/** Fields stored inside the QR payload (for debugging). */
export function describeReceiptPayload(receipt: SessionReceipt): {
  version: number;
  sessionStart: string;
  sessionEnd?: string;
  prompt: string;
  eventCount: number;
  qrEventCount: number;
  omittedInteractionCount: number;
  summaryTier: QrSummaryTier;
  encodedLength: number;
  viewPath: string;
} {
  const qr = buildReceiptQrPayload(receipt);
  return {
    version: PAYLOAD_VERSION,
    sessionStart: receipt.sessionStart,
    sessionEnd: receipt.sessionEnd,
    prompt: receipt.prompt,
    eventCount: receipt.events.length,
    qrEventCount: qr.qrEventCount,
    omittedInteractionCount: qr.omittedInteractionCount,
    summaryTier: qr.summaryTier,
    encodedLength: qr.encoded.length,
    viewPath: RECEIPT_VIEW_PATH,
  };
}

import type { SessionEvent, SessionReceipt, SessionTagTaxonomy } from "./types";
import { encodePathField, decodePathField } from "./path-grid";
import { normalizeSessionReceipt } from "./normalize-receipt";
import { pickReceiptViewOrigin } from "./resolve-view-origin";

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
export function encodeReceiptPayload(receipt: SessionReceipt): string {
  const startMs = sessionStartMs(receipt.sessionStart);
  const compact: CompactReceiptV2 = {
    v: PAYLOAD_VERSION,
    s: startMs,
    e: receipt.events.map((event) => compactEventV2(event, startMs)),
    p: receipt.prompt,
  };
  if (receipt.sessionEnd) {
    compact.x = sessionStartMs(receipt.sessionEnd);
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

const RECEIPT_VIEW_PATH = "/v";

export function buildReceiptViewUrl(
  receipt: SessionReceipt,
  origin?: string,
): string {
  const base = pickReceiptViewOrigin(origin);
  const d = encodeReceiptPayload(receipt);
  const url = `${base}${RECEIPT_VIEW_PATH}?d=${encodeURIComponent(d)}`;

  if (typeof console !== "undefined" && url.length > 900) {
    console.warn(
      `[session-receipt] QR URL is ${url.length} chars — matrix may be dense. Fewer events = easier scan.`,
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
  encodedLength: number;
  viewPath: string;
} {
  const encoded = encodeReceiptPayload(receipt);
  return {
    version: PAYLOAD_VERSION,
    sessionStart: receipt.sessionStart,
    sessionEnd: receipt.sessionEnd,
    prompt: receipt.prompt,
    eventCount: receipt.events.length,
    encodedLength: encoded.length,
    viewPath: RECEIPT_VIEW_PATH,
  };
}

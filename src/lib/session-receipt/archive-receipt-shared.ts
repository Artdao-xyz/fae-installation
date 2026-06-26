import type { SessionReceipt } from "./types";

export type ReceiptArchiveRecord = {
  archivedAt: string;
  receipt: SessionReceipt;
};

export type ReceiptArchiveSummary = {
  index: number;
  archivedAt: string;
  sessionStart: string;
  sessionEnd?: string;
  eventCount: number;
  hasPath: boolean;
};

export function isSessionReceipt(value: unknown): value is SessionReceipt {
  if (!value || typeof value !== "object") return false;
  const r = value as SessionReceipt;
  return (
    typeof r.sessionStart === "string" &&
    Array.isArray(r.events) &&
    typeof r.seed === "number" &&
    typeof r.prompt === "string"
  );
}

export function parseReceiptArchiveLine(line: string): ReceiptArchiveRecord | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed) as ReceiptArchiveRecord;
    if (typeof parsed.archivedAt !== "string" || !isSessionReceipt(parsed.receipt)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function toReceiptArchiveSummary(
  record: ReceiptArchiveRecord,
  index: number,
): ReceiptArchiveSummary {
  return {
    index,
    archivedAt: record.archivedAt,
    sessionStart: record.receipt.sessionStart,
    sessionEnd: record.receipt.sessionEnd,
    eventCount: record.receipt.events.length,
    hasPath: Boolean(record.receipt.path),
  };
}

/** Parse pasted JSON — accepts a full archive line or a bare `SessionReceipt`. */
export function parseReceiptArchiveJson(raw: string): SessionReceipt | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (isSessionReceipt(parsed)) return parsed;

    if (parsed && typeof parsed === "object" && "receipt" in parsed) {
      const receipt = (parsed as ReceiptArchiveRecord).receipt;
      if (isSessionReceipt(receipt)) return receipt;
    }

    return null;
  } catch {
    return null;
  }
}

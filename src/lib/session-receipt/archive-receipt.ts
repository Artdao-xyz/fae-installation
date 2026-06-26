import fs from "node:fs/promises";
import path from "node:path";
import { localDataRoot } from "@/lib/local-data/paths";
import type { SessionReceipt } from "./types";
import {
  parseReceiptArchiveLine,
  toReceiptArchiveSummary,
  type ReceiptArchiveRecord,
  type ReceiptArchiveSummary,
} from "./archive-receipt-shared";

export type { ReceiptArchiveRecord, ReceiptArchiveSummary } from "./archive-receipt-shared";
export {
  isSessionReceipt,
  parseReceiptArchiveJson,
  parseReceiptArchiveLine,
  toReceiptArchiveSummary,
} from "./archive-receipt-shared";

const LOG_PREFIX = "[session-receipt-archive]";

export function receiptArchivePath(): string {
  const override = process.env.FAE_RECEIPT_ARCHIVE_PATH?.trim();
  if (override) return path.resolve(override);
  return path.join(localDataRoot(), "receipts.jsonl");
}

export function isReceiptArchiveEnabled(): boolean {
  const raw = process.env.FAE_RECEIPT_ARCHIVE?.trim().toLowerCase();
  if (raw === "0" || raw === "false" || raw === "no") return false;
  return true;
}

async function archiveSessionReceiptLocal(receipt: SessionReceipt): Promise<void> {
  const record: ReceiptArchiveRecord = {
    archivedAt: new Date().toISOString(),
    receipt,
  };
  const line = `${JSON.stringify(record)}\n`;
  const filePath = receiptArchivePath();

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.appendFile(filePath, line, { encoding: "utf8", flag: "a" });
}

/**
 * Append the full receipt to local JSONL. Never throws — archive failures are
 * logged and ignored so printing and the installation UI keep working.
 */
export function scheduleSessionReceiptArchive(receipt: SessionReceipt): void {
  if (!isReceiptArchiveEnabled()) return;

  void archiveSessionReceiptLocal(receipt).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      `${LOG_PREFIX} Local archive failed (print unaffected): ${message}`,
    );
  });
}

async function readReceiptArchiveLines(): Promise<string[]> {
  const filePath = receiptArchivePath();
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return raw.split("\n");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

/** All valid records in file order (oldest first). */
export async function readReceiptArchiveRecords(): Promise<ReceiptArchiveRecord[]> {
  const records: ReceiptArchiveRecord[] = [];

  for (const line of await readReceiptArchiveLines()) {
    const record = parseReceiptArchiveLine(line);
    if (record) {
      records.push(record);
    } else if (line.trim()) {
      console.warn(`${LOG_PREFIX} Skipping corrupt archive line`);
    }
  }

  return records;
}

export async function readReceiptArchiveSummaries(): Promise<ReceiptArchiveSummary[]> {
  const records = await readReceiptArchiveRecords();
  return records.map((record, index) => toReceiptArchiveSummary(record, index));
}

export async function getReceiptArchiveRecordByIndex(
  index: number,
): Promise<ReceiptArchiveRecord | null> {
  if (!Number.isInteger(index) || index < 0) return null;

  let current = 0;
  for (const line of await readReceiptArchiveLines()) {
    const record = parseReceiptArchiveLine(line);
    if (!record) continue;
    if (current === index) return record;
    current += 1;
  }

  return null;
}

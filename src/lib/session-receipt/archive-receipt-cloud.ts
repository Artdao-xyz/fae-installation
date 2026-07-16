import type { ReceiptArchiveRecord } from "./archive-receipt-shared";
import type { SessionReceipt } from "./types";

const LOG_PREFIX = "[session-receipt-archive-cloud]";

function isR2ReceiptArchiveConfigured(): boolean {
  return Boolean(
    process.env.R2_BUCKET_NAME?.trim() &&
      process.env.R2_ACCOUNT_ID?.trim() &&
      process.env.R2_ACCESS_KEY_ID?.trim() &&
      process.env.R2_SECRET_ACCESS_KEY?.trim(),
  );
}

function buildReceiptArchiveRecord(receipt: SessionReceipt): ReceiptArchiveRecord {
  return {
    archivedAt: new Date().toISOString(),
    receipt,
  };
}

function resolveInstallationId(): string {
  return process.env.RECEIPT_ARCHIVE_INSTALLATION_ID?.trim() || "default";
}

export function isReceiptCloudArchiveEnabled(): boolean {
  const raw = process.env.RECEIPT_ARCHIVE_CLOUD?.trim().toLowerCase();
  if (raw === "0" || raw === "false" || raw === "no") return false;
  return isR2ReceiptArchiveConfigured();
}

async function uploadReceiptArchiveRecord(
  record: ReceiptArchiveRecord,
): Promise<void> {
  const { putReceiptArchiveToR2 } = await import("./r2-receipt-archive");
  const key = await putReceiptArchiveToR2(resolveInstallationId(), record);
  console.info(`${LOG_PREFIX} Uploaded to R2: ${key}`);
}

/**
 * Mirror a printed receipt to Cloudflare R2 from the kiosk (direct upload).
 * Never throws — failures are logged and printing continues.
 */
export function scheduleSessionReceiptCloudArchive(
  receipt: SessionReceipt,
): void {
  if (!isReceiptCloudArchiveEnabled()) return;

  const record = buildReceiptArchiveRecord(receipt);

  void uploadReceiptArchiveRecord(record).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      `${LOG_PREFIX} R2 upload failed (print unaffected): ${message}`,
    );
  });
}

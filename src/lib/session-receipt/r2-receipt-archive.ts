import type { ReceiptArchiveRecord } from "./archive-receipt-shared";

async function r2Client() {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  if (!accountId || !accessKeyId || !secretAccessKey) return null;

  const { S3Client } = await import("@aws-sdk/client-s3");
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function receiptArchiveObjectKey(
  installationId: string,
  archivedAt: string,
  seed: number,
): string {
  const prefix = process.env.R2_RECEIPT_PREFIX?.trim() || "receipts";
  const safeInstallation = installationId.replace(/[^a-zA-Z0-9._-]+/g, "-");
  const safeTime = archivedAt.replace(/[:.]/g, "-");
  return `${prefix}/${safeInstallation}/${safeTime}-${seed}.json`;
}

export async function putReceiptArchiveToR2(
  installationId: string,
  record: ReceiptArchiveRecord,
): Promise<string> {
  const client = await r2Client();
  const bucket = process.env.R2_BUCKET_NAME?.trim();
  if (!client || !bucket) {
    throw new Error("R2 receipt archive is not configured");
  }

  const key = receiptArchiveObjectKey(
    installationId,
    record.archivedAt,
    record.receipt.seed,
  );

  const { PutObjectCommand } = await import("@aws-sdk/client-s3");
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: `${JSON.stringify(record)}\n`,
      ContentType: "application/json",
    }),
  );

  return key;
}

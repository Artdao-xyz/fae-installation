import type { Metadata } from "next";
import Link from "next/link";
import {
  getReceiptArchiveRecordByIndex,
  readReceiptArchiveSummaries,
} from "@/lib/session-receipt/archive-receipt";
import { logSessionReceiptServer } from "@/lib/session-receipt/log";
import { RECEIPT_ARTIFACT_TITLE } from "@/lib/session-receipt/types";
import {
  ReceiptDigitalView,
  ReceiptDigitalViewShell,
} from "@/components/session-receipt/ReceiptDigitalView";
import { ArchiveHome } from "./ArchiveHome";

type VArchivePageProps = {
  searchParams: Promise<{ i?: string }>;
};

export async function generateMetadata({
  searchParams,
}: VArchivePageProps): Promise<Metadata> {
  const { i } = await searchParams;
  const title =
    i !== undefined
      ? `Archive — ${RECEIPT_ARTIFACT_TITLE}`
      : `Receipt archive — ${RECEIPT_ARTIFACT_TITLE}`;

  return {
    title,
    robots: { index: false, follow: false },
  };
}

async function ArchiveReceiptView({ index }: { index: number }) {
  if (!Number.isInteger(index) || index < 0) {
    return (
      <ReceiptDigitalViewShell>
        <p className="max-w-sm text-center font-suisseintl text-sm text-ink-body">
          Missing or invalid archive index. Open a receipt from{" "}
          <Link href="/v/archive" className="underline">
            /v/archive
          </Link>{" "}
          or use <code className="font-mono">?i=0</code>.
        </p>
      </ReceiptDigitalViewShell>
    );
  }

  const record = await getReceiptArchiveRecordByIndex(index);
  if (!record) {
    return (
      <ReceiptDigitalViewShell>
        <p className="max-w-sm text-center font-suisseintl text-sm text-ink-body">
          No archived receipt at index {index}.
        </p>
      </ReceiptDigitalViewShell>
    );
  }

  logSessionReceiptServer(
    `GET /v/archive?i=${index} — rebuilt from local JSONL`,
    record.receipt,
  );

  return (
    <ReceiptDigitalView receipt={record.receipt} variant="confirm" />
  );
}

export default async function VArchivePage({ searchParams }: VArchivePageProps) {
  const { i } = await searchParams;

  if (i !== undefined) {
    const index = Number.parseInt(i, 10);
    return <ArchiveReceiptView index={index} />;
  }

  const summaries = await readReceiptArchiveSummaries();
  return <ArchiveHome summaries={summaries} />;
}

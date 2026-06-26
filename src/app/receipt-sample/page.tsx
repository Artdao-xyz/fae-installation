import type { Metadata } from "next";
import { ReceiptSampleView } from "@/components/session-receipt/ReceiptSampleView";
import { RECEIPT_ARTIFACT_TITLE } from "@/lib/session-receipt/types";

export const metadata: Metadata = {
  title: `${RECEIPT_ARTIFACT_TITLE} — print preview`,
  robots: { index: false, follow: false },
};

export default function ReceiptSamplePage() {
  return <ReceiptSampleView />;
}

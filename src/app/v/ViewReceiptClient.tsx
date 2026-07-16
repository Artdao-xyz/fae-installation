"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { decodeReceiptPayload } from "@/lib/session-receipt/encode";
import {
  ReceiptDigitalView,
  ReceiptDigitalViewShell,
} from "@/components/session-receipt/ReceiptDigitalView";

type ViewReceiptClientProps = {
  /** Server-read `d` param — survives client navigations where searchParams lag. */
  encoded?: string;
  /** Server-built `/v?d=` URL for the share QR on scanned pages. */
  shareScanUrl?: string;
};

export function ViewReceiptClient({
  encoded: encodedFromServer,
  shareScanUrl,
}: ViewReceiptClientProps) {
  const searchParams = useSearchParams();
  const encoded = searchParams.get("d") ?? encodedFromServer ?? null;

  const receipt = useMemo(
    () => (encoded ? decodeReceiptPayload(encoded) : null),
    [encoded],
  );

  if (!encoded || !receipt) {
    return (
      <ReceiptDigitalViewShell>
        <p className="max-w-sm text-center font-suisseintl text-sm text-ink-body">
          This receipt link is invalid or incomplete. Scan the QR code printed on
          your session receipt.
        </p>
      </ReceiptDigitalViewShell>
    );
  }

  return (
    <ReceiptDigitalView
      receipt={receipt}
      encoded={encoded}
      variant="digital"
      shareScanUrl={shareScanUrl}
      showQr={false}
    />
  );
}

"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { decodeReceiptPayload } from "@/lib/session-receipt/encode";
import {
  ReceiptDigitalView,
  ReceiptDigitalViewShell,
} from "@/components/session-receipt/ReceiptDigitalView";

export function ViewReceiptClient() {
  const searchParams = useSearchParams();
  const encoded = searchParams.get("d");

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

  return <ReceiptDigitalView receipt={receipt} encoded={encoded} />;
}

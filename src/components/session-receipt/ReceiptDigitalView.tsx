"use client";

import type { ReactNode } from "react";
import type { SessionReceipt } from "@/lib/session-receipt/types";
import { useReceiptViewScroll } from "@/lib/session-receipt/use-receipt-view-scroll";
import { ReceiptPaper } from "./ReceiptPaper";

type ReceiptDigitalViewProps = {
  receipt: SessionReceipt;
  encoded: string;
};

const receiptSafePadding = {
  paddingTop: "max(1rem, env(safe-area-inset-top))",
  paddingRight: "max(1rem, env(safe-area-inset-right))",
  paddingBottom: "max(2rem, env(safe-area-inset-bottom))",
  paddingLeft: "max(1rem, env(safe-area-inset-left))",
} as const;

/** Digital twin — full-width receipt; document scroll on mobile via `receipt-view-route`. */
export function ReceiptDigitalView({
  receipt,
  encoded,
}: ReceiptDigitalViewProps) {
  useReceiptViewScroll();

  return (
    <main
      className="flex min-h-dvh flex-col items-center overflow-x-hidden bg-[#e9e9e9]"
      style={receiptSafePadding}
    >
      <ReceiptPaper receipt={receipt} variant="digital" encoded={encoded} />
    </main>
  );
}

export function ReceiptDigitalViewShell({
  children,
}: {
  children: ReactNode;
}) {
  useReceiptViewScroll();

  return (
    <main
      className="flex min-h-dvh items-center justify-center overflow-x-hidden bg-[#e9e9e9] p-6"
      style={receiptSafePadding}
    >
      {children}
    </main>
  );
}

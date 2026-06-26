"use client";

import type { ReactNode } from "react";
import type { SessionReceipt } from "@/lib/session-receipt/types";
import { RECEIPT_DIGITAL_MAX_WIDTH_PX } from "@/lib/session-receipt/thermal-spec";
import { useReceiptViewScroll } from "@/lib/session-receipt/use-receipt-view-scroll";
import { ReceiptPaper, type ReceiptPaperVariant } from "./ReceiptPaper";

type ReceiptDigitalViewProps = {
  receipt: SessionReceipt;
  /** QR `d` payload from a scanned link — omit when rendering from full archived JSON. */
  encoded?: string;
  /**
   * `digital` = /v after QR scan. `confirm` = kiosk preview / archive restore
   * (same framing as the post-print modal).
   */
  variant?: Extract<ReceiptPaperVariant, "digital" | "confirm">;
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
  variant = "digital",
}: ReceiptDigitalViewProps) {
  useReceiptViewScroll();

  const paper = (
    <ReceiptPaper
      receipt={receipt}
      variant={variant}
      encoded={encoded}
    />
  );

  return (
    <main
      className="flex min-h-dvh flex-col items-center overflow-x-hidden bg-[#e9e9e9]"
      style={receiptSafePadding}
    >
      {variant === "confirm" ? (
        <div
          className="mx-auto h-fit w-full shrink-0 overflow-hidden shadow-[0px_4px_10px_0px_rgba(0,0,0,0.05)]"
          style={{ maxWidth: RECEIPT_DIGITAL_MAX_WIDTH_PX }}
        >
          {paper}
        </div>
      ) : (
        paper
      )}
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

"use client";

import { useRef, type ReactNode } from "react";
import type { SessionReceipt } from "@/lib/session-receipt/types";
import { useReceiptViewScroll } from "@/lib/session-receipt/use-receipt-view-scroll";
import { ReceiptDigitalCardFrame } from "./ReceiptDigitalCardFrame";
import { ReceiptDownloadButton } from "./ReceiptDownloadButton";
import { ReceiptPaper, type ReceiptPaperVariant } from "./ReceiptPaper";

type ReceiptDigitalViewProps = {
  receipt: SessionReceipt;
  /** QR `d` payload from a scanned link — omit when rendering from full archived JSON. */
  encoded?: string;
  /** Full `/v?d=` URL for client-side share QR (set on scanned /v pages). */
  shareScanUrl?: string;
  /** Matches kiosk post-print preview (`confirm`). */
  variant?: Extract<ReceiptPaperVariant, "digital" | "confirm">;
  /** Passed through to {@link ReceiptPaper} (default on — same as pre-layout work). */
  showQr?: boolean;
  /** Show a PNG download button below the card (scanned `/v` pages). */
  showDownloadButton?: boolean;
};

const receiptSafePadding = {
  paddingTop: "max(1rem, env(safe-area-inset-top))",
  paddingRight: "max(1rem, env(safe-area-inset-right))",
  paddingBottom: "max(2rem, env(safe-area-inset-bottom))",
  paddingLeft: "max(1rem, env(safe-area-inset-left))",
} as const;

/** Digital twin — same card framing as kiosk confirm; scrolls on mobile via `receipt-view-route`. */
export function ReceiptDigitalView({
  receipt,
  encoded,
  shareScanUrl,
  variant = "confirm",
  showQr = true,
  showDownloadButton = false,
}: ReceiptDigitalViewProps) {
  useReceiptViewScroll();
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <main
      className="flex min-h-dvh w-full min-w-0 flex-col items-center overflow-x-hidden bg-[#e9e9e9]"
      style={receiptSafePadding}
    >
      <div className="w-full min-w-0 max-w-full">
        <ReceiptDigitalCardFrame
          ref={cardRef}
          className="shadow-[0px_4px_10px_0px_rgba(0,0,0,0.05)]"
        >
          <ReceiptPaper
            receipt={receipt}
            variant={variant}
            encoded={encoded}
            shareScanUrl={shareScanUrl}
            showQr={showQr}
          />
        </ReceiptDigitalCardFrame>
        {showDownloadButton ? (
          <ReceiptDownloadButton
            captureRef={cardRef}
            sessionStart={receipt.sessionStart}
          />
        ) : null}
      </div>
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

"use client";

import { SAMPLE_SESSION_RECEIPT } from "@/lib/session-receipt/sample-receipt";
import { ReceiptPaper } from "./ReceiptPaper";

/** 58 mm thermal preview — closest on-screen match to physical print. */
export function ReceiptSampleView() {
  return (
    <main className="flex min-h-dvh flex-col items-center bg-[#e9e9e9] px-4 py-8">
      <div className="mb-6 flex w-full max-w-md flex-col gap-2 font-mono text-xs text-black/70">
        <p>Thermal print preview (58 mm). For aesthetic review before hardware.</p>
        <p>
          <a
            href="/api/receipt-sample/escpos"
            download="receipt-sample.escpos"
            className="underline"
          >
            Download ESC/POS file
          </a>
          {" · Mac: "}
          <span className="text-black/50">
            File → Print → Save as PDF for a static snapshot
          </span>
        </p>
      </div>
      <ReceiptPaper receipt={SAMPLE_SESSION_RECEIPT} variant="thermal" />
    </main>
  );
}

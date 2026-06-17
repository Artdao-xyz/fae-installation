"use client";

import { useEffect } from "react";
import { OpenSvgIcon } from "@/components/ui/icons/OpenSvgIcon";
import type { SessionReceipt } from "@/lib/session-receipt/types";
import { InstallationChromeButton } from "./InstallationChromeButton";
import type { PrintStatus } from "./print-status";
import { ReceiptPaper } from "./ReceiptPaper";

type ReceiptPreviewModalProps = {
  receipt: SessionReceipt;
  printStatus: PrintStatus;
  printMessage: string | null;
  onClose: () => void;
};

export function ReceiptPreviewModal({
  receipt,
  printStatus,
  printMessage,
  onClose,
}: ReceiptPreviewModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Receipt preview"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-md flex-col items-stretch gap-3 overflow-y-auto overscroll-y-contain px-1 pb-2"
        onClick={(e) => e.stopPropagation()}
      >
        <ReceiptPaper receipt={receipt} variant="digital" />

        {printMessage ? (
          <p
            className={`text-center font-fira-mono text-xs ${
              printStatus === "idle" ? "text-green-800" : "text-amber-800"
            }`}
          >
            {printMessage}
          </p>
        ) : null}

        <InstallationChromeButton framed onClick={onClose} aria-label="Close receipt">
          <OpenSvgIcon className="shrink-0 -rotate-90" />
          <span>Close</span>
        </InstallationChromeButton>
      </div>
    </div>
  );
}

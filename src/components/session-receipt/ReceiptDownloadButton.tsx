"use client";

import { useCallback, useState, type RefObject } from "react";
import {
  downloadReceiptImage,
  receiptImageFilename,
} from "@/lib/session-receipt/download-receipt-image";

type ReceiptDownloadButtonProps = {
  captureRef: RefObject<HTMLElement | null>;
  sessionStart: string;
};

export function ReceiptDownloadButton({
  captureRef,
  sessionStart,
}: ReceiptDownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = useCallback(async () => {
    const element = captureRef.current;
    if (!element || downloading) return;

    setDownloading(true);
    setError(null);
    try {
      await downloadReceiptImage(
        element,
        receiptImageFilename(sessionStart),
      );
    } catch {
      setError("Could not save the image. Try again.");
    } finally {
      setDownloading(false);
    }
  }, [captureRef, downloading, sessionStart]);

  return (
    <div className="mt-6 flex w-full flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => void handleDownload()}
        disabled={downloading}
        className="border border-solid border-border bg-white px-6 py-3 font-mono text-sm text-black hover:bg-black/5 disabled:opacity-50"
      >
        {downloading ? "Saving…" : "Download receipt"}
      </button>
      {error ? (
        <p className="max-w-xs text-center font-mono text-xs text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

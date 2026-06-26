"use client";

import { useInstallationPrinterReady } from "./InstallationHealthGuard";
import { useSessionReceipt } from "./SessionReceiptProvider";

export function InstallationPrinterBanner() {
  const { enabled, recording, previewOpen, screensaverActive } =
    useSessionReceipt();
  const printerReady = useInstallationPrinterReady();

  const visible =
    enabled &&
    !screensaverActive &&
    printerReady === false &&
    (recording || previewOpen);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-6 flex justify-center px-6"
      role="status"
      aria-live="polite"
    >
      <p className="max-w-lg rounded-sm border-thin border-solid border-border bg-surface-canvas/95 px-4 py-2 text-center font-fira-mono text-xs leading-4 text-ink-body shadow-[0px_4px_10px_0px_rgba(0,0,0,0.05)] sm:text-sm sm:leading-5">
        Printer offline — you can still scan the digital receipt on gallery
        Wi‑Fi.
      </p>
    </div>
  );
}

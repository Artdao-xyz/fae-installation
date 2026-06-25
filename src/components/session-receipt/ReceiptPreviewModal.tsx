"use client";

import { useCallback } from "react";
import { useFilterSelection } from "@/components/ui/filter-sidebar/FilterSelectionContext";
import { PrintSvgIcon } from "@/components/ui/icons/PrintSvgIcon";
import type { SessionReceipt } from "@/lib/session-receipt/types";
import { RECEIPT_DIGITAL_MAX_WIDTH_PX } from "@/lib/session-receipt/thermal-spec";
import { InstallationArrowIcon } from "./InstallationArrowIcon";
import {
  installationActionButtonClass,
  installationModalOverlayClass,
  installationOverlayEnterClass,
  installationPhaseEnterClass,
  installationPhaseHiddenClass,
  installationPhaseVisibleClass,
  installationScreenStageClass,
} from "./installation-screen-chrome";
import type { PrintStatus } from "./print-status";
import { ReceiptPaper } from "./ReceiptPaper";
import { useSessionReceipt } from "./SessionReceiptProvider";
import { useBodyScrollLock } from "./use-body-scroll-lock";
import { useInstallationOverlayTransition } from "./use-installation-overlay-enter";

type ReceiptPreviewModalProps = {
  open: boolean;
  receipt: SessionReceipt;
  printStatus: PrintStatus;
  printMessage: string | null;
  onRetryPrint: () => void;
};

function PrintingState() {
  return (
    <div className="flex flex-col items-center gap-8 text-center fae-hero-title-line">
      <PrintSvgIcon className="size-10 motion-safe:animate-pulse" />
      <div className="flex flex-col gap-2.5">
        <h2 className="font-lust-text text-[30px] leading-[30px] text-black">
          Printing...
        </h2>
        <p className="font-fira-mono text-sm font-medium leading-5 text-black/50 motion-safe:animate-pulse">
          Please wait while your receipt is sent to the printer
        </p>
      </div>
    </div>
  );
}

type DigitalReceiptStateProps = {
  receipt: SessionReceipt;
  printFailed: boolean;
  printMessage: string | null;
  onRetryPrint: () => void;
  onStartNewJourney: () => void;
};

function DigitalReceiptState({
  receipt,
  printFailed,
  printMessage,
  onRetryPrint,
  onStartNewJourney,
}: DigitalReceiptStateProps) {
  return (
    <div className="flex h-full w-full max-w-[618px] flex-col items-center justify-center gap-10 px-4 py-6">
      <div className="scrollbar-hide flex min-h-0 w-full flex-1 justify-center overflow-y-auto overscroll-y-contain">
        <div
          className="mx-auto h-fit w-full shrink-0 overflow-hidden shadow-[0px_4px_10px_0px_rgba(0,0,0,0.05)]"
          style={{ maxWidth: RECEIPT_DIGITAL_MAX_WIDTH_PX }}
        >
          <ReceiptPaper receipt={receipt} variant="confirm" />
        </div>
      </div>

      <div className="flex w-full shrink-0 flex-col gap-5">
        {printFailed ? (
          <div className="flex flex-col gap-2.5 text-center" role="alert">
            <h2 className="font-lust-text text-[30px] leading-[30px] text-black">
              Print failed
            </h2>
            <p className="font-fira-mono text-sm font-medium leading-5 text-amber-900">
              {printMessage}
            </p>
            <p className="font-fira-mono text-sm leading-5 text-black/50">
              Check that the printer is connected, then try again.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 text-center">
            <h2 className="font-lust-text text-[30px] leading-[30px] text-black">
              Your receipt is ready
            </h2>
            <p className="font-fira-mono text-sm font-medium leading-5 text-black/50">
              Collect your printed receipt below.
            </p>
            <p className="font-fira-mono text-sm leading-5 text-black/50">
              Scan the code on gallery Wi‑Fi to view your journey on your phone.
            </p>
          </div>
        )}

        <div className="flex gap-[5px]">
          {printFailed ? (
            <button
              type="button"
              onClick={onRetryPrint}
              aria-label="Try printing again"
              className={installationActionButtonClass}
            >
              Try Again
              <InstallationArrowIcon className="block size-[10px] shrink-0 object-contain" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onStartNewJourney}
            aria-label="Start new journey"
            className={installationActionButtonClass}
          >
            Start New Journey
            <InstallationArrowIcon className="block size-[10px] shrink-0 object-contain" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function ReceiptPreviewModal({
  open,
  receipt,
  printStatus,
  printMessage,
  onRetryPrint,
}: ReceiptPreviewModalProps) {
  const { clearSession } = useSessionReceipt();
  const { resetToIdle } = useFilterSelection();
  const { mounted, entered } = useInstallationOverlayTransition(open, {
    skipEnterTransition: true,
  });
  useBodyScrollLock(mounted);

  const startNewJourney = useCallback(() => {
    clearSession();
    resetToIdle();
  }, [clearSession, resetToIdle]);

  const showPrinting = printStatus === "printing";
  const printFailed = printStatus === "offline" || printStatus === "error";
  const showDigital =
    !showPrinting && (printMessage !== null || printFailed);

  if (!mounted) return null;

  return (
    <div
      className={`${installationModalOverlayClass} ${installationScreenStageClass} h-screen overflow-hidden ${installationOverlayEnterClass} ${
        entered ? "opacity-100" : "opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Receipt"
      aria-busy={showPrinting}
    >
      <div
        className="relative flex h-full w-full max-w-[618px] flex-col items-center justify-center"
        aria-live="polite"
      >
        <div
          className={[
            "absolute inset-0 flex items-center justify-center",
            showPrinting
              ? `${installationPhaseEnterClass} ${installationPhaseVisibleClass}`
              : installationPhaseHiddenClass,
          ].join(" ")}
          aria-hidden={!showPrinting}
        >
          <PrintingState />
        </div>

        <div
          className={[
            "absolute inset-0 flex items-center justify-center",
            showDigital
              ? `${installationPhaseEnterClass} ${installationPhaseVisibleClass}`
              : installationPhaseHiddenClass,
          ].join(" ")}
          aria-hidden={!showDigital}
        >
          {showDigital ? (
            <DigitalReceiptState
              receipt={receipt}
              printFailed={printFailed}
              printMessage={printMessage}
              onRetryPrint={onRetryPrint}
              onStartNewJourney={startNewJourney}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

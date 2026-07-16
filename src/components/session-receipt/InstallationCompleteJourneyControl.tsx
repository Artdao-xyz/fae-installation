"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { marginGuideBottomStripRightClass } from "@/components/ui/margin-guide-frame/marginGuideChrome";
import { useFilterSelection } from "@/components/ui/filter-sidebar/FilterSelectionContext";
import { useIsMaxLg } from "@/components/ui/filter-sidebar/shell/useIsMaxLg";
import { Z_INDEX } from "@/lib/z-index-scale";
import { InstallationArrowIcon } from "./InstallationArrowIcon";
import { useSessionReceipt } from "./SessionReceiptProvider";

export const installationCompleteJourneyButtonClass = [
  "inline-flex shrink-0 items-center justify-center gap-2",
  "border-solid border-[color:var(--color-filter-pill-selection)] bg-surface-canvas",
  "px-2.5 font-fira-mono text-[12px] leading-[15px] text-[color:var(--color-filter-pill-selection)]",
  "transition-colors duration-150 enabled:hover:bg-surface-hover/60",
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[color:var(--color-filter-pill-selection)]",
  "h-[calc(var(--inset-margin-guide)+1px)] w-[300px] border-x-hairline border-t-hairline",
  "max-lg:h-11 max-lg:w-full max-lg:border-0",
].join(" ");

type InstallationCompleteJourneyButtonProps = {
  onClick: () => void;
  className?: string;
};

export function InstallationCompleteJourneyButton({
  onClick,
  className = "",
}: InstallationCompleteJourneyButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${installationCompleteJourneyButtonClass} ${className}`.trim()}
      aria-label="Complete journey and print receipt"
    >
      <span className="min-w-0 truncate">Complete Journey</span>
      <InstallationArrowIcon className="block h-[9px] w-[7px] shrink-0 object-contain" />
    </button>
  );
}

/** `max-lg` only — sits in the fixed bottom stack directly above the Serpentine footer. */
export function InstallationCompleteJourneyMobileBar({
  onClick,
}: InstallationCompleteJourneyButtonProps) {
  return (
    <div
      className="flex w-full shrink-0 border-y-thin border-solid border-[color:var(--color-filter-pill-selection)] bg-surface-canvas lg:hidden"
      role="group"
      aria-label="Session receipt"
    >
      <InstallationCompleteJourneyButton onClick={onClick} />
    </div>
  );
}

/** Desktop kiosk — portaled above the margin guide. Mobile uses `InstallationCompleteJourneyMobileBar`. */
export function InstallationCompleteJourneyControl() {
  const { enabled, recording, openPrintConfirm, previewOpen, screensaverActive } =
    useSessionReceipt();
  const { contentPreviewRow } = useFilterSelection();
  const isMaxLg = useIsMaxLg();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const dockedPreviewOpen = contentPreviewRow != null;

  if (
    !enabled ||
    !recording ||
    screensaverActive ||
    previewOpen ||
    !mounted ||
    isMaxLg
  ) {
    return null;
  }

  return createPortal(
    <div
      className={[
        "pointer-events-none",
        marginGuideBottomStripRightClass,
        "!items-end",
        dockedPreviewOpen
          ? "right-[calc(var(--inset-margin-guide)+var(--width-preview-panel))]"
          : "",
      ].join(" ")}
      style={{ zIndex: Z_INDEX.guiFloatingDock }}
      role="group"
      aria-label="Session receipt"
    >
      <div className="pointer-events-auto">
        <InstallationCompleteJourneyButton onClick={openPrintConfirm} />
      </div>
    </div>,
    document.body,
  );
}

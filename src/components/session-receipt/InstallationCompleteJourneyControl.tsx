"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { marginGuideBottomStripRightClass } from "@/components/ui/margin-guide-frame/marginGuideChrome";
import { useFilterSelection } from "@/components/ui/filter-sidebar/FilterSelectionContext";
import { Z_INDEX } from "@/lib/z-index-scale";
import { InstallationArrowIcon } from "./InstallationArrowIcon";
import { useSessionReceipt } from "./SessionReceiptProvider";

const completeJourneyButtonClass = [
  "inline-flex h-[calc(var(--inset-margin-guide)+1px)] w-[300px] shrink-0 items-center justify-between gap-2",
  "border-x-hairline border-t-hairline border-solid",
  "border-[color:var(--color-filter-pill-selection)] bg-[color:var(--color-filter-pill-selection)]",
  "px-2.5 font-fira-mono text-[12px] leading-[15px] text-surface-canvas",
  "transition-[filter,opacity] duration-150 enabled:hover:brightness-[1.08]",
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-surface-canvas",
].join(" ");

export function InstallationCompleteJourneyControl() {
  const { enabled, recording, openPrintConfirm, previewOpen, screensaverActive } =
    useSessionReceipt();
  const { contentPreviewRow } = useFilterSelection();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const dockedPreviewOpen = contentPreviewRow != null;

  if (!enabled || !recording || screensaverActive || previewOpen || !mounted) {
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
        "max-lg:bottom-[max(1rem,env(safe-area-inset-bottom))] max-lg:right-5 max-lg:h-auto",
      ].join(" ")}
      style={{ zIndex: Z_INDEX.guiFloatingDock }}
      role="group"
      aria-label="Session receipt"
    >
      <div className="pointer-events-auto">
        <button
          type="button"
          onClick={openPrintConfirm}
          className={completeJourneyButtonClass}
          aria-label="Complete journey and print receipt"
        >
          <span className="min-w-0 truncate">Complete Journey</span>
          <InstallationArrowIcon className="block h-[9px] w-[7px] shrink-0 object-contain brightness-0 invert" />
        </button>
      </div>
    </div>,
    document.body,
  );
}

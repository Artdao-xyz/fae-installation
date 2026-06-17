"use client";

import { useFilterSelection } from "@/components/ui/filter-sidebar/FilterSelectionContext";
import { InstallationChromeButton } from "./InstallationChromeButton";
import { useSessionReceipt } from "./SessionReceiptProvider";

/** Full-height controls in the bottom margin gutter (desktop). */
const marginChromeButtonClass = "w-full lg:h-full lg:px-3";

export function InstallationControls() {
  const { enabled, recording, openPreview, clearSession } = useSessionReceipt();
  const { resetToIdle } = useFilterSelection();

  if (!enabled || !recording) return null;

  const startSessionOver = () => {
    clearSession();
    resetToIdle();
  };

  return (
    <div
      className="pointer-events-none fixed z-40 flex justify-center max-lg:inset-x-0 max-lg:bottom-0 max-lg:items-center max-lg:px-4 max-lg:pb-[max(1rem,env(safe-area-inset-bottom))] lg:bottom-0 lg:left-[var(--inset-margin-guide)] lg:right-[var(--inset-margin-guide)] lg:h-[var(--inset-margin-guide)] lg:items-stretch"
      role="group"
      aria-label="Session receipt"
    >
      <div className="pointer-events-auto grid h-full grid-cols-2 border-t-hairline border-solid border-border bg-surface-canvas max-lg:h-auto">
        <InstallationChromeButton
          onClick={openPreview}
          className={marginChromeButtonClass}
        >
          Print
        </InstallationChromeButton>
        <InstallationChromeButton
          onClick={startSessionOver}
          divided
          className={marginChromeButtonClass}
        >
          Start session over
        </InstallationChromeButton>
      </div>
    </div>
  );
}

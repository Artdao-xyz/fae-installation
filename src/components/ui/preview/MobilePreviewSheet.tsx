"use client";

import type { ContentRow } from "@/data/content-types";
import { OpenSvgIcon } from "@/components/ui/icons/OpenSvgIcon";
import {
  MOBILE_OVERLAY_BOTTOM_ABOVE_FOOTER_CLASS,
  MOBILE_OVERLAY_TOP_CLASS,
  MOBILE_OVERLAY_X_CLASS,
} from "@/components/ui/filter-sidebar/shell/layout-classes";
import { PreviewMainContent } from "./PreviewMainContent";

type MobilePreviewSheetProps = {
  row: ContentRow;
  zIndex: number;
  onClose: () => void;
};

/**
 * `max-lg` content preview: between `MobileSiteHeader` and the Serpentine footer (same insets as About / filter sheet).
 */
export function MobilePreviewSheet({
  row,
  zIndex,
  onClose,
}: MobilePreviewSheetProps) {
  return (
    <div
      data-fae-content-preview
      onPointerDown={(e) => e.stopPropagation()}
      className={`fixed flex h-auto min-h-0 min-w-0 flex-col overflow-hidden bg-surface-canvas lg:hidden ${MOBILE_OVERLAY_TOP_CLASS} ${MOBILE_OVERLAY_BOTTOM_ABOVE_FOOTER_CLASS} ${MOBILE_OVERLAY_X_CLASS}`}
      style={{ zIndex }}
      role="dialog"
      aria-modal="true"
      aria-label="Content preview"
    >
      <div className="flex w-full shrink-0 items-stretch border-b-hairline border-solid border-ink-primary bg-surface-canvas">
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-full items-center justify-center gap-2 px-3 font-fira-mono text-sm font-normal leading-5 text-ink-primary transition-colors hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary"
          aria-label="Close preview"
        >
          <OpenSvgIcon className="shrink-0 rotate-90" />
          <span>Close</span>
        </button>
      </div>
      <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
        <PreviewMainContent row={row} fullScreen clampPills />
      </div>
    </div>
  );
}

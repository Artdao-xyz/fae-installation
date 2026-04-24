"use client";

import { OpenSvgIcon } from "@/components/ui/icons/OpenSvgIcon";
import { navSidebarLinkLabelClassName } from "@/components/ui/icons/nav-sidebar-labels";
import {
  MOBILE_OVERLAY_BOTTOM_ABOVE_FOOTER_CLASS,
  MOBILE_OVERLAY_TOP_CLASS,
  MOBILE_OVERLAY_X_CLASS,
} from "@/components/ui/filter-sidebar/shell/layout-classes";
import { AboutPanelRichContent } from "./AboutShared";

type MobileAboutSheetProps = {
  zIndex: number;
  onClose: () => void;
};

/**
 * `max-lg` About: between `MobileSiteHeader` and the Serpentine footer (same insets as filter sheet).
 */
export function MobileAboutSheet({ zIndex, onClose }: MobileAboutSheetProps) {
  return (
    <div
      className={`fixed flex h-auto min-h-0 min-w-0 flex-col overflow-hidden bg-surface-canvas lg:hidden ${MOBILE_OVERLAY_TOP_CLASS} ${MOBILE_OVERLAY_BOTTOM_ABOVE_FOOTER_CLASS} ${MOBILE_OVERLAY_X_CLASS}`}
      style={{ zIndex }}
      role="dialog"
      aria-modal="true"
      aria-label="About Future Art Ecosystems"
    >
      <div className="flex w-full shrink-0 items-stretch bg-surface-canvas">
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-full items-center justify-center gap-2 px-3 text-ink-primary transition-colors hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary"
          aria-label="Close About"
        >
          <OpenSvgIcon className="rotate-180" />
          <span className={navSidebarLinkLabelClassName}>Close</span>
        </button>
      </div>
      <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        <AboutPanelRichContent />
      </div>
    </div>
  );
}

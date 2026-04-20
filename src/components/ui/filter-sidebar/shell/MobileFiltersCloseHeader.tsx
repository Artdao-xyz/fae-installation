"use client";

import { OpenSvgIcon } from "@/components/ui/icons/OpenSvgIcon";
import { navSidebarLinkLabelClassName } from "@/components/ui/icons/nav-sidebar-labels";

type MobileFiltersCloseHeaderProps = {
  onClose: () => void;
};

/** Fixed top strip below safe-area when the filter sheet is full-screen on `max-lg`. */
export function MobileFiltersCloseHeader({ onClose }: MobileFiltersCloseHeaderProps) {
  return (
    <div
      className="flex w-full shrink-0 items-stretch border-b-hairline border-solid border-ink-primary bg-surface-canvas pt-[env(safe-area-inset-top,0px)] lg:hidden"
      role="presentation"
    >
      <button
        type="button"
        onClick={onClose}
        className="flex min-h-11 w-full items-center justify-center gap-2 px-3 text-ink-primary transition-colors hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary"
        aria-label="Close filters"
      >
        <OpenSvgIcon className="rotate-180" />
        <span className={navSidebarLinkLabelClassName}>Close</span>
      </button>
    </div>
  );
}

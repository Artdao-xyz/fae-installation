"use client";

import { FiltersSvgIcon } from "@/components/ui/icons/FiltersSvgIcon";
import { navSidebarLinkLabelClassName } from "@/components/ui/icons/nav-sidebar-labels";

type MobileFiltersBarProps = {
  onOpen: () => void;
};

/** Bottom entry when the narrow filter rail is hidden (`max-lg`). Same height as `Footer` (`h-11`); safe area lives on the fixed parent. */
export function MobileFiltersBar({ onOpen }: MobileFiltersBarProps) {
  return (
    <div className="flex h-11 w-full shrink-0 items-center justify-center bg-surface-canvas px-3 backdrop-blur-fae-sm">
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full max-w-sm items-center justify-center gap-2 rounded-sm text-ink-primary transition-colors hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary"
        aria-label="Open filters"
      >
        <FiltersSvgIcon />
        <span className={navSidebarLinkLabelClassName}>Filters</span>
      </button>
    </div>
  );
}

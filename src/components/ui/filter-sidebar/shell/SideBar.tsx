"use client";

import { FiltersSvgIcon } from "@/components/ui/icons/FiltersSvgIcon";
import { OpenSvgIcon } from "@/components/ui/icons/OpenSvgIcon";
import { navSidebarVerticalLabelClassName } from "@/components/ui/icons/nav-sidebar-labels";

type SideBarProps = {
  filtersOpen: boolean;
  onToggleFilters: () => void;
  filterPanelId: string;
};

export function SideBar({
  filtersOpen,
  onToggleFilters,
  filterPanelId,
}: SideBarProps) {
  return (
    <div className="flex min-h-0 w-filter-narrow-column shrink-0 flex-col border-r-hairline border-solid border-ink-primary bg-surface-canvas">
      <button
        type="button"
        onClick={onToggleFilters}
        className="flex h-filter-narrow-toggle w-full shrink-0 items-center justify-center text-ink-primary hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary"
        aria-expanded={filtersOpen}
        aria-controls={filterPanelId}
        aria-label={filtersOpen ? "Collapse filters" : "Expand filters"}
      >
        <OpenSvgIcon />
      </button>
        <div className="mt-auto flex w-full flex-col items-center gap-4 pb-3 pt-3">
        <span className={navSidebarVerticalLabelClassName} aria-hidden>
            Filters
          </span>
          <FiltersSvgIcon />

        </div>
    </div>
  );
}

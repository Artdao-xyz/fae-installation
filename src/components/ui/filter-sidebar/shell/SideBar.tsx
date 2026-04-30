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
    <div
      className="flex h-full min-h-0 w-filter-narrow-column shrink-0 select-none flex-col justify-between self-stretch border-r-hairline border-solid border-border bg-surface-canvas"
    >
      <button
        type="button"
        onClick={onToggleFilters}
        className="flex h-filter-narrow-toggle w-full shrink-0 items-center justify-center text-ink-primary hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary"
        aria-expanded={filtersOpen}
        aria-controls={filtersOpen ? filterPanelId : undefined}
        aria-label={filtersOpen ? "Collapse filters" : "Expand filters"}
      >
        <OpenSvgIcon
          className={`transition-transform duration-500 ease-in-out motion-reduce:transition-none ${
            filtersOpen ? "-rotate-180" : ""
          }`}
        />
      </button>
      {/* Desktop only (`lg`): column + vertical label — unlike mobile bottom bar (row + horizontal label). */}
      <button
        type="button"
        onClick={onToggleFilters}
        className="flex w-full shrink-0 flex-col items-center gap-4 px-2 pb-3 pt-3 text-ink-primary transition-colors hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary"
        aria-expanded={filtersOpen}
        aria-controls={filtersOpen ? filterPanelId : undefined}
        aria-label={filtersOpen ? "Collapse filters" : "Expand filters"}
      >
        <span className={navSidebarVerticalLabelClassName} aria-hidden>
          Filters
        </span>
        <FiltersSvgIcon />
      </button>
    </div>
  );
}

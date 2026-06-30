"use client";

import { FiltersSvgIcon } from "@/components/ui/icons/FiltersSvgIcon";
import { OpenSvgIcon } from "@/components/ui/icons/OpenSvgIcon";
import { navSidebarVerticalLabelClassName } from "@/components/ui/icons/nav-sidebar-labels";

type SideBarProps = {
  filtersOpen: boolean;
  onToggleFilters: () => void;
  filterPanelId: string;
  showTopBorder?: boolean;
  fillHeight?: boolean;
};

export function SideBar({
  filtersOpen,
  onToggleFilters,
  filterPanelId,
  showTopBorder = false,
  fillHeight = true,
}: SideBarProps) {
  return (
    <button
      type="button"
      onClick={onToggleFilters}
      className={`flex w-filter-narrow-column shrink-0 select-none flex-col self-stretch border-r-hairline border-solid border-border bg-surface-canvas text-ink-primary transition-colors hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary ${
        fillHeight ? "min-h-0 flex-1" : "h-auto shrink-0"
      } ${showTopBorder ? "border-t-hairline" : ""}`}
      aria-expanded={filtersOpen}
      aria-controls={filtersOpen ? filterPanelId : undefined}
      aria-label={filtersOpen ? "Collapse filters" : "Expand filters"}
    >
      <div className="flex h-filter-narrow-toggle w-full shrink-0 items-center justify-center">
        <OpenSvgIcon
          className={`transition-transform duration-500 ease-in-out motion-reduce:transition-none ${
            filtersOpen ? "-rotate-180" : ""
          }`}
        />
      </div>
      {/* Desktop only (`lg`): column + vertical label — unlike mobile bottom bar (row + horizontal label). */}
      <div className="flex w-full shrink-0 flex-col items-center gap-4 px-2 pb-3 pt-3">
        <span className={navSidebarVerticalLabelClassName} aria-hidden>
          Filters
        </span>
        <FiltersSvgIcon />
      </div>
    </button>
  );
}

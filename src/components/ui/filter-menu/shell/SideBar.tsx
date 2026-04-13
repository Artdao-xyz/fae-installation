"use client";

import { FiltersSvgIcon } from "@/components/ui/icons/FiltersSvgIcon";
import { OpenSvgIcon } from "@/components/ui/icons/OpenSvgIcon";
import { navRailVerticalLabelClassName } from "@/components/ui/icons/navChrome";

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
    <div className="flex min-h-0 w-[35px] shrink-0 flex-col border-r-[0.5px] border-solid border-text-primary bg-white-fae">
      <button
        type="button"
        onClick={onToggleFilters}
        className="flex h-[35px] w-full shrink-0 items-center justify-center text-text-primary hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-text-primary"
        aria-expanded={filtersOpen}
        aria-controls={filterPanelId}
        aria-label={filtersOpen ? "Collapse filters" : "Expand filters"}
      >
        <OpenSvgIcon />
      </button>
        <div className="mt-auto flex w-full flex-col items-center gap-4 pb-3 pt-3">
        <span className={navRailVerticalLabelClassName} aria-hidden>
            Filters
          </span>
          <FiltersSvgIcon />

        </div>
    </div>
  );
}

"use client";

import { FilterMenuFiltersIcon } from "./icons/FilterMenuFiltersIcon";

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
        <img
          src="/svg/sidebar.svg"
          alt=""
          className="block w-1/2"
          aria-hidden
        />
      </button>
        <div className="mt-auto flex w-full flex-col items-center gap-4 pb-3 pt-3">
        <span
            className="select-none text-center font-mono text-xs font-medium leading-tight tracking-wide text-text-body [text-orientation:mixed] [writing-mode:vertical-rl] rotate-180"
            aria-hidden
          >
            Filters
          </span>
          <FilterMenuFiltersIcon className="opacity-90" />

        </div>
    </div>
  );
}

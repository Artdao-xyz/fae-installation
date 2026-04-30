"use client";

import { FiltersSvgIcon } from "@/components/ui/icons/FiltersSvgIcon";
import { navSidebarLinkLabelClassName } from "@/components/ui/icons/nav-sidebar-labels";
import { useFilterSelection } from "@/components/ui/filter-sidebar/FilterSelectionContext";
import { MobileSelectedFiltersStrip } from "./MobileSelectedFiltersStrip";

type MobileFiltersBarProps = {
  onOpen: () => void;
};

/** Bottom entry when the narrow filter rail is hidden (`max-lg`). Same height as `Footer` (`h-13`); safe area lives on the fixed parent. */
export function MobileFiltersBar({ onOpen }: MobileFiltersBarProps) {
  const { hasActiveTaxonomyFilters, selectedFaeBriefing } = useFilterSelection();
  const hasSelectedFilters =
    hasActiveTaxonomyFilters || selectedFaeBriefing != null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex w-full shrink-0 items-center gap-2 border-t-hairline border-solid border-border bg-surface-canvas backdrop-blur-fae-sm transition-colors hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary ${
        hasSelectedFilters
          ? "min-h-13 h-auto justify-start px-2 text-left"
          : "h-13 justify-center px-3 text-center"
      }`}
      aria-label="Open filters"
    >
      <span className="flex size-8 shrink-0 items-center justify-center text-ink-primary">
        <FiltersSvgIcon className="size-6!" />
      </span>
      {hasSelectedFilters ? (
        <MobileSelectedFiltersStrip />
      ) : (
        <span className={navSidebarLinkLabelClassName}>Filters</span>
      )}
    </button>
  );
}

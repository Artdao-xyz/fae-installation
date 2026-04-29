"use client";

import { useMemo } from "react";
import { filterContentRowsForSearchQuery } from "@/data/search-filter";
import { useFilterSelection } from "../FilterSelectionContext";
import { FilterPill } from "../primitives/FilterPill";
import { FilterSearchField } from "../primitives/FilterSearchField";

type SearchProps = {
  value: string;
  onChange: (value: string) => void;
  /** Pass unique ids when both mobile (landing) and desktop (sidebar) instances exist. */
  fieldId?: string;
};

export function Search({
  value,
  onChange,
  fieldId = "filter-search",
}: SearchProps) {
  const { openContentPreview, contentCatalog } = useFilterSelection();

  const results = useMemo(
    () => filterContentRowsForSearchQuery(value, contentCatalog),
    [value, contentCatalog],
  );
  const searching = value.trim().length > 0;

  return (
    <div
      className={
        searching
          ? "flex min-h-0 min-w-0 w-full flex-col max-lg:shrink-0 max-lg:flex-none max-lg:overflow-visible lg:overflow-hidden lg:flex-1"
          : "w-full shrink-0"
      }
    >
      {/* Bar row: on landing mobile, parent keeps this outside the main scroll region so it stays put. */}
      <div className="min-w-0 shrink-0 bg-surface-canvas px-3 py-4">
        <FilterSearchField
          id={fieldId}
          label="Search"
          value={value}
          onChange={onChange}
        />
      </div>

      {searching ? (
        <div
          className="scrollbar-hide flex min-h-0 min-w-0 w-full flex-col gap-[5px] overflow-y-auto px-5.5 pb-3 pt-0 max-lg:max-h-[min(70dvh,32rem)] max-lg:flex-none lg:flex-1 lg:px-3"
          role="list"
          aria-label="Search results"
        >
          {results.length === 0 ? (
            <p className="font-fira-mono text-xs font-normal leading-4 text-ink-body/70 lg:text-[10px]">
              No results
            </p>
          ) : (
            results.map((row) => (
              <div
                key={row.id}
                className="w-full min-w-0 shrink-0"
                role="listitem"
              >
                <button
                  type="button"
                  onClick={() => openContentPreview(row)}
                  className="w-full min-w-0 border-0 bg-transparent py-1.5 text-left font-fira-mono text-xs leading-4 text-ink-primary transition-colors hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-primary focus-visible:ring-offset-0 lg:hidden"
                >
                  <span className="block min-w-0 truncate">{row.title}</span>
                </button>
                <div className="hidden w-full min-w-0 lg:block">
                  <FilterPill
                    label={row.title}
                    variant="dotted"
                    tone="fae-briefings"
                    className="box-border w-full min-w-0 max-w-full"
                    onPress={() => openContentPreview(row)}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { filterContentRowsForSearchQuery } from "@/data/search-filter";
import { useFilterSelection } from "../FilterSelectionContext";
import { FilterPill } from "../primitives/FilterPill";
import { FilterSearchField } from "../primitives/FilterSearchField";

type SearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export function Search({ value, onChange }: SearchProps) {
  const { openContentPreview, clearAllFilters, closeContentPreview, contentCatalog } =
    useFilterSelection();

  const results = useMemo(
    () => filterContentRowsForSearchQuery(value, contentCatalog),
    [value, contentCatalog],
  );
  const searching = value.trim().length > 0;

  return (
    <div
      className={
        searching
          ? "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
          : "shrink-0"
      }
    >
      <div className="min-w-0 shrink-0 bg-surface-canvas px-3 py-3">
        <FilterSearchField
          id="filter-search"
          label="Search"
          value={value}
          onChange={onChange}
          onRefreshFilters={() => {
            clearAllFilters();
            onChange("");
            closeContentPreview();
          }}
        />
      </div>

      {searching ? (
        <div
          className="scrollbar-hide flex min-h-0 min-w-0 w-full flex-1 flex-col gap-[5px] overflow-y-auto px-3 pb-3 pt-0"
          role="list"
          aria-label="Search results"
        >
          {results.length === 0 ? (
            <p className="font-fira-mono text-[10px] font-normal leading-4 text-ink-body/70">
              No results
            </p>
          ) : (
            results.map((row) => (
              <div
                key={row.id}
                className="w-full min-w-0 shrink-0"
                role="listitem"
              >
                <FilterPill
                  label={row.title}
                  variant="dotted"
                  tone="fae-briefings"
                  className="box-border w-full min-w-0 max-w-full"
                  onPress={() => openContentPreview(row)}
                />
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

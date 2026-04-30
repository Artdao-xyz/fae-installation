"use client";

import { useMemo, type ReactNode } from "react";
import { filterContentRowsForSearchQuery } from "@/data/search-filter";
import { useFilterSelection } from "../FilterSelectionContext";
import { FilterPill } from "../primitives/FilterPill";
import { FilterSearchField } from "../primitives/FilterSearchField";
import {
  filterFramedRoundedInnerClass,
  filterPillSingleLayerBrightnessHoverClass,
} from "../primitives/filterFramedClasses";

type SearchProps = {
  value: string;
  onChange: (value: string) => void;
  /** Pass unique ids when both mobile (landing) and desktop (sidebar) instances exist. */
  fieldId?: string;
  mobileLandingActions?: ReactNode;
  mobileLandingExpanded?: boolean;
  onMobileLandingExpand?: () => void;
};

export function Search({
  value,
  onChange,
  fieldId = "filter-search",
  mobileLandingActions,
  mobileLandingExpanded = true,
  onMobileLandingExpand,
}: SearchProps) {
  const { openContentPreview, contentCatalog } = useFilterSelection();

  const results = useMemo(
    () => filterContentRowsForSearchQuery(value, contentCatalog),
    [value, contentCatalog],
  );
  const searching = value.trim().length > 0;
  const hasMobileLandingActions = mobileLandingActions != null;

  return (
    <div
      className={
        searching
          ? "flex min-h-0 min-w-0 w-full flex-col max-lg:shrink-0 max-lg:flex-none max-lg:overflow-visible lg:overflow-hidden lg:flex-1"
          : "w-full shrink-0"
      }
    >
      {/* Bar row: on landing mobile, parent keeps this outside the main scroll region so it stays put. */}
      <div
        className={
          hasMobileLandingActions
            ? "min-w-0 shrink-0 bg-surface-canvas p-0 lg:px-3 lg:py-4"
            : "min-w-0 shrink-0 bg-surface-canvas px-3 py-4"
        }
      >
        {hasMobileLandingActions ? (
          <div className="flex min-w-0 items-stretch gap-0 lg:hidden">
            {mobileLandingExpanded ? (
              <div className="relative z-20 flex h-13 min-w-0 flex-1">
                <FilterSearchField
                  id={fieldId}
                  label="Search"
                  value={value}
                  onChange={onChange}
                  outerClassName="fae-control-filter-outer-1px h-full"
                  innerClassName="h-full"
                  inputClassName="text-base leading-5 placeholder:text-base placeholder:leading-5"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={onMobileLandingExpand}
                className={`fae-control-filter-outer fae-search-field-outer fae-control-filter-outer-1px ${filterPillSingleLayerBrightnessHoverClass} relative z-20 inline-flex h-13 w-13 flex-none items-center justify-center focus-visible:outline-none`}
                aria-label="Open search"
                aria-controls={fieldId}
              >
                <span
                  className={`${filterFramedRoundedInnerClass(false)} flex h-full w-full items-center justify-center px-0 py-0`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- local static search icon */}
                  <img
                    src="/svg/search.svg"
                    alt=""
                    className="block size-4 max-h-4 max-w-4 shrink-0 object-contain"
                    aria-hidden
                  />
                </span>
              </button>
            )}
            {mobileLandingActions}
          </div>
        ) : null}
        <div className={hasMobileLandingActions ? "hidden lg:block" : undefined}>
          <FilterSearchField
            id={fieldId}
            label="Search"
            value={value}
            onChange={onChange}
          />
        </div>
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

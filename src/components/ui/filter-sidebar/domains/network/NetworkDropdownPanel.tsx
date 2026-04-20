"use client";

import { useCallback, useMemo, useState } from "react";
import { NETWORK_LABELS } from "../../config/constants";
import { filterNetworkLabelsForSearchQuery } from "@/data/network-search-filter";
import { FilterPill } from "../../primitives/FilterPill";
import { FilterPillDropdown } from "../../primitives/FilterPillDropdown";
import { FilterSearchField } from "../../primitives/FilterSearchField";

type NetworkDropdownPanelProps = {
  variant?: "default" | "subcolumn";
  onClearAll?: () => void;
};

export function NetworkDropdownPanel({
  variant = "default",
  onClearAll: onClearAllFromParent,
}: NetworkDropdownPanelProps) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const searching = searchQuery.trim().length > 0;

  const searchMatches = useMemo(
    () => filterNetworkLabelsForSearchQuery(searchQuery),
    [searchQuery],
  );

  const toggle = useCallback((label: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }, []);

  const handleClearAll = useCallback(() => {
    onClearAllFromParent?.();
    setSelected(new Set());
  }, [onClearAllFromParent]);

  const pillClassName = searching
    ? "box-border w-full min-w-0 max-w-full"
    : undefined;

  return (
    <FilterPillDropdown
      tone="network"
      variant={variant}
      onClearAll={handleClearAll}
      selectedCount={selected.size}
      totalCount={NETWORK_LABELS.length}
    >
      <div className="flex w-full min-w-0 shrink-0 basis-full flex-col gap-2">
        <div className="min-w-0 shrink-0">
          <FilterSearchField
            id="network-filter-search"
            label="Search network"
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>
        {searching ? (
          <div
            className="scrollbar-hide flex min-h-0 min-w-0 w-full flex-col gap-[5px] overflow-y-auto"
            role="list"
            aria-label="Network search results"
          >
            {searchMatches.length === 0 ? (
              <p className="font-fira-mono text-[10px] font-normal leading-4 text-ink-body/70">
                No results
              </p>
            ) : (
              searchMatches.map((label) => (
                <div
                  key={label}
                  className="w-full min-w-0 shrink-0"
                  role="listitem"
                >
                  <FilterPill
                    label={label}
                    tone="network"
                    selected={selected.has(label)}
                    onPress={() => toggle(label)}
                    className={pillClassName}
                  />
                </div>
              ))
            )}
          </div>
        ) : (
          <div
            className="flex w-full flex-wrap content-start items-start"
            role="group"
            aria-label="Network"
          >
            {NETWORK_LABELS.map((label) => (
              <FilterPill
                key={label}
                label={label}
                tone="network"
                selected={selected.has(label)}
                onPress={() => toggle(label)}
              />
            ))}
          </div>
        )}
      </div>
    </FilterPillDropdown>
  );
}

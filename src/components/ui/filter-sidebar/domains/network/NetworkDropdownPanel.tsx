"use client";

import { useCallback, useMemo, useState } from "react";
import { useFloatingPanelStack } from "@/components/ui/floating-panels/FloatingPanelStackContext";
import { useFilterSelection } from "../../FilterSelectionContext";
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
  const {
    filterNetworkOptionLabels,
    selectedNetworks,
    toggleNetwork,
    clearSelectedNetworks,
    contentCatalog,
    contentCatalogStatus,
    networkOptionToggleMatchCount,
  } = useFilterSelection();
  const { minimizeAllFloatingPanels } = useFloatingPanelStack();
  const [searchQuery, setSearchQuery] = useState("");

  const searching = searchQuery.trim().length > 0;

  const catalogReady =
    contentCatalogStatus === "success" && contentCatalog.length > 0;

  const searchMatches = useMemo(
    () =>
      filterNetworkLabelsForSearchQuery(searchQuery, filterNetworkOptionLabels),
    [searchQuery, filterNetworkOptionLabels],
  );

  const handleClearAll = useCallback(() => {
    minimizeAllFloatingPanels();
    onClearAllFromParent?.();
    clearSelectedNetworks();
  }, [minimizeAllFloatingPanels, onClearAllFromParent, clearSelectedNetworks]);

  const pillClassName = searching
    ? "box-border w-full min-w-0 max-w-full"
    : undefined;

  const networkPillProps = (label: string, className?: string) => {
    const selected = selectedNetworks.has(label);
    const count = networkOptionToggleMatchCount.get(label) ?? 0;
    const disableAdd = catalogReady && !selected && count === 0;
    return {
      label,
      tone: "network" as const,
      selected,
      onPress: () => {
        minimizeAllFloatingPanels();
        toggleNetwork(label);
      },
      className,
      disabled: disableAdd,
      title: disableAdd
        ? "Nothing in the catalog matches this with your other filters"
        : undefined,
    };
  };

  return (
    <FilterPillDropdown
      tone="network"
      variant={variant}
      onClearAll={handleClearAll}
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
                  <FilterPill {...networkPillProps(label, pillClassName)} />
                </div>
              ))
            )}
          </div>
        ) : (
          <div
            className="flex w-full flex-wrap content-start items-start gap-1.5"
            role="group"
            aria-label="Network"
          >
            {filterNetworkOptionLabels.map((label) => (
              <FilterPill key={label} {...networkPillProps(label)} />
            ))}
          </div>
        )}
      </div>
    </FilterPillDropdown>
  );
}

"use client";

import { useCallback, useMemo, useState } from "react";
import { useFloatingPanelStack } from "@/components/ui/floating-panels/FloatingPanelStackContext";
import { useFilterSelection } from "../../FilterSelectionContext";
import { filterNetworkLabelsForSearchQuery } from "@/data/network-search-filter";
import { FilterPill } from "../../primitives/FilterPill";
import { FilterPillDropdown } from "../../primitives/FilterPillDropdown";
import { FilterSearchField } from "../../primitives/FilterSearchField";

type ArtistsDropdownPanelProps = {
  variant?: "default" | "subcolumn";
  onClearAll?: () => void;
  mobilePane?: boolean;
};

export function ArtistsDropdownPanel({
  variant = "default",
  onClearAll: onClearAllFromParent,
  mobilePane = false,
}: ArtistsDropdownPanelProps) {
  const {
    filterArtistOptionLabels,
    selectedArtists,
    toggleArtist,
    clearSelectedArtists,
    contentCatalog,
    contentCatalogStatus,
    artistOptionToggleMatchCount,
  } = useFilterSelection();
  const { minimizeAllFloatingPanels } = useFloatingPanelStack();
  const [searchQuery, setSearchQuery] = useState("");

  const searching = searchQuery.trim().length > 0;

  const catalogReady =
    contentCatalogStatus === "success" && contentCatalog.length > 0;

  const searchMatches = useMemo(
    () =>
      filterNetworkLabelsForSearchQuery(searchQuery, filterArtistOptionLabels),
    [searchQuery, filterArtistOptionLabels],
  );

  const handleClearAll = useCallback(() => {
    minimizeAllFloatingPanels();
    onClearAllFromParent?.();
    clearSelectedArtists();
  }, [minimizeAllFloatingPanels, onClearAllFromParent, clearSelectedArtists]);

  const mobilePanePillBorderClassName = mobilePane
    ? "[border-left-width:var(--border-width-hairline)] [border-right-width:var(--border-width-hairline)]"
    : undefined;
  const pillClassName = [
    searching ? "box-border w-full min-w-0 max-w-full" : undefined,
    mobilePanePillBorderClassName,
  ]
    .filter(Boolean)
    .join(" ");

  const artistPillProps = (label: string, className?: string) => {
    const selected = selectedArtists.has(label);
    const count = artistOptionToggleMatchCount.get(label) ?? 0;
    const disableAdd = catalogReady && !selected && count === 0;
    return {
      label,
      tone: "artists" as const,
      selected,
      selectedTone: true,
      onPress: () => {
        minimizeAllFloatingPanels();
        toggleArtist(label);
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
      tone="artists"
      variant={variant}
      onClearAll={mobilePane ? undefined : handleClearAll}
      subcolumnTitle={variant === "subcolumn" && !mobilePane ? "Artists" : undefined}
      mobileHeader={
        mobilePane
          ? {
              title: "Artists",
              selectedCount: selectedArtists.size,
              totalCount: filterArtistOptionLabels.length,
            }
          : undefined
      }
    >
      <div className="flex w-full min-w-0 shrink-0 basis-full flex-col gap-2">
        <div className="min-w-0 shrink-0">
          <FilterSearchField
            id="artists-filter-search"
            label="Search artists"
            value={searchQuery}
            onChange={setSearchQuery}
            outerClassName="!border-ink-primary !bg-ink-primary"
          />
        </div>
        {searching ? (
          <div
            className="scrollbar-hide flex min-h-0 min-w-0 w-full flex-col gap-[5px] overflow-y-auto"
            role="list"
            aria-label="Artist search results"
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
                  <FilterPill {...artistPillProps(label, pillClassName)} />
                </div>
              ))
            )}
          </div>
        ) : (
          <div
            className="flex w-full flex-wrap content-start items-start gap-1.5"
            role="group"
            aria-label="Artists"
          >
            {filterArtistOptionLabels.map((label) => (
              <FilterPill key={label} {...artistPillProps(label, pillClassName)} />
            ))}
          </div>
        )}
      </div>
    </FilterPillDropdown>
  );
}

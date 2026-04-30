"use client";

import { useCallback } from "react";
import { useFilterSelection } from "../FilterSelectionContext";
import { FilterSidebarSection } from "../primitives/FilterSidebarSection";
import { FilterPill } from "../primitives/FilterPill";

export function FocusAreas({
  collapsed = false,
  chromeless = false,
}: {
  collapsed?: boolean;
  chromeless?: boolean;
}) {
  const {
    selectedFocusAreas,
    toggleFocusArea,
    clearFocusAreas,
    filterFocusOptionLabels,
    contentCatalog,
    contentCatalogStatus,
    focusOptionToggleMatchCount,
  } = useFilterSelection();

  const catalogReady =
    contentCatalogStatus === "success" && contentCatalog.length > 0;

  const toggle = useCallback(
    (label: string) => {
      toggleFocusArea(label);
    },
    [toggleFocusArea],
  );

  const clearAll = useCallback(() => clearFocusAreas(), [clearFocusAreas]);

  return (
    <FilterSidebarSection
      title="Focus"
      titleClassName="min-w-0 flex-1 font-lust-text text-base font-medium leading-6 text-ink-body"
      onClearAll={clearAll}
      scrollBody
      collapsed={collapsed}
      chromeless={chromeless}
      selectionTally={
        chromeless
          ? {
              selected: selectedFocusAreas.size,
              total: filterFocusOptionLabels.length,
            }
          : undefined
      }
    >
      {filterFocusOptionLabels.map((label) => {
        const selected = selectedFocusAreas.has(label);
        const count = focusOptionToggleMatchCount.get(label) ?? 0;
        const disableAdd = catalogReady && !selected && count === 0;
        return (
          <FilterPill
            key={label}
            label={label}
            variant="square"
            selected={selected}
            onPress={() => toggle(label)}
            disabled={disableAdd}
            title={
              disableAdd
                ? "Nothing in the catalog matches this with your other filters"
                : undefined
            }
          />
        );
      })}
    </FilterSidebarSection>
  );
}

"use client";

import { useCallback } from "react";
import { useFilterSelection } from "../FilterSelectionContext";
import { FilterSidebarSection } from "../primitives/FilterSidebarSection";
import { FilterPill } from "../primitives/FilterPill";

export function FocusAreas({ collapsed = false }: { collapsed?: boolean }) {
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
      title="Focus Areas"
      onClearAll={clearAll}
      scrollBody
      collapsed={collapsed}
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

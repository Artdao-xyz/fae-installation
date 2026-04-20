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
  } = useFilterSelection();

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
      {filterFocusOptionLabels.map((label) => (
        <FilterPill
          key={label}
          label={label}
          variant="square"
          selected={selectedFocusAreas.has(label)}
          onPress={() => toggle(label)}
        />
      ))}
    </FilterSidebarSection>
  );
}

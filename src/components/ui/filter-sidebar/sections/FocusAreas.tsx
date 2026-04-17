"use client";

import { useCallback } from "react";
import { FOCUS_AREA_LABELS } from "../config/constants";
import { useFilterSelection } from "../FilterSelectionContext";
import { FilterSidebarSection } from "../primitives/FilterSidebarSection";
import { FilterPill } from "../primitives/FilterPill";

export function FocusAreas({ collapsed = false }: { collapsed?: boolean }) {
  const { selectedFocusAreas, toggleFocusArea, clearFocusAreas } =
    useFilterSelection();

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
      {FOCUS_AREA_LABELS.map((label) => (
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

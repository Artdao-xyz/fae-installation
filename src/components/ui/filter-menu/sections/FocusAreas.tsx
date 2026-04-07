"use client";

import { useCallback } from "react";
import { FOCUS_AREA_LABELS } from "../config/constants";
import { useFilterSelection } from "../FilterSelectionContext";
import { FilterMenuSection } from "../primitives/FilterMenuSection";
import { FilterPill } from "../primitives/FilterPill";

export function FocusAreas() {
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
    <FilterMenuSection
      title="Focus Areas"
      onClearAll={clearAll}
      scrollBody
    >
      {FOCUS_AREA_LABELS.map((label) => (
        <FilterPill
          key={label}
          label={label}
          selected={selectedFocusAreas.has(label)}
          onPress={() => toggle(label)}
        />
      ))}
    </FilterMenuSection>
  );
}

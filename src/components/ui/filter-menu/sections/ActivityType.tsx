"use client";

import { useCallback } from "react";
import { ACTIVITY_TYPE_LABELS } from "../config/constants";
import { useFilterSelection } from "../FilterSelectionContext";
import { FilterMenuSection } from "../primitives/FilterMenuSection";
import { FilterPill } from "../primitives/FilterPill";

export function ActivityType() {
  const { selectedActivityTypes, toggleActivityType, clearActivityTypes } =
    useFilterSelection();

  const toggle = useCallback(
    (label: string) => {
      toggleActivityType(label);
    },
    [toggleActivityType],
  );

  const clearAll = useCallback(() => clearActivityTypes(), [clearActivityTypes]);

  return (
    <FilterMenuSection
      title="Activity Type"
      onClearAll={clearAll}
      scrollBody
    >
      {ACTIVITY_TYPE_LABELS.map((label) => (
        <FilterPill
          key={label}
          label={label}
          selected={selectedActivityTypes.has(label)}
          onPress={() => toggle(label)}
        />
      ))}
    </FilterMenuSection>
  );
}

"use client";

import { useCallback } from "react";
import { useFilterSelection } from "../FilterSelectionContext";
import { FilterSidebarSection } from "../primitives/FilterSidebarSection";
import { FilterPill } from "../primitives/FilterPill";

export function ActivityType({ collapsed = false }: { collapsed?: boolean }) {
  const {
    selectedActivityTypes,
    toggleActivityType,
    clearActivityTypes,
    filterActivityOptionLabels,
  } = useFilterSelection();

  const toggle = useCallback(
    (label: string) => {
      toggleActivityType(label);
    },
    [toggleActivityType],
  );

  const clearAll = useCallback(() => clearActivityTypes(), [clearActivityTypes]);

  return (
    <FilterSidebarSection
      title="Activity Type"
      onClearAll={clearAll}
      scrollBody
      collapsed={collapsed}
    >
      {filterActivityOptionLabels.map((label) => (
        <FilterPill
          key={label}
          label={label}
          variant="rounded"
          selected={selectedActivityTypes.has(label)}
          onPress={() => toggle(label)}
        />
      ))}
    </FilterSidebarSection>
  );
}

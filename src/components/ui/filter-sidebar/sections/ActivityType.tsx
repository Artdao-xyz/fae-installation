"use client";

import { useCallback } from "react";
import { ACTIVITY_TYPE_LABELS } from "../config/constants";
import { useFilterSelection } from "../FilterSelectionContext";
import { FilterSidebarSection } from "../primitives/FilterSidebarSection";
import { FilterPill } from "../primitives/FilterPill";

export function ActivityType({ collapsed = false }: { collapsed?: boolean }) {
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
    <FilterSidebarSection
      title="Activity Type"
      onClearAll={clearAll}
      scrollBody
      collapsed={collapsed}
    >
      {ACTIVITY_TYPE_LABELS.map((label) => (
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

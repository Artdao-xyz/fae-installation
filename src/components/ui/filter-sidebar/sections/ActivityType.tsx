"use client";

import { useCallback } from "react";
import { useFilterSelection } from "../FilterSelectionContext";
import { FilterSidebarSection } from "../primitives/FilterSidebarSection";
import { FilterPill } from "../primitives/FilterPill";

export function ActivityType({
  collapsed = false,
  chromeless = false,
}: {
  collapsed?: boolean;
  chromeless?: boolean;
}) {
  const {
    selectedActivityTypes,
    toggleActivityType,
    clearActivityTypes,
    filterActivityOptionLabels,
    contentCatalog,
    contentCatalogStatus,
    activityOptionToggleMatchCount,
  } = useFilterSelection();

  const catalogReady =
    contentCatalogStatus === "success" && contentCatalog.length > 0;

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
      chromeless={chromeless}
      selectionTally={
        chromeless
          ? {
              selected: selectedActivityTypes.size,
              total: filterActivityOptionLabels.length,
            }
          : undefined
      }
    >
      {filterActivityOptionLabels.map((label) => {
        const selected = selectedActivityTypes.has(label);
        const count = activityOptionToggleMatchCount.get(label) ?? 0;
        const disableAdd = catalogReady && !selected && count === 0;
        return (
          <FilterPill
            key={label}
            label={label}
            variant="rounded"
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

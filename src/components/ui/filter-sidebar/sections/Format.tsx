"use client";

import { useCallback } from "react";
import { useFloatingPanelStack } from "@/components/ui/floating-panels/FloatingPanelStackContext";
import { useFilterSelection } from "../FilterSelectionContext";
import { FormatButton } from "../domains/format/FormatButton";
import { FilterSidebarSection } from "../primitives/FilterSidebarSection";

export function Format({
  collapsed = false,
  chromeless = false,
}: {
  collapsed?: boolean;
  chromeless?: boolean;
}) {
  const {
    filterFormatOptionLabels,
    selectedFormats,
    toggleFormat,
    clearSelectedFormats,
    contentCatalog,
    contentCatalogStatus,
    formatOptionToggleMatchCount,
  } = useFilterSelection();
  const { minimizeAllFloatingPanels } = useFloatingPanelStack();

  const catalogReady =
    contentCatalogStatus === "success" && contentCatalog.length > 0;

  const clearAll = useCallback(() => {
    minimizeAllFloatingPanels();
    clearSelectedFormats();
  }, [minimizeAllFloatingPanels, clearSelectedFormats]);

  return (
    <FilterSidebarSection
      title="Mode"
      onClearAll={clearAll}
      collapsed={collapsed}
      chromeless={chromeless}
      selectionTally={
        chromeless
          ? {
              selected: selectedFormats.size,
              total: filterFormatOptionLabels.length,
            }
          : undefined
      }
    >
      {filterFormatOptionLabels.map((label) => {
        const selected = selectedFormats.has(label);
        const count = formatOptionToggleMatchCount.get(label) ?? 0;
        const disableAdd = catalogReady && !selected && count === 0;
        return (
          <FormatButton
            key={label}
            label={label}
            selected={selected}
            onPress={() => {
              minimizeAllFloatingPanels();
              toggleFormat(label);
            }}
            disabled={disableAdd}
            title={
              disableAdd
                ? "Nothing in the catalog matches this with your other filters"
                : label
            }
          />
        );
      })}
    </FilterSidebarSection>
  );
}

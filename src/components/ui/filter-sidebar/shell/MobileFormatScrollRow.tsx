"use client";

import { useFloatingPanelStack } from "@/components/ui/floating-panels/FloatingPanelStackContext";
import { useFilterSelection } from "@/components/ui/filter-sidebar/FilterSelectionContext";
import { FormatButton } from "@/components/ui/filter-sidebar/domains/format/FormatButton";

/** Single-line horizontal format pills for `max-lg` filter sheet (rail has no Format category). */
export function MobileFormatScrollRow() {
  const {
    filterFormatOptionLabels,
    selectedFormats,
    toggleFormat,
    contentCatalog,
    contentCatalogStatus,
    formatOptionToggleMatchCount,
  } = useFilterSelection();
  const { minimizeAllFloatingPanels } = useFloatingPanelStack();

  const catalogReady =
    contentCatalogStatus === "success" && contentCatalog.length > 0;

  if (filterFormatOptionLabels.length === 0) {
    return null;
  }

  return (
    <div
      className="flex w-full shrink-0 flex-nowrap items-center gap-0 overflow-x-auto border-t-hairline border-solid border-ink-primary bg-surface-canvas px-2 py-4 scrollbar-hide"
      role="radiogroup"
      aria-label="Mode filters"
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
            fillAvailableWidth
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
    </div>
  );
}

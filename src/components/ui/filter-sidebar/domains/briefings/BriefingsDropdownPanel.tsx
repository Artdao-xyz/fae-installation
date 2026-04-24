"use client";

import { useCallback } from "react";
import { useFloatingPanelStack } from "@/components/ui/floating-panels/FloatingPanelStackContext";
import { useFilterSelection } from "../../FilterSelectionContext";
import { FilterPillDropdown } from "../../primitives/FilterPillDropdown";
import { FilterPillToggle } from "../../primitives/FilterPillToggle";
import { FAE_BRIEFING_OPTIONS } from "./constants";

type BriefingsDropdownPanelProps = {
  variant?: "default" | "subcolumn";
  onClearAll?: () => void;
  /** Mobile filter right pane: text header + tally, no stripe. */
  mobilePane?: boolean;
};

export function BriefingsDropdownPanel({
  variant = "default",
  onClearAll: onClearAllFromParent,
  mobilePane = false,
}: BriefingsDropdownPanelProps) {
  const { selectedFaeBriefing, setSelectedFaeBriefing } = useFilterSelection();
  const { minimizeAllFloatingPanels } = useFloatingPanelStack();

  const selectBriefing = useCallback(
    (label: string) => {
      minimizeAllFloatingPanels();
      setSelectedFaeBriefing(
        selectedFaeBriefing === label ? null : label,
      );
    },
    [minimizeAllFloatingPanels, selectedFaeBriefing, setSelectedFaeBriefing],
  );

  const handleClearAll = useCallback(() => {
    minimizeAllFloatingPanels();
    onClearAllFromParent?.();
    setSelectedFaeBriefing(null);
  }, [minimizeAllFloatingPanels, onClearAllFromParent, setSelectedFaeBriefing]);

  return (
    <FilterPillDropdown
      tone="fae-briefings"
      variant={variant}
      onClearAll={mobilePane ? undefined : handleClearAll}
      mobileHeader={
        mobilePane
          ? {
              title: "FAE Briefings",
              selectedCount: selectedFaeBriefing != null ? 1 : 0,
              totalCount: FAE_BRIEFING_OPTIONS.length,
            }
          : undefined
      }
    >
      <div
        className="contents"
        role="radiogroup"
        aria-label="FAE Briefing"
      >
        {FAE_BRIEFING_OPTIONS.map((label) => (
          <FilterPillToggle
            key={label}
            label={label}
            tone="fae-briefings"
            selected={selectedFaeBriefing === label}
            onClick={() => selectBriefing(label)}
          />
        ))}
      </div>
    </FilterPillDropdown>
  );
}

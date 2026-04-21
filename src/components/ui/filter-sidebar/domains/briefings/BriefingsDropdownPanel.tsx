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
};

export function BriefingsDropdownPanel({
  variant = "default",
  onClearAll: onClearAllFromParent,
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
      onClearAll={handleClearAll}
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

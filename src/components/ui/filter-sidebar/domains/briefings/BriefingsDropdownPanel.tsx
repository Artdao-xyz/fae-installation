"use client";

import { useCallback } from "react";
import { useFloatingPanelStack } from "@/components/ui/floating-panels/FloatingPanelStackContext";
import { useFilterSelection } from "../../FilterSelectionContext";
import { FilterPillDropdown } from "../../primitives/FilterPillDropdown";
import { FilterPillToggle } from "../../primitives/FilterPillToggle";
import { FAE_BRIEFING_OPTIONS } from "./constants";

const DOMAIN_EMPTY_CLASS =
  "w-full px-0 py-1 font-fira-mono text-[10px] leading-snug text-ink-body/70";

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

  const n = FAE_BRIEFING_OPTIONS.length;
  const hasOptions = n > 0;

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
              totalCount: n,
            }
          : undefined
      }
    >
      {!hasOptions ? (
        <p className={DOMAIN_EMPTY_CLASS}>No content yet.</p>
      ) : (
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
              selectedTone
              onClick={() => selectBriefing(label)}
            />
          ))}
        </div>
      )}
    </FilterPillDropdown>
  );
}

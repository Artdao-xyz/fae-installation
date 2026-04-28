"use client";

import { FAE_BRIEFING_OPTIONS } from "../domains/briefings/constants";
import { useFilterSelection } from "../FilterSelectionContext";
import { FilterSidebarCategoryRow } from "../primitives/FilterSidebarCategoryRow";

type FAEBriefingsMenuProps = {
  subpanelOpen: boolean;
  onToggleSubpanel: () => void;
};

export function FAEBriefingsMenu({
  subpanelOpen,
  onToggleSubpanel,
}: FAEBriefingsMenuProps) {
  const { selectedFaeBriefing } = useFilterSelection();
  const hasOptions = FAE_BRIEFING_OPTIONS.length > 0;
  return (
    <FilterSidebarCategoryRow
      label="FAE Briefings"
      tone="fae-briefings"
      expanded={subpanelOpen}
      onClick={onToggleSubpanel}
      hasSubpanelSelection={selectedFaeBriefing != null}
      disabled={!hasOptions}
    />
  );
}

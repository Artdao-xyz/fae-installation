"use client";

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
  return (
    <FilterSidebarCategoryRow
      label="FAE Briefings"
      tone="fae-briefings"
      expanded={subpanelOpen}
      onClick={onToggleSubpanel}
      hasSubpanelSelection={selectedFaeBriefing != null}
    />
  );
}

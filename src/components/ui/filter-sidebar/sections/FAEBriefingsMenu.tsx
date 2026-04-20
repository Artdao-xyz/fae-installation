"use client";

import { FilterSidebarCategoryRow } from "../primitives/FilterSidebarCategoryRow";

type FAEBriefingsMenuProps = {
  subpanelOpen: boolean;
  onToggleSubpanel: () => void;
  mobileFillCell?: boolean;
};

export function FAEBriefingsMenu({
  subpanelOpen,
  onToggleSubpanel,
  mobileFillCell,
}: FAEBriefingsMenuProps) {
  return (
    <FilterSidebarCategoryRow
      label="FAE Briefings"
      tone="fae-briefings"
      expanded={subpanelOpen}
      onClick={onToggleSubpanel}
      mobileFillCell={mobileFillCell}
    />
  );
}

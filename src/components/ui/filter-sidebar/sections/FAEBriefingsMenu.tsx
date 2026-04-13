"use client";

import { FilterSidebarCategoryRow } from "../primitives/FilterSidebarCategoryRow";

type FAEBriefingsMenuProps = {
  subpanelOpen: boolean;
  onToggleSubpanel: () => void;
};

export function FAEBriefingsMenu({
  subpanelOpen,
  onToggleSubpanel,
}: FAEBriefingsMenuProps) {
  return (
    <FilterSidebarCategoryRow
      label="FAE Briefings"
      tone="fae-briefings"
      expanded={subpanelOpen}
      onClick={onToggleSubpanel}
    />
  );
}

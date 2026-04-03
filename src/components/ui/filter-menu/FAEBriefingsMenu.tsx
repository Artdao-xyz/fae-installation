"use client";

import { FilterMenuCategoryRow } from "./FilterMenuCategoryRow";

type FAEBriefingsMenuProps = {
  subpanelOpen: boolean;
  onToggleSubpanel: () => void;
};

export function FAEBriefingsMenu({
  subpanelOpen,
  onToggleSubpanel,
}: FAEBriefingsMenuProps) {
  return (
    <FilterMenuCategoryRow
      label="FAE Briefings"
      tone="fae-briefings"
      expanded={subpanelOpen}
      onClick={onToggleSubpanel}
    />
  );
}

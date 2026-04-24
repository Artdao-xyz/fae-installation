"use client";

import { FilterSidebarCategoryRow } from "../primitives/FilterSidebarCategoryRow";

type RDProjectsMenuProps = {
  subpanelOpen: boolean;
  onToggleSubpanel: () => void;
};

export function RDProjectsMenu({
  subpanelOpen,
  onToggleSubpanel,
}: RDProjectsMenuProps) {
  return (
    <FilterSidebarCategoryRow
      label="R&D Projects"
      tone="rd"
      expanded={subpanelOpen}
      onClick={onToggleSubpanel}
    />
  );
}

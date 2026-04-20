"use client";

import { FilterSidebarCategoryRow } from "../primitives/FilterSidebarCategoryRow";

type RDProjectsMenuProps = {
  subpanelOpen: boolean;
  onToggleSubpanel: () => void;
  mobileFillCell?: boolean;
};

export function RDProjectsMenu({
  subpanelOpen,
  onToggleSubpanel,
  mobileFillCell,
}: RDProjectsMenuProps) {
  return (
    <FilterSidebarCategoryRow
      label="R&D Projects"
      tone="rd"
      expanded={subpanelOpen}
      onClick={onToggleSubpanel}
      mobileFillCell={mobileFillCell}
    />
  );
}

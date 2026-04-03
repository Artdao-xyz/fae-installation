"use client";

import { FilterMenuCategoryRow } from "./FilterMenuCategoryRow";

type RDProjectsMenuProps = {
  subpanelOpen: boolean;
  onToggleSubpanel: () => void;
};

export function RDProjectsMenu({
  subpanelOpen,
  onToggleSubpanel,
}: RDProjectsMenuProps) {
  return (
    <FilterMenuCategoryRow
      label="R&D Projects"
      tone="rd"
      expanded={subpanelOpen}
      onClick={onToggleSubpanel}
    />
  );
}

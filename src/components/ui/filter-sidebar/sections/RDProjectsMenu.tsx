"use client";

import { RD_PROJECT_OPTION_LABELS } from "../domains/rd-projects/constants";
import { FilterSidebarCategoryRow } from "../primitives/FilterSidebarCategoryRow";

type RDProjectsMenuProps = {
  subpanelOpen: boolean;
  onToggleSubpanel: () => void;
};

export function RDProjectsMenu({
  subpanelOpen,
  onToggleSubpanel,
}: RDProjectsMenuProps) {
  const hasOptions = RD_PROJECT_OPTION_LABELS.length > 0;
  return (
    <FilterSidebarCategoryRow
      label="R&D Projects"
      tone="rd"
      expanded={subpanelOpen}
      onClick={onToggleSubpanel}
      disabled={!hasOptions}
    />
  );
}

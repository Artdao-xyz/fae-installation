"use client";

import { FilterPillDropdown } from "../../primitives/FilterPillDropdown";
import { FilterPillToggle } from "../../primitives/FilterPillToggle";
import { RD_PROJECTS_DROPDOWN_TOGGLES } from "./constants";

type RDProjectsDropdownPanelProps = {
  variant?: "default" | "subcolumn";
  onClearAll?: () => void;
  mobilePane?: boolean;
};

export function RDProjectsDropdownPanel({
  variant = "default",
  onClearAll,
  mobilePane = false,
}: RDProjectsDropdownPanelProps) {
  return (
    <FilterPillDropdown
      tone="rd"
      variant={variant}
      onClearAll={mobilePane ? undefined : onClearAll}
      mobileHeader={
        mobilePane
          ? {
              title: "R&D Projects",
              selectedCount: 0,
              totalCount: RD_PROJECTS_DROPDOWN_TOGGLES.length,
            }
          : undefined
      }
    >
      {RD_PROJECTS_DROPDOWN_TOGGLES.map((label, index) => (
        <FilterPillToggle
          key={`${label}-${index}`}
          label={label}
          tone="rd"
          disabled
          title="Not yet wired to the catalog"
        />
      ))}
    </FilterPillDropdown>
  );
}

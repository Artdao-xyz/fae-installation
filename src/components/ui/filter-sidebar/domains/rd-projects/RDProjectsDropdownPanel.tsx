"use client";

import { FilterPillDropdown } from "../../primitives/FilterPillDropdown";
import { FilterPillToggle } from "../../primitives/FilterPillToggle";
import { RD_PROJECTS_DROPDOWN_TOGGLES } from "./constants";

type RDProjectsDropdownPanelProps = {
  variant?: "default" | "subcolumn";
  onClearAll?: () => void;
};

export function RDProjectsDropdownPanel({
  variant = "default",
  onClearAll,
}: RDProjectsDropdownPanelProps) {
  return (
    <FilterPillDropdown tone="rd" variant={variant} onClearAll={onClearAll}>
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

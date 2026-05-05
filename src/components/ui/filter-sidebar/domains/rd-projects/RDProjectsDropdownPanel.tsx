"use client";

import { FilterPillDropdown } from "../../primitives/FilterPillDropdown";
import { FilterPillToggle } from "../../primitives/FilterPillToggle";
import { RD_PROJECT_OPTION_LABELS } from "./constants";

const DOMAIN_EMPTY_CLASS =
  "w-full px-0 py-1 font-fira-mono text-[10px] leading-snug text-ink-body/70";

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
  const n = RD_PROJECT_OPTION_LABELS.length;

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
              totalCount: n,
            }
          : undefined
      }
    >
      {n === 0 ? (
        <p className={DOMAIN_EMPTY_CLASS}>No content yet.</p>
      ) : (
        RD_PROJECT_OPTION_LABELS.map((label, index) => (
          <FilterPillToggle
            key={`${label}-${index}`}
            label={label}
            tone="rd"
            disabled
            title="R&D filtering is not wired to the catalog yet"
          />
        ))
      )}
    </FilterPillDropdown>
  );
}

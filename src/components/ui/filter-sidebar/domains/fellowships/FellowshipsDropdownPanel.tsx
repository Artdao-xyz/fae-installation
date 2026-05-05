"use client";

import { FilterPillDropdown } from "../../primitives/FilterPillDropdown";
import { FilterPillToggle } from "../../primitives/FilterPillToggle";
import { FELLOWSHIP_OPTION_LABELS } from "./constants";

const DOMAIN_EMPTY_CLASS =
  "w-full px-0 py-1 font-fira-mono text-[10px] leading-snug text-ink-body/70";

type FellowshipsDropdownPanelProps = {
  variant?: "default" | "subcolumn";
  onClearAll?: () => void;
  mobilePane?: boolean;
};

export function FellowshipsDropdownPanel({
  variant = "default",
  onClearAll,
  mobilePane = false,
}: FellowshipsDropdownPanelProps) {
  const n = FELLOWSHIP_OPTION_LABELS.length;

  return (
    <FilterPillDropdown
      tone="latest-updates"
      variant={variant}
      onClearAll={mobilePane ? undefined : onClearAll}
      mobileHeader={
        mobilePane
          ? {
              title: "Fellowships",
              selectedCount: 0,
              totalCount: n,
            }
          : undefined
      }
    >
      {n === 0 ? (
        <p className={DOMAIN_EMPTY_CLASS}>No content yet.</p>
      ) : (
        FELLOWSHIP_OPTION_LABELS.map((label, index) => (
          <FilterPillToggle
            key={`${label}-${index}`}
            label={label}
            tone="latest-updates"
            disabled
            title="Fellowships filtering is not wired to the catalog yet"
          />
        ))
      )}
    </FilterPillDropdown>
  );
}

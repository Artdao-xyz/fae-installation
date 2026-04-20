"use client";

import { useState } from "react";
import { FilterPillDropdown } from "../../primitives/FilterPillDropdown";
import { FilterPillToggle } from "../../primitives/FilterPillToggle";
import { FAE_BRIEFING_OPTIONS } from "./constants";

type BriefingsDropdownPanelProps = {
  variant?: "default" | "subcolumn";
  onClearAll?: () => void;
};

export function BriefingsDropdownPanel({
  variant = "default",
  onClearAll: onClearAllFromParent,
}: BriefingsDropdownPanelProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleClearAll = () => {
    onClearAllFromParent?.();
    setSelected(null);
  };

  return (
    <FilterPillDropdown
      tone="fae-briefings"
      variant={variant}
      onClearAll={handleClearAll}
      selectedCount={selected != null ? 1 : 0}
      totalCount={FAE_BRIEFING_OPTIONS.length}
    >
      <div
        className="contents"
        role="radiogroup"
        aria-label="FAE Briefing"
      >
        {FAE_BRIEFING_OPTIONS.map((label) => (
          <FilterPillToggle
            key={label}
            label={label}
            tone="fae-briefings"
            selected={selected === label}
            onClick={() => setSelected(label)}
          />
        ))}
      </div>
    </FilterPillDropdown>
  );
}

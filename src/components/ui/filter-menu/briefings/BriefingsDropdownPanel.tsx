"use client";

import { useState } from "react";
import { FilterPillDropdown } from "../FilterPillDropdown";
import { FilterPillToggle } from "../FilterPillToggle";
import { FAE_BRIEFING_OPTIONS } from "./constants";

type BriefingsDropdownPanelProps = {
  variant?: "default" | "subcolumn";
  onClearAll?: () => void;
};

export function BriefingsDropdownPanel({
  variant = "default",
  onClearAll: onClearAllFromParent,
}: BriefingsDropdownPanelProps) {
  const [selected, setSelected] = useState<string | null>("FAE 1");

  const handleClearAll = () => {
    onClearAllFromParent?.();
    setSelected(null);
  };

  return (
    <FilterPillDropdown
      tone="fae-briefings"
      variant={variant}
      onClearAll={handleClearAll}
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

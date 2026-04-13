"use client";

import { useCallback, useState } from "react";
import { NETWORK_LABELS } from "../../config/constants";
import { FilterPill } from "../../primitives/FilterPill";
import { FilterPillDropdown } from "../../primitives/FilterPillDropdown";

type NetworkDropdownPanelProps = {
  variant?: "default" | "subcolumn";
  onClearAll?: () => void;
};

export function NetworkDropdownPanel({
  variant = "default",
  onClearAll: onClearAllFromParent,
}: NetworkDropdownPanelProps) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const toggle = useCallback((label: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }, []);

  const handleClearAll = useCallback(() => {
    onClearAllFromParent?.();
    setSelected(new Set());
  }, [onClearAllFromParent]);

  return (
    <FilterPillDropdown
      tone="network"
      variant={variant}
      onClearAll={handleClearAll}
    >
      <div className="contents" role="group" aria-label="Network">
        {NETWORK_LABELS.map((label) => (
          <FilterPill
            key={label}
            label={label}
            tone="network"
            selected={selected.has(label)}
            onPress={() => toggle(label)}
          />
        ))}
      </div>
    </FilterPillDropdown>
  );
}

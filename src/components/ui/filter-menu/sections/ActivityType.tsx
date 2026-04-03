"use client";

import { useCallback, useState } from "react";
import { ACTIVITY_TYPE_LABELS } from "../config/constants";
import { FilterMenuSection } from "../primitives/FilterMenuSection";
import { FilterPill } from "../primitives/FilterPill";

export function ActivityType() {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const toggle = useCallback((label: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => setSelected(new Set()), []);

  return (
    <FilterMenuSection
      title="Activity Type"
      onClearAll={clearAll}
      scrollBody
    >
      {ACTIVITY_TYPE_LABELS.map((label) => (
        <FilterPill
          key={label}
          label={label}
          selected={selected.has(label)}
          onPress={() => toggle(label)}
        />
      ))}
    </FilterMenuSection>
  );
}

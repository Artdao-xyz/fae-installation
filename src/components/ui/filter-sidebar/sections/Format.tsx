"use client";

import { useCallback, useState } from "react";
import { FORMAT_ITEMS } from "../domains/format/formatItems";
import { FilterSidebarSection } from "../primitives/FilterSidebarSection";
import { FilterPill } from "../primitives/FilterPill";

export function Format({ collapsed = false }: { collapsed?: boolean }) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => setSelected(new Set()), []);

  return (
    <FilterSidebarSection
      title="Format"
      onClearAll={clearAll}
      selectedCount={selected.size}
      totalCount={FORMAT_ITEMS.length}
      scrollBody
      collapsed={collapsed}
    >
      {FORMAT_ITEMS.map(({ id, label }) => (
        <FilterPill
          key={id}
          label={label}
          variant="square"
          selected={selected.has(id)}
          onPress={() => toggle(id)}
        />
      ))}
    </FilterSidebarSection>
  );
}

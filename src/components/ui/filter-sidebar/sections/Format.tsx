"use client";

import { useCallback, useState } from "react";
import { FormatButton } from "../domains/format/FormatButton";
import { FORMAT_ITEMS } from "../domains/format/formatItems";
import { FilterSidebarSection } from "../primitives/FilterSidebarSection";

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
      collapsed={collapsed}
    >
      {FORMAT_ITEMS.map(({ id, label }) => (
        <FormatButton
          key={id}
          label={label}
          selected={selected.has(id)}
          onPress={() => toggle(id)}
        />
      ))}
    </FilterSidebarSection>
  );
}

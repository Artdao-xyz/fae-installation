"use client";

import { useCallback, useState } from "react";
import { useFilterSelection } from "../FilterSelectionContext";
import { FormatButton } from "../domains/format/FormatButton";
import { FilterSidebarSection } from "../primitives/FilterSidebarSection";

export function Format({ collapsed = false }: { collapsed?: boolean }) {
  const { filterResetNonce } = useFilterSelection();
  return <FormatInner key={filterResetNonce} collapsed={collapsed} />;
}

function FormatInner({ collapsed = false }: { collapsed?: boolean }) {
  const { filterFormatOptionLabels } = useFilterSelection();
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
      {filterFormatOptionLabels.map((label) => (
        <FormatButton
          key={label}
          label={label}
          selected={selected.has(label)}
          onPress={() => toggle(label)}
        />
      ))}
    </FilterSidebarSection>
  );
}

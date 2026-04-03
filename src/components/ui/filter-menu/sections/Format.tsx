"use client";

import { useCallback, useState } from "react";
import { FormatIconButton } from "../domains/format/FormatIconButton";
import { FORMAT_ICON_ITEMS } from "../domains/format/formatItems";
import { FilterMenuSection } from "../primitives/FilterMenuSection";

export function Format() {
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
    <FilterMenuSection title="Format" onClearAll={clearAll}>
      {FORMAT_ICON_ITEMS.map(({ id, label, Icon }) => (
        <FormatIconButton
          key={id}
          label={label}
          Icon={Icon}
          selected={selected.has(id)}
          onPress={() => toggle(id)}
        />
      ))}
    </FilterMenuSection>
  );
}

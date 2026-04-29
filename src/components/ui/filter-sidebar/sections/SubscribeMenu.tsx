"use client";

import { FilterSidebarCategoryRow } from "../primitives/FilterSidebarCategoryRow";

type SubscribeMenuProps = {
  subpanelOpen: boolean;
  onToggleSubpanel: () => void;
};

export function SubscribeMenu({ subpanelOpen, onToggleSubpanel }: SubscribeMenuProps) {
  return (
    <FilterSidebarCategoryRow
      label="Subscribe"
      tone="editorial"
      expanded={subpanelOpen}
      onClick={onToggleSubpanel}
      showCategoryMarker={false}
    />
  );
}

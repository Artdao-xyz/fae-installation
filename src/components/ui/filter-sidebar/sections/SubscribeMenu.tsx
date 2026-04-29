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
      labelClassName="font-suisseintl text-xs"
      tone="subscribe"
      expanded={subpanelOpen}
      onClick={onToggleSubpanel}
      showCategoryMarker={false}
    />
  );
}

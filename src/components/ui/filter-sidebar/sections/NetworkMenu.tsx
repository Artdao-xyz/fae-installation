"use client";

import { useFilterSelection } from "../FilterSelectionContext";
import { FilterSidebarCategoryRow } from "../primitives/FilterSidebarCategoryRow";

type NetworkMenuProps = {
  subpanelOpen: boolean;
  onToggleSubpanel: () => void;
};

export function NetworkMenu({ subpanelOpen, onToggleSubpanel }: NetworkMenuProps) {
  const { selectedNetworks } = useFilterSelection();
  return (
    <FilterSidebarCategoryRow
      label="Network"
      tone="network"
      expanded={subpanelOpen}
      onClick={onToggleSubpanel}
      hasSubpanelSelection={selectedNetworks.size > 0}
      showCategoryMarker={false}
    />
  );
}

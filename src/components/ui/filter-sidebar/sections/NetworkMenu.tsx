"use client";

import { useFilterSelection } from "../FilterSelectionContext";
import { FilterSidebarCategoryRow } from "../primitives/FilterSidebarCategoryRow";

type NetworkMenuProps = {
  subpanelOpen: boolean;
  onToggleSubpanel: () => void;
};

export function NetworkMenu({ subpanelOpen, onToggleSubpanel }: NetworkMenuProps) {
  const { selectedNetworks } = useFilterSelection();
  const selectedNetworkLabels = Array.from(selectedNetworks);
  const selectedNetworkLabel =
    selectedNetworkLabels.length === 0
      ? undefined
      : selectedNetworkLabels.length === 1
        ? selectedNetworkLabels[0]
        : `${selectedNetworkLabels[0]} +${selectedNetworkLabels.length - 1}`;
  return (
    <FilterSidebarCategoryRow
      label="Network"
      secondaryLabel={selectedNetworkLabel}
      tone="network"
      expanded={subpanelOpen}
      onClick={onToggleSubpanel}
      hasSubpanelSelection={selectedNetworks.size > 0}
      showCategoryMarker={false}
      large
    />
  );
}

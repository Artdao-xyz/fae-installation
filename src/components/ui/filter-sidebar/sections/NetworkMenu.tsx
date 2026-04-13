import { FilterSidebarCategoryRow } from "../primitives/FilterSidebarCategoryRow";

type NetworkMenuProps = {
  subpanelOpen: boolean;
  onToggleSubpanel: () => void;
};

export function NetworkMenu({ subpanelOpen, onToggleSubpanel }: NetworkMenuProps) {
  return (
    <FilterSidebarCategoryRow
      label="Network"
      tone="network"
      expanded={subpanelOpen}
      onClick={onToggleSubpanel}
    />
  );
}

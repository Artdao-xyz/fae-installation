import { FilterSidebarCategoryRow } from "../primitives/FilterSidebarCategoryRow";

type NetworkMenuProps = {
  subpanelOpen: boolean;
  onToggleSubpanel: () => void;
  mobileFillCell?: boolean;
};

export function NetworkMenu({
  subpanelOpen,
  onToggleSubpanel,
  mobileFillCell,
}: NetworkMenuProps) {
  return (
    <FilterSidebarCategoryRow
      label="Network"
      tone="network"
      expanded={subpanelOpen}
      onClick={onToggleSubpanel}
      mobileFillCell={mobileFillCell}
    />
  );
}

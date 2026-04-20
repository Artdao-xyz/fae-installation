import { FilterSidebarCategoryRow } from "../primitives/FilterSidebarCategoryRow";

type ArtistsMenuProps = {
  subpanelOpen: boolean;
  onToggleSubpanel: () => void;
};

export function ArtistsMenu({
  subpanelOpen,
  onToggleSubpanel,
}: ArtistsMenuProps) {
  return (
    <FilterSidebarCategoryRow
      label="Artists"
      tone="artists"
      expanded={subpanelOpen}
      onClick={onToggleSubpanel}
    />
  );
}

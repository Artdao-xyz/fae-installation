"use client";

import { useFilterSelection } from "../FilterSelectionContext";
import { FilterSidebarCategoryRow } from "../primitives/FilterSidebarCategoryRow";

type ArtistsMenuProps = {
  subpanelOpen: boolean;
  onToggleSubpanel: () => void;
};

export function ArtistsMenu({
  subpanelOpen,
  onToggleSubpanel,
}: ArtistsMenuProps) {
  const { selectedArtists } = useFilterSelection();
  return (
    <FilterSidebarCategoryRow
      label="Artists"
      tone="artists"
      expanded={subpanelOpen}
      onClick={onToggleSubpanel}
      hasSubpanelSelection={selectedArtists.size > 0}
    />
  );
}

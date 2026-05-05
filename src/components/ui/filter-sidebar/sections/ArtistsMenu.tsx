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
  const selectedArtistLabels = Array.from(selectedArtists);
  const selectedArtistLabel =
    selectedArtistLabels.length === 0
      ? undefined
      : selectedArtistLabels.length === 1
        ? selectedArtistLabels[0]
        : `${selectedArtistLabels[0]} +${selectedArtistLabels.length - 1}`;
  return (
    <FilterSidebarCategoryRow
      label="Artists"
      secondaryLabel={selectedArtistLabel}
      tone="artists"
      expanded={subpanelOpen}
      onClick={onToggleSubpanel}
      hasSubpanelSelection={selectedArtists.size > 0}
      showCategoryMarker={false}
      large
    />
  );
}

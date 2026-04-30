"use client";

import { useFilterSelection } from "../FilterSelectionContext";

/** Shown when Focus / Activity / Artists filters are active but no catalog row matches (AND). */
export function FilterTaxonomyEmptyHint() {
  const {
    contentCatalogStatus,
    contentCatalog,
    selectedFocusAreas,
    selectedActivityTypes,
    selectedArtists,
    selectedFormats,
    selectedNetworks,
    filterMatchingRowCount,
  } = useFilterSelection();

  const hasTaxonomySelection =
    selectedFocusAreas.size > 0 ||
    selectedActivityTypes.size > 0 ||
    selectedArtists.size > 0 ||
    selectedFormats.size > 0 ||
    selectedNetworks.size > 0;

  const ready =
    contentCatalogStatus === "success" && contentCatalog.length > 0;

  if (!ready || !hasTaxonomySelection || filterMatchingRowCount > 0) {
    return null;
  }

  return (
    <p
      className="border-t-hairline border-solid border-border bg-[#fafafa] px-3 py-2 font-fira-mono text-[10px] leading-snug text-ink-body/85"
      role="status"
    >
      No outputs match this combination. Remove a filter or choose another tag — unavailable
      options appear faded and are not clickable.
    </p>
  );
}

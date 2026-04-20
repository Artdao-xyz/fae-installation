import { FilterSidebarCategoryRow } from "../primitives/FilterSidebarCategoryRow";

export function ArtistsMenu({
  mobileFillCell,
}: {
  mobileFillCell?: boolean;
} = {}) {
  return (
    <FilterSidebarCategoryRow label="Artists" tone="artists" mobileFillCell={mobileFillCell} />
  );
}

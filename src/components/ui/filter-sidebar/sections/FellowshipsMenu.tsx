import { FilterSidebarCategoryRow } from "../primitives/FilterSidebarCategoryRow";

export function FellowshipsMenu({
  mobileFillCell,
}: {
  mobileFillCell?: boolean;
} = {}) {
  return (
    <FilterSidebarCategoryRow label="Fellowships" tone="fellowships" mobileFillCell={mobileFillCell} />
  );
}

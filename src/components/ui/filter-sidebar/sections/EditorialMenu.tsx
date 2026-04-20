import { FilterSidebarCategoryRow } from "../primitives/FilterSidebarCategoryRow";

export function EditorialMenu({
  mobileFillCell,
}: {
  mobileFillCell?: boolean;
} = {}) {
  return (
    <FilterSidebarCategoryRow label="Editorial" tone="editorial" mobileFillCell={mobileFillCell} />
  );
}

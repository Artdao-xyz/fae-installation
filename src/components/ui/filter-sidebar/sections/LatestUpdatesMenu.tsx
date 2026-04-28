import { FELLOWSHIP_OPTION_LABELS } from "../domains/fellowships/constants";
import { FilterSidebarCategoryRow } from "../primitives/FilterSidebarCategoryRow";

/** “Fellowships” in the filter stack (CMS options drive interactivity when wired). */
export function LatestUpdatesMenu() {
  const hasOptions = FELLOWSHIP_OPTION_LABELS.length > 0;
  return (
    <FilterSidebarCategoryRow
      label="Fellowships"
      tone="latest-updates"
      disabled={!hasOptions}
    />
  );
}

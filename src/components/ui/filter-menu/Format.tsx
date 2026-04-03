import { FORMAT_LABELS } from "./constants";
import { FilterPill } from "./FilterPill";
import { FilterMenuSection } from "./FilterMenuSection";

export function Format() {
  return (
    <FilterMenuSection title="Format">
      {FORMAT_LABELS.map((label) => (
        <FilterPill key={label} label={label} />
      ))}
    </FilterMenuSection>
  );
}

import type { FilterSidebarCategoryTone } from "../config/filterSidebarTones";
import { filterDottedPillClassName } from "./filterFramedClasses";

type FilterPillToggleProps = {
  label: string;
  tone?: FilterSidebarCategoryTone;
  selected?: boolean;
  onClick?: () => void;
};

export function FilterPillToggle({
  label,
  tone = "fae-briefings",
  selected = false,
  onClick,
}: FilterPillToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      role={onClick ? "radio" : undefined}
      aria-checked={onClick ? selected : undefined}
      data-tone={tone}
      className={filterDottedPillClassName(selected)}
      data-name="Filters-Button-Toggle"
    >
      {label}
    </button>
  );
}

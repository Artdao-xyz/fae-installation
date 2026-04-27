"use client";

import type { FilterSidebarCategoryTone } from "../config/filterSidebarTones";
import { filterDottedPillClassName } from "./filterFramedClasses";

type FilterPillToggleProps = {
  label: string;
  tone?: FilterSidebarCategoryTone;
  selected?: boolean;
  onClick?: () => void;
  /** Dim and block presses (e.g. placeholder toggles not wired to the catalog). */
  disabled?: boolean;
  title?: string;
  /** Use the category tone for selected state instead of the global selection blue. */
  selectedTone?: boolean;
};

export function FilterPillToggle({
  label,
  tone = "fae-briefings",
  selected = false,
  onClick,
  disabled = false,
  title,
  selectedTone = false,
}: FilterPillToggleProps) {
  const interactive = Boolean(onClick) && !disabled;
  const cursorClass = disabled ? "!cursor-not-allowed opacity-45" : "";

  return (
    <button
      type="button"
      onClick={interactive ? onClick : undefined}
      disabled={disabled}
      aria-disabled={disabled ? true : undefined}
      role={interactive ? "radio" : undefined}
      aria-checked={interactive ? selected : undefined}
      title={title}
      data-tone={tone}
      className={[
        filterDottedPillClassName(selected, selectedTone ? tone : undefined),
        cursorClass,
      ]
        .filter(Boolean)
        .join(" ")}
      data-name="Filters-Button-Toggle"
    >
      {label}
    </button>
  );
}

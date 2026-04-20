"use client";

import { CategoryMarkerIcon } from "./CategoryMarkerIcon";
import { filterPillSelection } from "./filterFramedClasses";
import type { FilterSidebarCategoryTone } from "../config/filterSidebarTones";

type FilterSidebarRailRowProps = {
  label: string;
  tone: FilterSidebarCategoryTone;
  /** Accordion: this row’s panel is open (not mutually exclusive radio semantics; use `aria-expanded`). */
  expanded: boolean;
  /** Optional id of the panel this control expands (mobile SR). */
  controlsId?: string;
  onClick: () => void;
  /**
   * When true (mobile primary rail), shares vertical space with siblings: rows grow equally
   * to fill the parent column (`flex-1 basis-0`).
   */
  growToFill?: boolean;
};

/**
 * Mobile filter left rail: icon above label, tight tracking.
 */
export function FilterSidebarRailRow({
  label,
  tone,
  expanded,
  controlsId,
  onClick,
  growToFill,
}: FilterSidebarRailRowProps) {
  const fill = growToFill === true;
  /** Mobile bottom rail: larger tap targets and type when sharing column height. */
  const relaxed = fill;
  const railChrome = expanded
    ? "border-l-4 border-solid border-l-[color:var(--color-filter-pill-selection)] bg-[color:var(--color-page-gradient-edge)] hover:bg-[color:var(--color-page-gradient-edge)]"
    : "border-l-4 border-solid border-l-transparent bg-surface-canvas hover:bg-surface-hover/50";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      aria-controls={controlsId}
      className={`relative flex w-full flex-row items-stretch border-t-hairline border-r-hairline border-solid border-ink-primary text-left backdrop-blur-fae-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary ${railChrome} ${fill ? "min-h-18 flex-1 basis-0" : "min-h-[68px]"}`}
      data-name="FiltersSection"
    >
      <span
        className={`flex min-w-0 w-full flex-1 flex-col flex-wrap items-start content-start justify-center ${relaxed ? "gap-2 px-3 py-4" : "gap-[5px] px-2.5 py-3"}`}
      >
        <CategoryMarkerIcon
          tone={tone}
          className={`shrink-0 object-contain ${relaxed ? "h-[22px] w-[22px]" : "h-[14px] w-[14px]"} ${expanded ? "opacity-100" : "opacity-50"}`}
        />
        <span
          className={`w-full min-w-0 wrap-break-word text-left font-lust-text tracking-[0.5px] ${relaxed ? "text-[14px] leading-[22px]" : "text-sm leading-[18px]"} ${expanded ? filterPillSelection.text : "text-ink-body"}`}
        >
          {label}
        </span>
      </span>
    </button>
  );
}

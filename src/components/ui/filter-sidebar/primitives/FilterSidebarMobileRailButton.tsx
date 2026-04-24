"use client";

import { CategoryMarkerIcon } from "./CategoryMarkerIcon";
import type { FilterSidebarCategoryTone } from "../config/filterSidebarTones";
import {
  categorySubpanelLabelSelectionBgClass,
  toneAccentClass,
} from "../config/filterSidebarTones";
import {
  interactiveChromeHoverClass,
  interactiveChromeMatClass,
} from "./filterFramedClasses";

const matBaseTransitionClass =
  "backdrop-blur-fae-sm transition-colors duration-150 motion-reduce:transition-none";

/** Focus / Activity: slightly darker than canvas (mobile rail only). */
const EMPHASIZED_RAIL_MAT_CLASS = `${matBaseTransitionClass} bg-[color:color-mix(in_srgb,black_5%,var(--color-surface-canvas))]`;

/** Selected: thick blue left stripe + blue label; background matches row type (no selected-only fill). */
const SELECTED_BORDER_LEFT =
  "border-t-hairline border-t-solid border-t-ink-primary border-l-[3px] border-l-solid border-l-[#0000ff] border-r-0";
const SELECTED_TEXT = "text-[#0000ff]";
/** Non-selected rail label: same ink as body, slightly softened. */
const RAIL_LABEL_IDLE_TEXT = "text-ink-body/80";

const ROW_BORDER_TOP_SOLID = "border-t-hairline border-t-solid border-t-ink-primary";
const ROW_RIGHT_SOLID = "border-r-hairline border-r-solid border-r-ink-primary";
/** Focus / Activity only (`flexToFill`): hairline dotted rule (explicit per-side so it is not overridden). */
const ROW_RIGHT_DOTTED =
  "[border-right-width:var(--border-width-hairline)] [border-right-style:dotted] [border-right-color:var(--color-ink-primary)]";

type FilterSidebarMobileRailButtonProps = {
  label: string;
  tone: FilterSidebarCategoryTone;
  /** This category is selected in the rail (right pane shows its filters). */
  selected: boolean;
  /** At least one filter is active in this category (badge cue). */
  hasSelection?: boolean;
  /** Category marker glyph (Focus / Activity omit on mobile rail). */
  showMarker?: boolean;
  /** Split remaining rail height with other `flexToFill` rows (Focus + Activity only). */
  flexToFill?: boolean;
  onClick: () => void;
};

/**
 * Mobile filter sheet: category control with marker above label, left-aligned.
 */
export function FilterSidebarMobileRailButton({
  label,
  tone,
  selected,
  hasSelection = false,
  showMarker = true,
  flexToFill = false,
  onClick,
}: FilterSidebarMobileRailButtonProps) {
  const { glow } = toneAccentClass[tone];
  const showToneStripe = hasSelection && !selected;

  const matClass = (() => {
    if (flexToFill) {
      if (selected) return EMPHASIZED_RAIL_MAT_CLASS;
      if (hasSelection)
        return `${matBaseTransitionClass} ${categorySubpanelLabelSelectionBgClass[tone]}`;
      return EMPHASIZED_RAIL_MAT_CLASS;
    }
    if (selected) return interactiveChromeMatClass;
    if (hasSelection)
      return `${matBaseTransitionClass} ${categorySubpanelLabelSelectionBgClass[tone]}`;
    return interactiveChromeMatClass;
  })();

  const hoverClass = selected
    ? "hover:brightness-[1.02] motion-reduce:hover:brightness-100"
    : hasSelection
      ? "hover:brightness-[0.96] motion-reduce:hover:brightness-100"
      : interactiveChromeHoverClass;

  const heightClass = flexToFill
    ? "min-h-0 flex-1 basis-0"
    : "h-[5.25rem] shrink-0 flex-none";

  const borderClass = selected
    ? SELECTED_BORDER_LEFT
    : [
        ROW_BORDER_TOP_SOLID,
        flexToFill ? ROW_RIGHT_DOTTED : ROW_RIGHT_SOLID,
      ].join(" ");

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={selected ? "true" : undefined}
      className={`relative flex w-full flex-col items-start justify-center px-3 py-2 text-left ${heightClass} ${showMarker ? "gap-1" : "gap-0"} ${borderClass} ${selected ? SELECTED_TEXT : RAIL_LABEL_IDLE_TEXT} ${matClass} ${hoverClass} focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary`}
      data-name="Filters-Mobile-Rail-Category"
    >
      {showToneStripe ? (
        <span
          className={`pointer-events-none absolute inset-y-0 left-0 w-[3px] ${glow}`}
          aria-hidden
        />
      ) : null}
      {showMarker ? (
        <CategoryMarkerIcon
          tone={tone}
          className="size-7 shrink-0 object-contain"
        />
      ) : null}
      <span className="w-full min-w-0 font-lust-text text-[15px] font-normal leading-snug">
        {label}
      </span>
    </button>
  );
}

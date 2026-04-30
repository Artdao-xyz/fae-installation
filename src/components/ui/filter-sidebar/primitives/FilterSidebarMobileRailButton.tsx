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
  "border-t-hairline border-t-solid border-t-border border-l-[3px] border-l-solid border-l-[#0000ff]";
const SELECTED_BORDER_RIGHT_NONE = "border-r-0";
const SELECTED_TEXT = "text-[#0000ff]";
const selectedToneBorderLeftClass: Record<FilterSidebarCategoryTone, string> = {
  "fae-briefings": "border-l-filter-category-fae-briefings",
  "latest-updates": "border-l-filter-category-latest-updates",
  rd: "border-l-filter-category-rd",
  editorial: "border-l-filter-category-editorial",
  artists: "border-l-filter-category-artists",
  network: "border-l-filter-category-network",
  subscribe: "border-l-[color:var(--color-filter-pill-selection)]",
};
/** Non-selected rail label: same ink as body, slightly softened. */
const RAIL_LABEL_IDLE_TEXT = "text-ink-body/80";

const ROW_BORDER_TOP_SOLID = "border-t-hairline border-t-solid border-t-border";
const ROW_RIGHT_SOLID = "border-r-hairline border-r-solid border-r-border";
/** Focus / Activity only (`flexToFill`): hairline dotted rule (explicit per-side so it is not overridden). */
const ROW_RIGHT_DOTTED =
  "[border-right-width:var(--border-width-hairline)] [border-right-style:dotted] [border-right-color:var(--color-border)]";

type FilterSidebarMobileRailButtonProps = {
  label: string;
  tone: FilterSidebarCategoryTone;
  /** This category is selected in the rail (right pane shows its filters). */
  selected: boolean;
  /** At least one filter is active in this category (badge cue). */
  hasSelection?: boolean;
  /** Category marker glyph (Focus / Activity omit on mobile rail). */
  showMarker?: boolean;
  /** Split remaining rail height with other `flexToFill` rows. */
  flexToFill?: boolean;
  /** Use the slightly darker Focus-style rail mat without changing row height. */
  emphasized?: boolean;
  /** Keep the right rail rule dotted, including selected state. */
  dottedRightBorder?: boolean;
  /** Use this category's tone instead of selection blue for the active rail state. */
  selectedTone?: boolean;
  /** No CMS-backed options yet — cannot open this category pane. */
  disabled?: boolean;
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
  emphasized = false,
  dottedRightBorder = false,
  selectedTone = false,
  disabled = false,
  onClick,
}: FilterSidebarMobileRailButtonProps) {
  const { glow, marker } = toneAccentClass[tone];
  const showToneStripe = hasSelection && !selected;
  const useEmphasizedMat = flexToFill || emphasized;
  const useDottedRightBorder = flexToFill || dottedRightBorder;
  const selectedTextClass = selectedTone ? marker : SELECTED_TEXT;
  const selectedBorderClass = [
    selectedTone
      ? `${SELECTED_BORDER_LEFT} ${selectedToneBorderLeftClass[tone]}`
      : SELECTED_BORDER_LEFT,
    useDottedRightBorder ? ROW_RIGHT_DOTTED : SELECTED_BORDER_RIGHT_NONE,
  ].join(" ");

  const matClass = (() => {
    if (useEmphasizedMat) {
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

  const hoverClass = disabled
    ? "cursor-not-allowed opacity-45 motion-reduce:opacity-50"
    : selected
      ? "hover:brightness-[1.02] motion-reduce:hover:brightness-100"
      : hasSelection
        ? "hover:brightness-[0.96] motion-reduce:hover:brightness-100"
        : interactiveChromeHoverClass;

  const heightClass = flexToFill
    ? "min-h-[5.5rem] flex-1 basis-[5.5rem]"
    : "h-[4.5rem] shrink-0 flex-none";

  const borderClass = selected
    ? selectedBorderClass
    : [
        ROW_BORDER_TOP_SOLID,
        useDottedRightBorder ? ROW_RIGHT_DOTTED : ROW_RIGHT_SOLID,
      ].join(" ");

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-current={selected ? "true" : undefined}
      aria-disabled={disabled ? true : undefined}
      className={`relative flex w-full flex-col items-start justify-center px-3 py-2 text-left ${heightClass} ${showMarker ? "gap-1" : "gap-0"} ${borderClass} ${selected ? selectedTextClass : RAIL_LABEL_IDLE_TEXT} ${matClass} ${hoverClass} focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary`}
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

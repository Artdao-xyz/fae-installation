"use client";

import { useState } from "react";
import type { FilterSidebarCategoryTone } from "../config/filterSidebarTones";
import {
  filterDottedPillClassName,
  filterFramedOuterFocusClass,
  filterFramedRoundedInnerClass,
  filterFramedRoundedOuterSelectedClass,
  filterFramedRoundedOuterSelectedToneClass,
  filterPillSelection,
  filterPillLabelBoxClass,
  filterPillSingleLayerBrightnessHoverClass,
  interactiveChromeMatClass,
} from "./filterFramedClasses";
import {
  toneAccentClass,
  toneSelectedBorderClass,
} from "../config/filterSidebarTones";

export type FilterPillVariant = "rounded" | "square" | "dotted";

type FilterPillProps = {
  label: string;
  tone?: FilterSidebarCategoryTone;
  /** `rounded` — hairline solid frame. `square` — side rails + outlined label cell. `dotted` — hairline dotted frame (default for domain filters). */
  variant?: FilterPillVariant;
  expanded?: boolean;
  onExpandedChange?: (open: boolean) => void;
  selected?: boolean;
  onPress?: () => void;
  className?: string;
  disabled?: boolean;
  title?: string;
  /** Use the category tone for selected state instead of the global selection blue. */
  selectedTone?: boolean;
};

/**
 * Corner markers: 2×2 SVG rects, `crispEdges`, ±1px placement (even size → whole-pixel centering).
 * Same CSS size on every display; scaling by `devicePixelRatio` made external monitors look too big.
 */
const SQUARE_MARKER_SIZE = 2;
const SQUARE_CORNER_POSITIONS = [
  "left-0 top-0 -translate-x-px -translate-y-px",
  "right-0 top-0 translate-x-px -translate-y-px",
  "left-0 bottom-0 -translate-x-px translate-y-px",
  "right-0 bottom-0 translate-x-px translate-y-px",
] as const;

function SquareCornerMarkers({
  selected,
  tone,
}: {
  selected: boolean;
  tone?: FilterSidebarCategoryTone;
}) {
  const n = SQUARE_MARKER_SIZE;
  return (
    <>
      {SQUARE_CORNER_POSITIONS.map((positionClass, i) => (
        <svg
          key={i}
          width={n}
          height={n}
          viewBox={`0 0 ${n} ${n}`}
          shapeRendering="crispEdges"
          className={`pointer-events-none absolute z-0 block shrink-0 ${positionClass} ${
            selected
              ? tone
                ? toneAccentClass[tone].marker
                : filterPillSelection.text
              : "text-ink-primary"
          }`}
          aria-hidden
        >
          <rect width={n} height={n} x={0} y={0} fill="currentColor" />
        </svg>
      ))}
    </>
  );
}

function SquarePillFrame({
  label,
  selected,
  tone,
}: {
  label: string;
  selected: boolean;
  tone?: FilterSidebarCategoryTone;
}) {
  const cellBorder = selected
    ? `${interactiveChromeMatClass} ${
        tone ? toneAccentClass[tone].marker : filterPillSelection.text
      } border-hairline border-solid ${
        tone ? toneSelectedBorderClass[tone] : filterPillSelection.border
      }`
    : `${interactiveChromeMatClass} border-hairline border-solid border-ink-primary text-ink-primary`;

  return (
    <span className="relative isolate inline-flex items-center justify-center">
      <SquareCornerMarkers selected={selected} tone={tone} />
      <span
        className={`relative z-10 box-border inline-flex items-center justify-center ${filterPillLabelBoxClass} line-clamp-2 ${cellBorder}`}
      >
        {label}
      </span>
    </span>
  );
}

export function FilterPill({
  label,
  tone = "fae-briefings",
  variant = "dotted",
  expanded: expandedProp,
  onExpandedChange,
  selected = false,
  selectedTone = false,
  onPress,
  className,
  disabled = false,
  title,
}: FilterPillProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const controlled = expandedProp !== undefined;
  const isOpen = controlled ? expandedProp : internalOpen;

  const setOpen = (next: boolean) => {
    if (!controlled) setInternalOpen(next);
    onExpandedChange?.(next);
  };

  const expandable =
    onExpandedChange !== undefined || expandedProp !== undefined;

  const toggle = () => {
    if (disabled) return;
    if (onPress) {
      onPress();
      return;
    }
    if (!expandable) return;
    setOpen(!isOpen);
  };

  const isSquare = variant === "square";
  const isDotted = variant === "dotted";

  const unavailable = disabled && !selected;
  /** `!cursor-not-allowed` beats `cursor-pointer` from `filterFramedOuterFocusClass` on dotted/rounded outers. */
  const cursorAndFadeClass = unavailable
    ? "!cursor-not-allowed opacity-45"
    : "cursor-pointer";
  const selectedToneValue = selectedTone ? tone : undefined;

  if (isDotted) {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={unavailable}
        aria-disabled={unavailable ? true : undefined}
        title={title}
        aria-expanded={expandable ? isOpen : undefined}
        aria-pressed={onPress ? selected : undefined}
        className={[
          filterDottedPillClassName(selected, selectedToneValue),
          cursorAndFadeClass,
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        data-tone={tone}
        data-variant="dotted"
      >
        <span className="block min-w-0 w-full truncate text-left">{label}</span>
      </button>
    );
  }

  if (isSquare) {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={unavailable}
        aria-disabled={unavailable ? true : undefined}
        title={title}
        aria-expanded={expandable ? isOpen : undefined}
        aria-pressed={onPress ? selected : undefined}
        className={[
          "inline-flex items-center justify-start border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-primary focus-visible:ring-offset-0",
          filterPillSingleLayerBrightnessHoverClass,
          cursorAndFadeClass,
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        data-tone={tone}
        data-variant="square"
      >
        <SquarePillFrame
          label={label}
          selected={selected}
          tone={selectedToneValue}
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={unavailable}
      aria-disabled={unavailable ? true : undefined}
      title={title}
      aria-expanded={expandable ? isOpen : undefined}
      aria-pressed={onPress ? selected : undefined}
      className={[
        `fae-control-filter-outer ${filterFramedOuterFocusClass} ${filterPillSingleLayerBrightnessHoverClass} ${
          selected
            ? selectedTone
              ? filterFramedRoundedOuterSelectedToneClass(tone)
              : filterFramedRoundedOuterSelectedClass
            : ""
        } inline-flex items-baseline ${cursorAndFadeClass}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      data-tone={tone}
      data-variant="rounded"
    >
      <span className={filterFramedRoundedInnerClass(selected, selectedToneValue)}>
        {label}
      </span>
    </button>
  );
}

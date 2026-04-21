"use client";

import { useState } from "react";
import type { FilterSidebarCategoryTone } from "../config/filterSidebarTones";
import {
  filterDottedPillClassName,
  filterFramedOuterFocusClass,
  filterFramedRoundedInnerClass,
  filterFramedRoundedOuterSelectedClass,
  filterPillLabelBoxClass,
  filterPillSelection,
} from "./filterFramedClasses";

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

function SquareCornerMarkers({ selected }: { selected: boolean }) {
  const fill = selected
    ? "var(--color-filter-pill-selection)"
    : "var(--color-ink-primary)";
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
          className={`pointer-events-none absolute z-0 block shrink-0 ${positionClass}`}
          aria-hidden
        >
          <rect width={n} height={n} x={0} y={0} fill={fill} />
        </svg>
      ))}
    </>
  );
}

function SquarePillFrame({ label, selected }: { label: string; selected: boolean }) {
  const cellOutline = selected
    ? `${filterPillSelection.text} outline-[0.5px] outline-offset-[-0.5px] ${filterPillSelection.outline}`
    : "text-ink-primary outline-[0.5px] outline-offset-[-0.5px] outline-ink-primary";

  return (
    <span className="relative isolate inline-flex items-center justify-center">
      <SquareCornerMarkers selected={selected} />
      <span
        className={`relative z-10 inline-flex items-center justify-center bg-transparent ${filterPillLabelBoxClass} line-clamp-2 ${cellOutline}`}
      >
        {label}
      </span>
    </span>
  );
}

function RoundedPillLabel({ label, selected }: { label: string; selected: boolean }) {
  return (
    <span className={filterFramedRoundedInnerClass(selected)}>{label}</span>
  );
}

export function FilterPill({
  label,
  tone = "fae-briefings",
  variant = "dotted",
  expanded: expandedProp,
  onExpandedChange,
  selected = false,
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
          filterDottedPillClassName(selected),
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
          cursorAndFadeClass,
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        data-tone={tone}
        data-variant="square"
      >
        <SquarePillFrame label={label} selected={selected} />
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
        `fae-control-filter-outer ${filterFramedOuterFocusClass} ${
          selected ? filterFramedRoundedOuterSelectedClass : ""
        } inline-flex items-baseline ${cursorAndFadeClass}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      data-tone={tone}
      data-variant="rounded"
    >
      <RoundedPillLabel label={label} selected={selected} />
    </button>
  );
}

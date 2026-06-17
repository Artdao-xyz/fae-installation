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
import { SquarePillFrame } from "./SquarePillFrame";

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
        <span className="block min-w-0 w-full truncate text-left font-fira-mono text-[12px] font-normal leading-4 max-lg:text-xs">
          {label}
        </span>
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
        <SquarePillFrame selected={selected} tone={selectedToneValue}>
          {label}
        </SquarePillFrame>
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

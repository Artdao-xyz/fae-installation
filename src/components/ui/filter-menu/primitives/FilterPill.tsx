"use client";

import { useState } from "react";
import type { FilterMenuCategoryTone } from "../config/filterMenuTones";

type FilterPillProps = {
  label: string;
  tone?: FilterMenuCategoryTone;
  expanded?: boolean;
  onExpandedChange?: (open: boolean) => void;
  /** Chip mode: `selected` is visual state; parent toggles via `onPress`. */
  selected?: boolean;
  onPress?: () => void;
};

export function FilterPill({
  label,
  tone = "fae-briefings",
  expanded: expandedProp,
  onExpandedChange,
  selected = false,
  onPress,
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
    if (onPress) {
      onPress();
      return;
    }
    if (!expandable) return;
    setOpen(!isOpen);
  };

  const innerMuted = selected
    ? "bg-text-primary text-white-fae"
    : "bg-white-fae text-text-primary";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-expanded={expandable ? isOpen : undefined}
      aria-pressed={onPress ? selected : undefined}
      className="flex cursor-pointer items-center border-[0.5px] border-solid border-text-primary bg-text-primary p-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary focus-visible:ring-offset-0"
      data-tone={tone}
    >
      <span
        className={`whitespace-nowrap rounded px-2.5 py-[5px] text-center font-mono text-xs font-normal leading-4 ${innerMuted}`}
      >
        {label}
      </span>
    </button>
  );
}
